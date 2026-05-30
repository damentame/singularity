import React, { useState, useRef, useEffect } from 'react';
import { X, User, Building2, Mail, Phone, MapPin, FileText, Tag, ChevronDown, Loader2, Heart, Briefcase, PartyPopper } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { createClient, CreateClientInput } from '@/data/clientDbStore';
import { COUNTRIES, POPULAR_COUNTRIES, getCountryByCode } from '@/data/countries';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CLIENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: Heart, desc: 'Couples planning their wedding' },
  { value: 'celebration', label: 'Celebration', icon: PartyPopper, desc: 'Birthday, anniversary, milestone' },
  { value: 'corporate', label: 'Corporate', icon: Briefcase, desc: 'Business events and conferences' },
] as const;

const STYLE_OPTIONS = [
  'Modern Minimalist', 'Classic Elegance', 'Bohemian', 'Rustic Chic',
  'Industrial', 'Tropical', 'Art Deco', 'Garden Party', 'Black Tie',
  'Whimsical', 'Mediterranean', 'Scandinavian', 'Vintage', 'Luxe Glam',
];

const AddClientModal: React.FC<AddClientModalProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAppContext();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form state
  const [clientType, setClientType] = useState<'wedding' | 'celebration' | 'corporate'>('wedding');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+27');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('ZA');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1);
      setClientType('wedding');
      setName('');
      setEmail('');
      setPhoneCode('+27');
      setPhone('');
      setCompanyName('');
      setCountry('ZA');
      setCity('');
      setNotes('');
      setSelectedStyles([]);
      setTags([]);
      setTagInput('');
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter the client name.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const input: CreateClientInput = {
        coordinator_id: user.id,
        client_type: clientType,
        primary_contact_name: name.trim(),
        primary_contact_email: email.trim(),
        primary_contact_phone_code: phoneCode,
        primary_contact_phone: phone.trim(),
        company_name: companyName.trim(),
        country,
        region: '',
        city: city.trim(),
        billing_address: '',
        vat_number: '',
        style_preferences: { styles: selectedStyles },
        budget_history: [],
        notes: notes.trim(),
        mood_board_refs: [],
        tags,
        is_active: true,
      };

      const result = await createClient(input);
      if (result) {
        toast({ title: 'Client Added', description: `${name} has been added to your directory.` });
        onCreated();
        onClose();
      } else {
        toast({ title: 'Error', description: 'Could not save client. Please try again.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : [...POPULAR_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)!), ...COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code))];

  if (!open) return null;

  const selectedCountry = getCountryByCode(country);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: `3px solid ${GOLD}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <div>
            <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
              Add New Client
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
          <div className="h-full transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%', backgroundColor: GOLD }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 1 && (
            <>
              {/* Client Type */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2 block">Client Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLIENT_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      onClick={() => setClientType(ct.value)}
                      className="p-3 rounded-xl border-2 text-center transition-all"
                      style={{
                        borderColor: clientType === ct.value ? GOLD : 'rgba(0,0,0,0.06)',
                        backgroundColor: clientType === ct.value ? 'rgba(201,162,74,0.04)' : 'transparent',
                      }}
                    >
                      <ct.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: clientType === ct.value ? GOLD : '#999' }} />
                      <span className="text-xs font-medium block" style={{ color: clientType === ct.value ? '#1A1A1A' : '#999' }}>{ct.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">
                  {clientType === 'corporate' ? 'Primary Contact Name' : 'Client Name'} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={clientType === 'wedding' ? 'e.g. Sarah & James' : 'Full name'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: 'rgba(0,0,0,0.08)', focusRingColor: GOLD } as any}
                  />
                </div>
              </div>

              {/* Company (corporate) */}
              {clientType === 'corporate' && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Company name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="client@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Phone</label>
                <div className="flex gap-2">
                  <div className="relative w-24">
                    <select
                      value={phoneCode}
                      onChange={e => setPhoneCode(e.target.value)}
                      className="w-full py-2.5 px-2 rounded-xl border text-xs focus:outline-none appearance-none bg-white"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Country</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm text-left"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    >
                      <span>{selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : 'Select'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg max-h-48 overflow-hidden" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                        <div className="p-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                          <input
                            value={countrySearch}
                            onChange={e => setCountrySearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2 py-1.5 text-xs rounded-lg border focus:outline-none"
                            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto">
                          {filteredCountries.map(c => (
                            <button
                              key={c.code}
                              onClick={() => {
                                setCountry(c.code);
                                setPhoneCode(c.dialCode);
                                setShowCountryDropdown(false);
                                setCountrySearch('');
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 transition-colors flex items-center gap-2"
                            >
                              <span>{c.flag}</span>
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Style Preferences */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2 block">Style Preferences</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_OPTIONS.map(style => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                      style={{
                        borderColor: selectedStyles.includes(style) ? GOLD : 'rgba(0,0,0,0.06)',
                        backgroundColor: selectedStyles.includes(style) ? 'rgba(201,162,74,0.08)' : 'transparent',
                        color: selectedStyles.includes(style) ? GOLD : '#666',
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Tags</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag and press Enter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                    />
                  </div>
                  <button onClick={addTag} className="px-4 py-2.5 rounded-xl text-xs font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:opacity-60">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5 block">Notes</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Any additional notes about this client..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          {step === 1 ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!name.trim()) {
                    toast({ title: 'Name Required', description: 'Please enter the client name.', variant: 'destructive' });
                    return;
                  }
                  setStep(2);
                }}
                className="px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:shadow-md"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:shadow-md disabled:opacity-50"
                  style={{ backgroundColor: GOLD, color: '#FFF' }}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
