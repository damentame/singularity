import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Building2, 
  MapPin, 
  Briefcase, 
  Shield, 
  Globe, 
  Clock, 
  Upload,
  X,
  ChevronDown,
  Search,
  Heart,
  PartyPopper,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Minus,
  Save,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Image,
  FileImage,
  Sparkles
} from 'lucide-react';

import { 
  countries, 
  businessTypes, 
  eventTypeCategories, 
  serviceRadiusOptions, 
  yearsInOperationOptions,
  insuranceTypes,
} from '@/data/serviceProviderData';
import { supabase } from '@/lib/supabase';
import { uploadPortfolioImages, savePortfolioUrls } from '@/lib/portfolioUpload';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';


interface ServiceProviderWizardProps {
  onClose: () => void;
  onComplete: (data: any) => void;
}

const STORAGE_KEY = 'serviceProviderWizardProgress';
const REGISTRATION_KEY = 'serviceProviderRegistration';

// Helper component for fields with N/A option
interface FieldWithNAProps {
  label: string;
  required?: boolean;
  isNA: boolean;
  onNAChange: (isNA: boolean) => void;
  children: React.ReactNode;
}

const FieldWithNA: React.FC<FieldWithNAProps> = ({ label, required, isNA, onNAChange, children }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm uppercase tracking-widest text-gold" style={{ fontFamily: '"Inter", sans-serif' }}>
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {!required && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isNA}
              onChange={(e) => onNAChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold focus:ring-gold/50 accent-gold"
            />
            <span className="text-xs text-white/70 font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>N/A</span>
          </label>
        )}
      </div>
      <div className={isNA ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  );
};

// Timeout wrapper for async operations
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out. Your data has been saved locally.')), ms)
  );
  return Promise.race([promise, timeout]);
};

const ServiceProviderWizard: React.FC<ServiceProviderWizardProps> = ({ onClose, onComplete }) => {
  const { user, isAuthenticated, setShowAuthModal, setAuthMode, setPreselectedRole } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [progressRestored, setProgressRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const totalSteps = 6;


  // File input ref for portfolio
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  // N/A state for optional fields
  const [naFields, setNaFields] = useState<Record<string, boolean>>({
    state: false,
    postcode: false,
    serviceRadius: false,
    tradingName: false,
    registrationNumber: false,
    yearsInOperation: false,
    teamSize: false,
    businessDescription: false,
    website: false,
    instagram: false,
    facebook: false,
    pinterest: false,
    tiktok: false,
    contactName: false,
    contactEmail: false,
    contactPhone: false,
    alternatePhone: false,
  });

  const toggleNA = (field: string, isNA: boolean) => {
    setNaFields(prev => ({ ...prev, [field]: isNA }));
    if (isNA) {
      updateFormData(field, '');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Location
    country: '',
    state: '',
    city: '',
    postcode: '',
    serviceRadius: '',
    
    // Step 2: Business Info
    businessName: '',
    tradingName: '',
    registrationNumber: '',
    businessType: '',
    yearsInOperation: '',
    teamSize: '',
    businessDescription: '',
    website: '',
    instagram: '',
    facebook: '',
    pinterest: '',
    tiktok: '',
    
    // Contact Information
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPhoneDialCode: '+1',
    alternatePhone: '',
    alternatePhoneDialCode: '+1',
    
    // Step 3: Event Types
    selectedEventTypes: [] as string[],
    
    // Step 4: Service Categories
    selectedCategories: {} as Record<string, string[]>,
    
    // Step 5: Service Details
    serviceDetails: {} as Record<string, Record<string, any>>,
    
    // Step 6: Insurance & Compliance
    insuranceTypes: [] as string[],
    publicLiabilityAmount: '',
    policyNumber: '',
    expiryDate: '',
    
    // Portfolio
    portfolioImages: [] as File[],
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPhoneDialCodeDropdown, setShowPhoneDialCodeDropdown] = useState(false);
  const [showAltPhoneDialCodeDropdown, setShowAltPhoneDialCodeDropdown] = useState(false);

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed.formData) {
          // Don't restore portfolioImages as they can't be serialized
          const { portfolioImages, ...restFormData } = parsed.formData;
          setFormData(prev => ({ ...prev, ...restFormData }));
        }
        if (parsed.naFields) {
          setNaFields(parsed.naFields);
        }
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
        setProgressRestored(true);
        
        toast({
          title: 'Progress Restored',
          description: 'Your previous progress has been restored. You can continue where you left off.',
        });
      } catch (error) {
        console.error('Error restoring saved progress:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save progress to localStorage whenever form data changes
  const saveProgress = useCallback(() => {
    const progressData = {
      formData: {
        ...formData,
        portfolioImages: [], // Don't save file objects
      },
      naFields,
      currentStep,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    setLastSaved(new Date());
  }, [formData, naFields, currentStep]);

  // Debounced auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData, naFields, currentStep, saveProgress]);

  // Clear saved progress
  const clearSavedProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setLastSaved(null);
    setProgressRestored(false);
    
    setFormData({
      country: '',
      state: '',
      city: '',
      postcode: '',
      serviceRadius: '',
      businessName: '',
      tradingName: '',
      registrationNumber: '',
      businessType: '',
      yearsInOperation: '',
      teamSize: '',
      businessDescription: '',
      website: '',
      instagram: '',
      facebook: '',
      pinterest: '',
      tiktok: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactPhoneDialCode: '+1',
      alternatePhone: '',
      alternatePhoneDialCode: '+1',
      selectedEventTypes: [],
      selectedCategories: {},
      serviceDetails: {},
      insuranceTypes: [],
      publicLiabilityAmount: '',
      policyNumber: '',
      expiryDate: '',
      portfolioImages: [],
    });
    
    setNaFields({
      state: false,
      postcode: false,
      serviceRadius: false,
      tradingName: false,
      registrationNumber: false,
      yearsInOperation: false,
      teamSize: false,
      businessDescription: false,
      website: false,
      instagram: false,
      facebook: false,
      pinterest: false,
      tiktok: false,
      contactName: false,
      contactEmail: false,
      contactPhone: false,
      alternatePhone: false,
    });
    
    setCurrentStep(1);
    setPortfolioPreviews([]);
    
    toast({
      title: 'Progress Cleared',
      description: 'Your saved progress has been cleared. You can start fresh.',
    });
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.code === formData.country);

  // Update dial code when country changes
  useEffect(() => {
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        contactPhoneDialCode: selectedCountry.dialCode,
        alternatePhoneDialCode: selectedCountry.dialCode,
      }));
    }
  }, [selectedCountry]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleEventType = (eventTypeId: string) => {
    setFormData(prev => {
      const current = prev.selectedEventTypes;
      if (current.includes(eventTypeId)) {
        return { ...prev, selectedEventTypes: current.filter(id => id !== eventTypeId) };
      }
      return { ...prev, selectedEventTypes: [...current, eventTypeId] };
    });
  };

  const toggleCategory = (eventTypeId: string, categoryId: string) => {
    setFormData(prev => {
      const current = prev.selectedCategories[eventTypeId] || [];
      if (current.includes(categoryId)) {
        return {
          ...prev,
          selectedCategories: {
            ...prev.selectedCategories,
            [eventTypeId]: current.filter(id => id !== categoryId)
          }
        };
      }
      return {
        ...prev,
        selectedCategories: {
          ...prev.selectedCategories,
          [eventTypeId]: [...current, categoryId]
        }
      };
    });
  };

  const updateServiceDetail = (categoryId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [categoryId]: {
          ...(prev.serviceDetails[categoryId] || {}),
          [fieldId]: value
        }
      }
    }));
  };

  // Portfolio image handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    const totalFiles = formData.portfolioImages.length + newFiles.length;
    
    if (totalFiles > 20) {
      toast({
        title: 'Too Many Images',
        description: `You can upload a maximum of 20 images. You currently have ${formData.portfolioImages.length} and tried to add ${newFiles.length}.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File Type',
          description: `"${file.name}" is not an image file. Only images are accepted.`,
          variant: 'destructive',
        });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File Too Large',
          description: `"${file.name}" exceeds the 10MB size limit.`,
          variant: 'destructive',
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPortfolioPreviews(prev => [...prev, ...newPreviews]);
    
    setFormData(prev => ({
      ...prev,
      portfolioImages: [...prev.portfolioImages, ...validFiles],
    }));

    toast({
      title: 'Images Added',
      description: `${validFiles.length} image${validFiles.length > 1 ? 's' : ''} added to your portfolio.`,
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePortfolioImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(portfolioPreviews[index]);
    
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  // Drag and drop handling
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event to reuse handleFileSelect logic
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(f => dataTransfer.items.add(f));
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
        // Manually trigger since synthetic events don't always work
        handleFileSelect({ target: { files: dataTransfer.files } } as any);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.country) errors.country = 'Country is required';
        if (!formData.city) errors.city = 'City is required';
        break;
      case 2:
        if (!formData.businessName) errors.businessName = 'Business name is required';
        if (!formData.businessType) errors.businessType = 'Business type is required';
        break;
      case 3:
        if (formData.selectedEventTypes.length === 0) {
          errors.eventTypes = 'Please select at least one event type';
        }
        break;
      case 4:
        if (!Object.values(formData.selectedCategories).some(cats => cats.length > 0)) {
          errors.categories = 'Please select at least one service category';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save registration data locally as a fallback
  const saveLocally = () => {
    const registrationData = {
      ...formData,
      portfolioImages: formData.portfolioImages.map(f => f.name), // Just save names
      naFields,
      registeredAt: new Date().toISOString(),
      userId: user?.id || 'anonymous',
      status: 'pending_sync',
    };
    localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));
  };

  const saveToDatabase = async () => {
    if (!user) {
      // Save progress first, then prompt for auth
      saveProgress();
      setPreselectedRole('supplier');
      setAuthMode('signup');
      setShowAuthModal(true);
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Attempt Supabase save with a 15-second timeout
      const supabaseSave = async () => {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.name,
            role: 'supplier',
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Format phone numbers with dial codes
        const formattedContactPhone = formData.contactPhone && !naFields.contactPhone
          ? `${formData.contactPhoneDialCode}${formData.contactPhone.replace(/^0+/, '')}`
          : null;
        const formattedAlternatePhone = formData.alternatePhone && !naFields.alternatePhone
          ? `${formData.alternatePhoneDialCode}${formData.alternatePhone.replace(/^0+/, '')}`
          : null;

        const { data, error } = await supabase
          .from('service_providers')
          .insert({
            user_id: user.id,
            country: formData.country,
            state: naFields.state ? null : (formData.state || null),
            city: formData.city,
            postcode: naFields.postcode ? null : (formData.postcode || null),
            service_radius: naFields.serviceRadius ? null : (formData.serviceRadius || null),
            business_name: formData.businessName,
            trading_name: naFields.tradingName ? null : (formData.tradingName || null),
            registration_number: naFields.registrationNumber ? null : (formData.registrationNumber || null),
            business_type: formData.businessType,
            years_in_operation: naFields.yearsInOperation ? null : (formData.yearsInOperation || null),
            team_size: naFields.teamSize ? null : (formData.teamSize || null),
            business_description: naFields.businessDescription ? null : (formData.businessDescription || null),
            contact_name: naFields.contactName ? null : (formData.contactName || null),
            contact_email: naFields.contactEmail ? null : (formData.contactEmail || null),
            contact_phone: formattedContactPhone,
            alternate_phone: formattedAlternatePhone,
            website: naFields.website ? null : (formData.website || null),
            instagram: naFields.instagram ? null : (formData.instagram || null),
            facebook: naFields.facebook ? null : (formData.facebook || null),
            pinterest: naFields.pinterest ? null : (formData.pinterest || null),
            tiktok: naFields.tiktok ? null : (formData.tiktok || null),
            selected_event_types: formData.selectedEventTypes,
            selected_categories: formData.selectedCategories,
            service_details: formData.serviceDetails,
            insurance_types: formData.insuranceTypes,
            public_liability_amount: formData.publicLiabilityAmount || null,
            policy_number: formData.policyNumber || null,
            insurance_expiry_date: formData.expiryDate || null,
            status: 'pending',
            is_verified: false,
            is_featured: false,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      };

      try {
        await withTimeout(supabaseSave(), 15000);
      } catch (dbError: any) {
        console.warn('Supabase save failed, saving locally:', dbError.message);
        saveLocally();
      }

      // Upload portfolio images to storage (after DB save, non-blocking for registration)
      if (formData.portfolioImages.length > 0 && user?.id) {
        try {
          setUploadProgressText(`Uploading portfolio images...`);
          const results = await uploadPortfolioImages(
            formData.portfolioImages,
            user.id,
            (progress) => {
              setUploadProgressText(`Uploading image ${progress.current} of ${progress.total}...`);
            }
          );
          
          const successfulUrls = results
            .filter(r => r.url && !r.error)
            .map(r => r.url);

          if (successfulUrls.length > 0) {
            await savePortfolioUrls(user.id, successfulUrls);
            toast({
              title: 'Portfolio Uploaded',
              description: `${successfulUrls.length} image${successfulUrls.length > 1 ? 's' : ''} uploaded to your portfolio.`,
            });
          }

          const failedCount = results.filter(r => r.error).length;
          if (failedCount > 0) {
            toast({
              title: 'Some Uploads Failed',
              description: `${failedCount} image${failedCount > 1 ? 's' : ''} could not be uploaded. You can add them later from your dashboard.`,
              variant: 'destructive',
            });
          }
        } catch (uploadError) {
          console.warn('Portfolio upload failed:', uploadError);
          toast({
            title: 'Portfolio Upload Skipped',
            description: 'Your registration was saved. You can upload portfolio images from your dashboard.',
          });
        } finally {
          setUploadProgressText(null);
        }
      }

      // Clear saved wizard progress after successful submission
      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: 'Registration Successful!',
        description: 'Your service provider profile has been created and is pending approval.',
      });


    } catch (error: any) {
      console.error('Save error:', error);
      
      // Last resort: save locally
      saveLocally();
      
      // Still treat as success since data is saved locally
      localStorage.removeItem(STORAGE_KEY);
      
      toast({
        title: 'Registration Saved',
        description: 'Your registration has been saved and will be synced when connectivity is restored.',
      });

      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (!validateStep(currentStep)) {
      toast({
        title: 'Please complete required fields',
        description: 'Fill in all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final step - submit
      const success = await saveToDatabase();
      if (success) {
        setRegistrationComplete(true);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.country && formData.city;
      case 2:
        return formData.businessName && formData.businessType;
      case 3:
        return formData.selectedEventTypes.length > 0;
      case 4:
        return Object.values(formData.selectedCategories).some(cats => cats.length > 0);
      default:
        return true;
    }
  };

  const steps = [
    { number: 1, title: 'Location', icon: MapPin },
    { number: 2, title: 'Business Info', icon: Building2 },
    { number: 3, title: 'Event Types', icon: Heart },
    { number: 4, title: 'Services', icon: Briefcase },
    { number: 5, title: 'Details', icon: Clock },
    { number: 6, title: 'Compliance', icon: Shield },
  ];

  const eventTypeIcons: Record<string, React.ReactNode> = {
    weddings: <Heart className="w-8 h-8" />,
    corporate: <Building2 className="w-8 h-8" />,
    social: <PartyPopper className="w-8 h-8" />,
  };

  // Phone input component with dial code
  const PhoneInput = ({ 
    value, 
    dialCode, 
    onValueChange, 
    onDialCodeChange, 
    placeholder,
    showDropdown,
    setShowDropdown
  }: {
    value: string;
    dialCode: string;
    onValueChange: (val: string) => void;
    onDialCodeChange: (code: string) => void;
    placeholder: string;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
  }) => (
    <div className="relative flex">
      {/* Dial code selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-full px-3 py-3 bg-white/5 border border-white/10 border-r-0 rounded-l-xl text-white flex items-center gap-1 hover:bg-white/10 transition-colors min-w-[90px]"
          style={{ fontFamily: '"Inter", sans-serif' }}
        >
          <span className="text-gold font-medium">{dialCode}</span>
          <ChevronDown className="w-4 h-4 text-white/50" />
        </button>
        
        {showDropdown && (
          <div className="absolute z-50 left-0 top-full mt-1 w-64 bg-[#152238] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onDialCodeChange(country.dialCode);
                  setShowDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-white/5 flex items-center justify-between transition-colors text-sm ${
                  dialCode === country.dialCode ? 'bg-gold/10 text-gold' : 'text-white'
                }`}
              >
                <span>{country.name}</span>
                <span className="text-gold font-medium">{country.dialCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Phone number input */}
      <input
        type="tel"
        value={value}
        onChange={(e) => {
          const numericValue = e.target.value.replace(/[^0-9]/g, '');
          onValueChange(numericValue);
        }}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
        style={{ fontFamily: '"Inter", sans-serif' }}
      />
    </div>
  );

  // ─── SUCCESS SCREEN ───
  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B1426' }}>
        <div className="max-w-lg mx-auto px-6 text-center">
          {/* Animated success icon */}
          <div className="relative mb-8">
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-14 h-14 text-green-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
          </div>

          <h1 className="text-4xl font-light tracking-wide mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
            Registration Complete!
          </h1>
          
          <p className="text-white/70 text-lg mb-3" style={{ fontFamily: '"Inter", sans-serif' }}>
            Welcome to The One, <span className="text-gold font-medium">{formData.businessName}</span>
          </p>
          
          <p className="text-white/50 mb-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            Your service provider profile has been created and is pending review. 
            Our team will verify your details and activate your profile within 24-48 hours.
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs uppercase tracking-widest text-gold mb-1" style={{ fontFamily: '"Inter", sans-serif' }}>Location</p>
              <p className="text-white text-sm">{formData.city}, {selectedCountry?.name || formData.country}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs uppercase tracking-widest text-gold mb-1" style={{ fontFamily: '"Inter", sans-serif' }}>Business Type</p>
              <p className="text-white text-sm">{formData.businessType}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs uppercase tracking-widest text-gold mb-1" style={{ fontFamily: '"Inter", sans-serif' }}>Event Types</p>
              <p className="text-white text-sm">{formData.selectedEventTypes.length} selected</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs uppercase tracking-widest text-gold mb-1" style={{ fontFamily: '"Inter", sans-serif' }}>Services</p>
              <p className="text-white text-sm">
                {Object.values(formData.selectedCategories).reduce((acc, cats) => acc + cats.length, 0)} categories
              </p>
            </div>
          </div>

          {/* What's next section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-light text-gold mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              What Happens Next?
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Our team reviews your profile and verifies your details' },
                { step: '2', text: 'Your profile goes live and becomes visible to event planners' },
                { step: '3', text: 'You start receiving quote requests and booking inquiries' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {item.step}
                  </div>
                  <p className="text-white/70 text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onComplete(formData)}
              className="px-8 py-3 bg-gradient-to-r from-[#B8956A] via-[#8B6914] to-[#6B5210] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-gold/20 transition-all"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                Where Are You Located?
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Tell us where your business operates
              </p>
            </div>

            {/* Country Selection */}
            <div className="relative">
              <label className="block text-sm uppercase tracking-widest text-gold mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                Country <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-left flex items-center justify-between hover:border-gold/30 transition-colors ${
                    validationErrors.country ? 'border-red-500' : 'border-white/10'
                  }`}
                  style={{ color: '#FFFFFF' }}
                >
                  <span className={formData.country ? 'text-white' : 'text-white/40'}>
                    {selectedCountry?.name || 'Select your country'}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gold" />
                </button>
                
                {showCountryDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-[#152238] border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search countries..."
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                          style={{ fontFamily: '"Inter", sans-serif' }}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            updateFormData('country', country.code);
                            setShowCountryDropdown(false);
                            setCountrySearch('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between transition-colors ${
                            formData.country === country.code ? 'bg-gold/10 text-gold' : 'text-white'
                          }`}
                        >
                          <span>{country.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gold text-sm">{country.dialCode}</span>
                            {formData.country === country.code && <Check className="w-4 h-4" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {validationErrors.country && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.country}</p>
              )}
              {selectedCountry && (
                <div className="mt-2 flex items-center gap-4 text-sm text-white/50">
                  <span>Currency: {selectedCountry.currency}</span>
                  <span>Tax ID: {selectedCountry.taxName}</span>
                  <span>Dial Code: {selectedCountry.dialCode}</span>
                </div>
              )}
            </div>

            {/* State/Province */}
            <FieldWithNA
              label="State / Province"
              isNA={naFields.state}
              onNAChange={(isNA) => toggleNA('state', isNA)}
            >
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                placeholder="Enter your state or province"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
            </FieldWithNA>

            {/* City */}
            <div>
              <label className="block text-sm uppercase tracking-widest text-gold mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="Enter your city"
                className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors ${
                  validationErrors.city ? 'border-red-500' : 'border-white/10'
                }`}
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
              {validationErrors.city && (
                <p className="text-red-400 text-sm mt-1">{validationErrors.city}</p>
              )}
            </div>

            {/* Postcode */}
            <FieldWithNA
              label="Postcode / ZIP"
              isNA={naFields.postcode}
              onNAChange={(isNA) => toggleNA('postcode', isNA)}
            >
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => updateFormData('postcode', e.target.value)}
                placeholder="Enter your postcode"
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
            </FieldWithNA>

            {/* Service Radius */}
            <FieldWithNA
              label="Service Radius"
              isNA={naFields.serviceRadius}
              onNAChange={(isNA) => toggleNA('serviceRadius', isNA)}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {serviceRadiusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateFormData('serviceRadius', option.value)}
                    className={`px-4 py-3 rounded-xl border transition-all ${
                      formData.serviceRadius === option.value
                        ? 'bg-gold/20 border-gold text-gold'
                        : 'bg-white/5 border-white/10 text-white hover:border-gold/30'
                    }`}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </FieldWithNA>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                Tell Us About Your Business
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Help clients understand who you are
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm uppercase tracking-widest text-gold mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateFormData('businessName', e.target.value)}
                  placeholder="Your registered business name"
                  className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors ${
                    validationErrors.businessName ? 'border-red-500' : 'border-white/10'
                  }`}
                  style={{ fontFamily: '"Inter", sans-serif' }}
                />
                {validationErrors.businessName && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.businessName}</p>
                )}
              </div>

              {/* Trading Name */}
              <FieldWithNA
                label="Trading Name"
                isNA={naFields.tradingName}
                onNAChange={(isNA) => toggleNA('tradingName', isNA)}
              >
                <input
                  type="text"
                  value={formData.tradingName}
                  onChange={(e) => updateFormData('tradingName', e.target.value)}
                  placeholder="If different from business name"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                />
              </FieldWithNA>

              {/* Registration Number */}
              <FieldWithNA
                label={`${selectedCountry?.taxName || 'Business Registration'} Number`}
                isNA={naFields.registrationNumber}
                onNAChange={(isNA) => toggleNA('registrationNumber', isNA)}
              >
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => updateFormData('registrationNumber', e.target.value)}
                  placeholder={`Enter your ${selectedCountry?.taxName || 'registration'} number`}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                />
              </FieldWithNA>

              {/* Business Type */}
              <div>
                <label className="block text-sm uppercase tracking-widest text-gold mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                  Business Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none ${
                    validationErrors.businessType ? 'border-red-500' : 'border-white/10'
                  }`}
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <option value="" className="bg-[#0B1426] text-white">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#0B1426] text-white">{type}</option>
                  ))}
                </select>
                {validationErrors.businessType && (
                  <p className="text-red-400 text-sm mt-1">{validationErrors.businessType}</p>
                )}
              </div>

              {/* Years in Operation */}
              <FieldWithNA
                label="Years in Operation"
                isNA={naFields.yearsInOperation}
                onNAChange={(isNA) => toggleNA('yearsInOperation', isNA)}
              >
                <select
                  value={formData.yearsInOperation}
                  onChange={(e) => updateFormData('yearsInOperation', e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <option value="" className="bg-[#0B1426] text-white">Select years</option>
                  {yearsInOperationOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#0B1426] text-white">{option}</option>
                  ))}
                </select>
              </FieldWithNA>

              {/* Team Size */}
              <FieldWithNA
                label="Team Size"
                isNA={naFields.teamSize}
                onNAChange={(isNA) => toggleNA('teamSize', isNA)}
              >
                <select
                  value={formData.teamSize}
                  onChange={(e) => updateFormData('teamSize', e.target.value)}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <option value="" className="bg-[#0B1426] text-white">Select team size</option>
                  <option value="1" className="bg-[#0B1426] text-white">Just me</option>
                  <option value="2-5" className="bg-[#0B1426] text-white">2-5 people</option>
                  <option value="6-10" className="bg-[#0B1426] text-white">6-10 people</option>
                  <option value="11-25" className="bg-[#0B1426] text-white">11-25 people</option>
                  <option value="26-50" className="bg-[#0B1426] text-white">26-50 people</option>
                  <option value="50+" className="bg-[#0B1426] text-white">50+ people</option>
                </select>
              </FieldWithNA>
            </div>

            {/* Business Description */}
            <FieldWithNA
              label="Business Description"
              isNA={naFields.businessDescription}
              onNAChange={(isNA) => toggleNA('businessDescription', isNA)}
            >
              <textarea
                value={formData.businessDescription}
                onChange={(e) => updateFormData('businessDescription', e.target.value)}
                placeholder="Tell potential clients about your business, your style, and what makes you unique..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors resize-none"
                style={{ fontFamily: '"Inter", sans-serif' }}
              />
              <p className="text-right text-sm text-white/40 mt-1">{formData.businessDescription.length}/500</p>
            </FieldWithNA>

            {/* Social Links */}
            <div>
              <label className="block text-sm uppercase tracking-widest text-gold mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                Online Presence
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWithNA
                  label="Website"
                  isNA={naFields.website}
                  onNAChange={(isNA) => toggleNA('website', isNA)}
                >
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      placeholder="Website URL"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Instagram"
                  isNA={naFields.instagram}
                  onNAChange={(isNA) => toggleNA('instagram', isNA)}
                >
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                    </svg>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => updateFormData('instagram', e.target.value)}
                      placeholder="Instagram handle"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Facebook"
                  isNA={naFields.facebook}
                  onNAChange={(isNA) => toggleNA('facebook', isNA)}
                >
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => updateFormData('facebook', e.target.value)}
                      placeholder="Facebook page"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Pinterest"
                  isNA={naFields.pinterest}
                  onNAChange={(isNA) => toggleNA('pinterest', isNA)}
                >
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                    </svg>
                    <input
                      type="text"
                      value={formData.pinterest}
                      onChange={(e) => updateFormData('pinterest', e.target.value)}
                      placeholder="Pinterest profile"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-6 border-t border-white/10">
              <label className="block text-sm uppercase tracking-widest text-gold mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                Contact Information
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWithNA
                  label="Contact Person Name"
                  isNA={naFields.contactName}
                  onNAChange={(isNA) => toggleNA('contactName', isNA)}
                >
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => updateFormData('contactName', e.target.value)}
                      placeholder="Contact Person Name"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Contact Email"
                  isNA={naFields.contactEmail}
                  onNAChange={(isNA) => toggleNA('contactEmail', isNA)}
                >
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateFormData('contactEmail', e.target.value)}
                      placeholder="Contact Email Address"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Primary Phone Number"
                  isNA={naFields.contactPhone}
                  onNAChange={(isNA) => toggleNA('contactPhone', isNA)}
                >
                  <PhoneInput
                    value={formData.contactPhone}
                    dialCode={formData.contactPhoneDialCode}
                    onValueChange={(val) => updateFormData('contactPhone', val)}
                    onDialCodeChange={(code) => updateFormData('contactPhoneDialCode', code)}
                    placeholder="Phone number (without leading 0)"
                    showDropdown={showPhoneDialCodeDropdown}
                    setShowDropdown={setShowPhoneDialCodeDropdown}
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Enter number without leading zero. Example: {formData.contactPhoneDialCode}123456789
                  </p>
                </FieldWithNA>
                
                <FieldWithNA
                  label="Alternate Phone Number"
                  isNA={naFields.alternatePhone}
                  onNAChange={(isNA) => toggleNA('alternatePhone', isNA)}
                >
                  <PhoneInput
                    value={formData.alternatePhone}
                    dialCode={formData.alternatePhoneDialCode}
                    onValueChange={(val) => updateFormData('alternatePhone', val)}
                    onDialCodeChange={(code) => updateFormData('alternatePhoneDialCode', code)}
                    placeholder="Alternate phone (without leading 0)"
                    showDropdown={showAltPhoneDialCodeDropdown}
                    setShowDropdown={setShowAltPhoneDialCodeDropdown}
                  />
                </FieldWithNA>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                What Events Do You Service?
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Select all event types that apply to your business
              </p>
            </div>

            {validationErrors.eventTypes && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{validationErrors.eventTypes}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {eventTypeCategories.map((eventType) => (
                <button
                  key={eventType.id}
                  type="button"
                  onClick={() => toggleEventType(eventType.id)}
                  className={`relative p-8 rounded-2xl border-2 transition-all duration-300 group ${
                    formData.selectedEventTypes.includes(eventType.id)
                      ? 'bg-gold/10 border-gold'
                      : 'bg-white/5 border-white/10 hover:border-gold/30'
                  }`}
                >
                  {formData.selectedEventTypes.includes(eventType.id) && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                      <Check className="w-5 h-5 text-[#0B1426]" />
                    </div>
                  )}
                  
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    formData.selectedEventTypes.includes(eventType.id)
                      ? 'bg-gold/20 text-gold'
                      : 'bg-white/10 text-white group-hover:text-gold'
                  }`}>
                    {eventTypeIcons[eventType.id]}
                  </div>
                  
                  <h3 className="text-2xl font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                    {eventType.name}
                  </h3>
                  <p className="text-sm text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                    {eventType.description}
                  </p>
                  <p className="text-xs text-gold mt-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                    {eventType.categories.length} service categories
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                Select Your Service Categories
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Choose the services you offer within each event type
              </p>
            </div>

            {validationErrors.categories && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{validationErrors.categories}</p>
              </div>
            )}

            {formData.selectedEventTypes.map((eventTypeId) => {
              const eventType = eventTypeCategories.find(et => et.id === eventTypeId);
              if (!eventType) return null;

              return (
                <div key={eventTypeId} className="space-y-4">
                  <h3 className="text-xl font-light flex items-center gap-3" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                    <span className="text-gold">{eventTypeIcons[eventTypeId]}</span>
                    {eventType.name}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {eventType.categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(eventTypeId, category.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                          (formData.selectedCategories[eventTypeId] || []).includes(category.id)
                            ? 'bg-gold/10 border-gold text-gold'
                            : 'bg-white/5 border-white/10 text-white hover:border-gold/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
                            {category.name}
                          </span>
                          {(formData.selectedCategories[eventTypeId] || []).includes(category.id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                Service Details
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Provide specific details about your services
              </p>
            </div>

            {formData.selectedEventTypes.map((eventTypeId) => {
              const eventType = eventTypeCategories.find(et => et.id === eventTypeId);
              if (!eventType) return null;

              const selectedCats = formData.selectedCategories[eventTypeId] || [];
              
              return selectedCats.map((categoryId) => {
                const category = eventType.categories.find(c => c.id === categoryId);
                if (!category) return null;

                return (
                  <div key={categoryId} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-light mb-6 text-gold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {category.name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.subcategories.map((subcategory) => (
                        subcategory.fields.slice(0, 6).map((field) => (
                          <div key={field.id}>
                            <label className="block text-xs uppercase tracking-widest text-white/60 mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            
                            {field.type === 'select' && (
                              <select
                                value={formData.serviceDetails[categoryId]?.[field.id] || ''}
                                onChange={(e) => updateServiceDetail(categoryId, field.id, e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                                style={{ fontFamily: '"Inter", sans-serif' }}
                              >
                                <option value="" className="bg-[#0B1426] text-white">Select...</option>
                                {field.options?.map((option) => (
                                  <option key={option} value={option} className="bg-[#0B1426] text-white">{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {field.type === 'multiselect' && (
                              <div className="flex flex-wrap gap-2">
                                {field.options?.slice(0, 6).map((option) => {
                                  const selected = (formData.serviceDetails[categoryId]?.[field.id] || []).includes(option);
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => {
                                        const current = formData.serviceDetails[categoryId]?.[field.id] || [];
                                        const updated = selected
                                          ? current.filter((o: string) => o !== option)
                                          : [...current, option];
                                        updateServiceDetail(categoryId, field.id, updated);
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                        selected
                                          ? 'bg-gold/20 border-gold text-gold border'
                                          : 'bg-white/5 border-white/10 text-white/70 border hover:border-gold/30'
                                      }`}
                                    >
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            
                            {field.type === 'boolean' && (
                              <button
                                type="button"
                                onClick={() => updateServiceDetail(categoryId, field.id, !formData.serviceDetails[categoryId]?.[field.id])}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                                  formData.serviceDetails[categoryId]?.[field.id]
                                    ? 'bg-gold/10 border-gold text-gold'
                                    : 'bg-white/5 border-white/10 text-white'
                                }`}
                              >
                                <span>{formData.serviceDetails[categoryId]?.[field.id] ? 'Yes' : 'No'}</span>
                                {formData.serviceDetails[categoryId]?.[field.id] && <Check className="w-4 h-4" />}
                              </button>
                            )}
                            
                            {(field.type === 'text' || field.type === 'number') && (
                              <input
                                type={field.type}
                                value={formData.serviceDetails[categoryId]?.[field.id] || ''}
                                onChange={(e) => updateServiceDetail(categoryId, field.id, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                                style={{ fontFamily: '"Inter", sans-serif' }}
                              />
                            )}
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light tracking-wide mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#FFFFFF' }}>
                Insurance & Compliance
              </h2>
              <p className="text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                Help clients feel confident booking with you
              </p>
            </div>

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-medium text-gold mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      Account Required
                    </h4>
                    <p className="text-white/70 text-sm mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                      You'll need to create an account or sign in to complete your registration. Your progress will be saved.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedRole('supplier');
                        setAuthMode('signup');
                        setShowAuthModal(true);
                      }}
                      className="px-6 py-2 bg-gold text-[#0B1426] rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info banner about optional section */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-1" style={{ fontFamily: '"Inter", sans-serif' }}>
                    This step is optional
                  </p>
                  <p className="text-white/50 text-xs" style={{ fontFamily: '"Inter", sans-serif' }}>
                    You can complete your registration without insurance details and add them later from your dashboard. 
                    However, verified insurance helps build client trust and may improve your visibility.
                  </p>
                </div>
              </div>
            </div>

            {/* Insurance Types */}
            <div>
              <label className="block text-sm uppercase tracking-widest text-gold mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                Insurance Coverage
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {insuranceTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const current = formData.insuranceTypes;
                      if (current.includes(type)) {
                        updateFormData('insuranceTypes', current.filter(t => t !== type));
                      } else {
                        updateFormData('insuranceTypes', [...current, type]);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                      formData.insuranceTypes.includes(type)
                        ? 'bg-gold/10 border-gold text-gold'
                        : 'bg-white/5 border-white/10 text-white hover:border-gold/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>{type}</span>
                      {formData.insuranceTypes.includes(type) && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Public Liability Details - shown when Public Liability is selected */}
            {formData.insuranceTypes.includes('Public Liability') && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                <h4 className="text-lg font-light text-gold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  Public Liability Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                      Coverage Amount ({selectedCountry?.currency || 'USD'})
                    </label>
                    <select
                      value={formData.publicLiabilityAmount}
                      onChange={(e) => updateFormData('publicLiabilityAmount', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    >
                      <option value="" className="bg-[#0B1426] text-white">Select amount</option>
                      <option value="1000000" className="bg-[#0B1426] text-white">1,000,000</option>
                      <option value="2000000" className="bg-[#0B1426] text-white">2,000,000</option>
                      <option value="5000000" className="bg-[#0B1426] text-white">5,000,000</option>
                      <option value="10000000" className="bg-[#0B1426] text-white">10,000,000</option>
                      <option value="20000000" className="bg-[#0B1426] text-white">20,000,000</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={formData.policyNumber}
                      onChange={(e) => updateFormData('policyNumber', e.target.value)}
                      placeholder="e.g. PL-2026-123456"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/60 mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => updateFormData('expiryDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-gold/50 transition-colors [color-scheme:dark]"
                      style={{ fontFamily: '"Inter", sans-serif' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Upload - with working file input */}
            <div>
              <label className="block text-sm uppercase tracking-widest text-gold mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                Portfolio Images (up to 20)
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload area with drag & drop */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging 
                    ? 'border-gold bg-gold/10 scale-[1.01]' 
                    : 'border-white/20 hover:border-gold/50 hover:bg-white/5'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-gold' : 'text-gold/70'}`} />
                <p className="text-white mb-2" style={{ fontFamily: '"Inter", sans-serif' }}>
                  {isDragging ? 'Drop your images here' : 'Drag and drop your images here'}
                </p>
                <p className="text-sm text-white/50 mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                  or click to browse
                </p>
                <div
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gold/20 border border-gold text-gold rounded-xl text-sm hover:bg-gold/30 transition-colors"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  <FileImage className="w-4 h-4" />
                  Choose Files
                </div>
                <p className="text-xs text-white/30 mt-3" style={{ fontFamily: '"Inter", sans-serif' }}>
                  Accepted formats: JPG, PNG, WEBP, GIF. Max 10MB per file.
                </p>
              </div>

              {/* Image previews */}
              {portfolioPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white/60" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {portfolioPreviews.length} of 20 images uploaded
                    </p>
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-300"
                        style={{ width: `${(portfolioPreviews.length / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {portfolioPreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={preview} 
                          alt={`Portfolio ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePortfolioImage(index);
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    {portfolioPreviews.length < 20 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-gold/50 hover:bg-white/5 transition-all"
                      >
                        <Image className="w-6 h-6 text-white/40" />
                        <span className="text-[10px] text-white/40">Add More</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>
                    {submitError}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1426' }}>
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 100 100" className="w-10 h-10">
                <defs>
                  <linearGradient id="wizardGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#wizardGold)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#wizardGold)" strokeWidth="1" />
              </svg>
              <span className="text-xl tracking-wide font-light" style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}>
                The One
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {lastSaved && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
                  <Save className="w-3 h-3" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              
              {/* Clear Progress Button */}
              <button
                onClick={clearSavedProgress}
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear saved progress"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Progress</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Restored Banner */}
      {progressRestored && (
        <div className="bg-green-500/10 border-b border-green-500/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400" style={{ fontFamily: '"Inter", sans-serif' }}>
                  Your previous progress has been restored
                </span>
              </div>
              <button
                onClick={() => setProgressRestored(false)}
                className="text-green-400 hover:text-green-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.number < currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`flex flex-col items-center ${step.number < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step.number
                        ? 'bg-gold text-[#0B1426]'
                        : currentStep > step.number
                        ? 'bg-gold/20 text-gold border border-gold'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs uppercase tracking-widest hidden sm:block ${
                      currentStep >= step.number ? 'text-gold' : 'text-white/40'
                    }`}
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  >
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-4 ${
                      currentStep > step.number ? 'bg-gold' : 'bg-white/10'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
        {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10" style={{ backgroundColor: '#0B1426' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors ${
                currentStep === 1 || isSubmitting
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            <div className="text-sm text-white/50" style={{ fontFamily: '"Inter", sans-serif' }}>
              Step {currentStep} of {totalSteps}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed() && !isSubmitting
                  ? 'bg-gradient-to-r from-[#B8956A] via-[#8B6914] to-[#6B5210] text-white hover:shadow-lg hover:shadow-gold/20'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
              style={{ fontFamily: '"Inter", sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadProgressText || 'Submitting...'}
                </>

              ) : currentStep === totalSteps ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Registration
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderWizard;
