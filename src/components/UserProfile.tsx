import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { COUNTRIES, POPULAR_COUNTRIES } from '@/data/countries';
import { 
  ArrowLeft, Camera, Save, Loader2, User, Mail, Phone, Building2, 
  MapPin, Globe, Check, Shield, Clock
} from 'lucide-react';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;
  city: string;
  avatarUrl: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
}

const UserProfile: React.FC = () => {
  const { user, setCurrentView, routeToRoleDashboard, refreshProfile } = useAppContext();
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    country: '',
    city: '',
    avatarUrl: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalData = useRef<ProfileFormData | null>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const loaded: ProfileFormData = {
          fullName: profile.full_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
          companyName: profile.company_name || '',
          country: profile.country || '',
          city: profile.city || '',
          avatarUrl: profile.avatar_url || '',
        };
        setFormData(loaded);
        originalData.current = { ...loaded };
        if (profile.updated_at) {
          setLastSaved(new Date(profile.updated_at));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast({ title: 'Error', description: 'Failed to load profile data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  // Track changes
  useEffect(() => {
    if (!originalData.current) return;
    const changed = Object.keys(formData).some(
      key => formData[key as keyof ProfileFormData] !== originalData.current![key as keyof ProfileFormData]
    );
    setHasChanges(changed);
  }, [formData]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^[+\d\s()-]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          company_name: formData.companyName.trim() || null,
          country: formData.country || null,
          city: formData.city.trim() || null,
          avatar_url: formData.avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // If email changed, update auth email too
      if (formData.email.trim() !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email.trim(),
        });
        if (emailError) {
          toast({
            title: 'Email Update',
            description: 'Profile saved, but email change requires confirmation. Check your inbox.',
          });
        }
      }

      originalData.current = { ...formData };
      setHasChanges(false);
      setLastSaved(new Date());

      // Refresh the user in context
      await refreshProfile();

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (err: any) {
      console.error('Save error:', err);
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('supplier-media')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('supplier-media')
        .getPublicUrl(path);

      setFormData(prev => ({ ...prev, avatarUrl: urlData.publicUrl }));
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast({ title: 'Upload Failed', description: 'Could not upload avatar.', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Filter countries
  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : [
        ...POPULAR_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)!).filter(Boolean),
        ...COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code)),
      ];

  const selectedCountry = COUNTRIES.find(c => c.name === formData.country || c.code === formData.country);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF7' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => user ? routeToRoleDashboard(user.role) : setCurrentView('home')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-10">
          <h1 
            className="text-3xl font-light tracking-wide mb-2"
            style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            My Profile
          </h1>
          <p className="text-white/50 text-sm">
            Manage your account settings and personal information
          </p>
          {lastSaved && (
            <div className="flex items-center gap-1.5 mt-3 text-white/30 text-xs">
              <Clock className="w-3 h-3" />
              <span>Last saved {lastSaved.toLocaleDateString()} at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Avatar Section */}
          <div className="p-8 border-b border-white/[0.06] flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-white/10 flex items-center justify-center">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span 
                    className="text-3xl font-light"
                    style={{ color: '#B8956A', fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    {formData.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-gold flex items-center justify-center shadow-lg hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#0B1426' }} />
                ) : (
                  <Camera className="w-4 h-4" style={{ color: '#0B1426' }} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-xl text-white font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {formData.fullName || 'Your Name'}
              </h2>
              <p className="text-white/40 text-sm mt-1">{formData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] uppercase tracking-wider font-medium">
                  <Shield className="w-3 h-3" />
                  {user?.role === 'supplier' ? 'Service Provider' : user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-7">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <User className="w-3.5 h-3.5" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={`w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all ${
                  errors.fullName ? 'border-red-500/50' : 'border-white/[0.1] focus:border-gold/40'
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-2">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all ${
                  errors.email ? 'border-red-500/50' : 'border-white/[0.1] focus:border-gold/40'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-2">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <Phone className="w-3.5 h-3.5" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all ${
                  errors.phone ? 'border-red-500/50' : 'border-white/[0.1] focus:border-gold/40'
                }`}
                placeholder="+27 82 123 4567"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-2">{errors.phone}</p>}
            </div>

            {/* Company Name */}
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <Building2 className="w-3.5 h-3.5" />
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                placeholder="Your company or business name"
              />
            </div>

            {/* Country */}
            <div className="relative">
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <Globe className="w-3.5 h-3.5" />
                Country
              </label>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-left text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all flex items-center justify-between"
              >
                <span className={formData.country ? 'text-white' : 'text-white/25'}>
                  {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Select your country'}
                </span>
                <svg className={`w-4 h-4 text-white/40 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCountryDropdown && (
                <div className="absolute z-50 mt-2 w-full bg-[#1a2744] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-white/10">
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search countries..."
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder-white/30 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {!countrySearch && (
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/30">Popular</div>
                    )}
                    {filteredCountries.map((country, idx) => (
                      <React.Fragment key={country.code}>
                        {!countrySearch && idx === POPULAR_COUNTRIES.length && (
                          <div className="border-t border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/30 mt-1">All Countries</div>
                        )}
                        <button
                          onClick={() => {
                            handleChange('country', country.name);
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/[0.06] flex items-center gap-3 transition-colors"
                        >
                          <span className="text-base">{country.flag}</span>
                          <span>{country.name}</span>
                          {(formData.country === country.name || formData.country === country.code) && (
                            <Check className="w-4 h-4 text-gold ml-auto" />
                          )}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* City */}
            <div>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/50 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                placeholder="Your city"
              />
            </div>
          </div>

          {/* Save Bar */}
          <div className="p-8 border-t border-white/[0.06] flex items-center justify-between">
            <div className="text-sm">
              {hasChanges ? (
                <span className="text-amber-400/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes
                </span>
              ) : (
                <span className="text-white/30 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  All changes saved
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2.5 px-8 py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-xl font-medium text-xs uppercase tracking-[0.15em] hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#0B1426' }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="mt-8 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <h3 className="text-lg text-white font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Security
          </h3>
          <p className="text-white/40 text-xs mb-6">Manage your account security settings</p>
          
          <div className="flex items-center justify-between py-4 border-t border-white/[0.06]">
            <div>
              <p className="text-sm text-white">Password</p>
              <p className="text-xs text-white/40 mt-0.5">Change your account password</p>
            </div>
            <button
              onClick={async () => {
                if (!user?.email) return;
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                    redirectTo: window.location.origin,
                  });
                  if (error) throw error;
                  toast({
                    title: 'Password Reset Email Sent',
                    description: 'Check your email for a link to reset your password.',
                  });
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.message || 'Could not send password reset email.',
                    variant: 'destructive',
                  });
                }
              }}
              className="px-5 py-2.5 rounded-xl border border-white/[0.15] text-white/70 text-xs uppercase tracking-wider hover:bg-white/[0.05] hover:border-gold/30 hover:text-gold transition-all"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Close country dropdown on outside click */}
      {showCountryDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowCountryDropdown(false); setCountrySearch(''); }} />
      )}
    </div>
  );
};

export default UserProfile;
