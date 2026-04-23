import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Users, DollarSign,
  Building2, Palette, FileText, ChevronRight, ChevronLeft,
  Save, Download, Check, X, Globe, Heart, Briefcase, Star,
  Plus, Minus, AlertCircle, Loader2, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import ColorSchemePicker from './ColorSchemePicker';
import {
  countryCodes,
  countryNameToCode,
  eventTypes,
  styleDescriptions,
  vendorCategories,
  QuestionnaireData,
  defaultQuestionnaireData,
  CountryCode,
  colorPalette,
} from '@/data/questionnaireData';
import { suppliers } from '@/data/suppliers';

// Common input styling for visibility
const inputStyles = "bg-white text-[#1e3a5f] placeholder:text-gray-400 border-gray-300";
const textareaStyles = "bg-white text-[#1e3a5f] placeholder:text-gray-400 border-gray-300";

const EventPlanningWizard: React.FC = () => {
  const [formData, setFormData] = useState<QuestionnaireData>(defaultQuestionnaireData);
  const [activeTab, setActiveTab] = useState('client');
  const [naFields, setNaFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Get unique countries from suppliers for venue selection
  const venueCountries = Array.from(new Set(suppliers.map(s => s.country))).sort();
  const venueCities = formData.venueCountry
    ? Array.from(new Set(suppliers.filter(s => s.country === formData.venueCountry).map(s => s.city))).sort()
    : [];

  // Auto-detect country code based on venue country
  useEffect(() => {
    if (formData.venueCountry) {
      const countryCode = countryNameToCode[formData.venueCountry];
      if (countryCode && !naFields.has('clientPhoneCountry')) {
        setFormData(prev => ({
          ...prev,
          clientPhoneCountry: countryCode,
          secondaryContactPhoneCountry: countryCode,
        }));
      }
    }
  }, [formData.venueCountry]);



  const getCountryByCode = (code: string): CountryCode | undefined => {
    return countryCodes.find(c => c.code === code);
  };

  const updateField = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleNaField = (field: string) => {
    setNaFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const toggleVendorRequired = (vendor: string) => {
    const current = formData.vendorsRequired;
    if (current.includes(vendor)) {
      updateField('vendorsRequired', current.filter(v => v !== vendor));
    } else {
      // Remove from not required if adding to required
      updateField('vendorsNotRequired', formData.vendorsNotRequired.filter(v => v !== vendor));
      updateField('vendorsRequired', [...current, vendor]);
    }
  };

  const toggleVendorNotRequired = (vendor: string) => {
    const current = formData.vendorsNotRequired;
    if (current.includes(vendor)) {
      updateField('vendorsNotRequired', current.filter(v => v !== vendor));
    } else {
      // Remove from required if adding to not required
      updateField('vendorsRequired', formData.vendorsRequired.filter(v => v !== vendor));
      updateField('vendorsNotRequired', [...current, vendor]);
    }
  };

  const toggleStyle = (styleId: string) => {
    const current = formData.selectedStyles;
    if (current.includes(styleId)) {
      updateField('selectedStyles', current.filter(s => s !== styleId));
    } else if (current.length < 5) {
      updateField('selectedStyles', [...current, styleId]);
    }
  };



  const saveQuestionnaire = () => {
    localStorage.setItem('event_questionnaire', JSON.stringify(formData));
    toast({
      title: 'Questionnaire Saved',
      description: 'Your responses have been saved locally.',
    });
  };

  const exportQuestionnaire = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-questionnaire-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit questionnaire via edge function
  const submitQuestionnaire = async () => {
    // Basic validation
    if (!formData.clientFirstName || !formData.clientEmail) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least your first name and email address.',
        variant: 'destructive',
      });
      setActiveTab('client');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('submit-questionnaire', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setIsSubmitted(true);
        setSubmissionId(data.submissionId);
        
        // Clear local storage after successful submission
        localStorage.removeItem('event_questionnaire');
        
        toast({
          title: 'Questionnaire Submitted!',
          description: 'Thank you! We\'ve received your questionnaire and will be in touch soon.',
        });
      } else {
        throw new Error(data?.error || 'Failed to submit questionnaire');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'There was an error submitting your questionnaire. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to start a new questionnaire
  const startNewQuestionnaire = () => {
    setFormData(defaultQuestionnaireData);
    setIsSubmitted(false);
    setSubmissionId(null);
    setActiveTab('client');
  };

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('event_questionnaire');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved questionnaire');
      }
    }
  }, []);



  const renderNaButton = (field: string) => (
    <Button
      type="button"
      variant={naFields.has(field) ? 'default' : 'outline'}
      size="sm"
      onClick={() => toggleNaField(field)}
      className={`ml-2 text-xs ${naFields.has(field) ? 'bg-gray-500' : ''}`}
    >
      N/A
    </Button>
  );

  const renderPhoneInput = (
    phoneField: 'clientPhone' | 'secondaryContactPhone',
    countryField: 'clientPhoneCountry' | 'secondaryContactPhoneCountry',
    label: string
  ) => {
    const selectedCountry = getCountryByCode(formData[countryField]);
    const isNa = naFields.has(phoneField);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {renderNaButton(phoneField)}
        </div>
        <div className={`flex gap-2 ${isNa ? 'opacity-50' : ''}`}>
          <Select
            value={formData[countryField]}
            onValueChange={(value) => updateField(countryField, value)}
            disabled={isNa}
          >
            <SelectTrigger className={`w-[140px] ${inputStyles}`}>
              <SelectValue>
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.dialCode}</span>
                  </span>
                ) : (
                  'Select'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white">
              {countryCodes.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.dialCode}</span>
                    <span className="text-gray-500 text-sm">{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">+</span>
            <Input
              type="tel"
              value={formData[phoneField]}
              onChange={(e) => updateField(phoneField, e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Phone number"
              className={`pl-7 ${inputStyles}`}
              disabled={isNa}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Country code auto-detected from event location. Change manually if different.
        </p>
      </div>
    );
  };

  // Show success screen after submission
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Questionnaire Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Thank you for completing your event questionnaire. We've sent a confirmation email to{' '}
              <span className="font-medium text-gray-900">{formData.clientEmail}</span> and our team will be in touch within 24-48 hours.
            </p>
            
            {submissionId && (
              <div className="bg-white rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-gray-500">Reference ID</p>
                <p className="font-mono text-lg font-semibold text-[#1e3a5f]">{submissionId}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500">What happens next?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-rose-600 font-semibold">1</span>
                  </div>
                  <p className="text-sm text-gray-600">Our team reviews your submission</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 font-semibold">2</span>
                  </div>
                  <p className="text-sm text-gray-600">We match you with perfect vendors</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <p className="text-sm text-gray-600">You receive a personalized proposal</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Button onClick={startNewQuestionnaire} variant="outline" className="mr-3">
                <Plus className="w-4 h-4 mr-2" />
                Start New Questionnaire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Planning Questionnaire</h1>
        <p className="text-gray-600">Complete this questionnaire to help us understand your event requirements.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="client" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Client Info</span>
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Event Details</span>
          </TabsTrigger>
          <TabsTrigger value="venue" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Venue & Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Style & Colors</span>
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Additional</span>
          </TabsTrigger>
        </TabsList>



        {/* Client Information Tab */}
        <TabsContent value="client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                Primary Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>First Name</Label>
                    {renderNaButton('clientFirstName')}
                  </div>
                  <Input
                    value={formData.clientFirstName}
                    onChange={(e) => updateField('clientFirstName', e.target.value)}
                    placeholder="First name"
                    disabled={naFields.has('clientFirstName')}
                    className={`${inputStyles} ${naFields.has('clientFirstName') ? 'opacity-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Last Name</Label>
                    {renderNaButton('clientLastName')}
                  </div>
                  <Input
                    value={formData.clientLastName}
                    onChange={(e) => updateField('clientLastName', e.target.value)}
                    placeholder="Last name"
                    disabled={naFields.has('clientLastName')}
                    className={`${inputStyles} ${naFields.has('clientLastName') ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Address</Label>
                  {renderNaButton('clientEmail')}
                </div>
                <div className={`relative ${naFields.has('clientEmail') ? 'opacity-50' : ''}`}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => updateField('clientEmail', e.target.value)}
                    placeholder="email@example.com"
                    className={`pl-10 ${inputStyles}`}
                    disabled={naFields.has('clientEmail')}
                  />
                </div>
                <p className="text-xs text-gray-500">Enter your email address</p>
              </div>

              {renderPhoneInput('clientPhone', 'clientPhoneCountry', 'Phone Number')}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>City</Label>
                    {renderNaButton('clientCity')}
                  </div>
                  <Input
                    value={formData.clientCity}
                    onChange={(e) => updateField('clientCity', e.target.value)}
                    placeholder="City"
                    disabled={naFields.has('clientCity')}
                    className={`${inputStyles} ${naFields.has('clientCity') ? 'opacity-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Country</Label>
                    {renderNaButton('clientCountry')}
                  </div>
                  <Select
                    value={formData.clientCountry}
                    onValueChange={(value) => updateField('clientCountry', value)}
                    disabled={naFields.has('clientCountry')}
                  >
                    <SelectTrigger className={`${inputStyles} ${naFields.has('clientCountry') ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {countryCodes.map(country => (
                        <SelectItem key={country.code} value={country.name}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Address</Label>
                  {renderNaButton('clientAddress')}
                </div>
                <Textarea
                  value={formData.clientAddress}
                  onChange={(e) => updateField('clientAddress', e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  disabled={naFields.has('clientAddress')}
                  className={`${textareaStyles} ${naFields.has('clientAddress') ? 'opacity-50' : ''}`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Secondary Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Full Name</Label>
                    {renderNaButton('secondaryContactName')}
                  </div>
                  <Input
                    value={formData.secondaryContactName}
                    onChange={(e) => updateField('secondaryContactName', e.target.value)}
                    placeholder="Secondary contact name"
                    disabled={naFields.has('secondaryContactName')}
                    className={`${inputStyles} ${naFields.has('secondaryContactName') ? 'opacity-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Relationship</Label>
                    {renderNaButton('secondaryContactRelation')}
                  </div>
                  <Select
                    value={formData.secondaryContactRelation}
                    onValueChange={(value) => updateField('secondaryContactRelation', value)}
                    disabled={naFields.has('secondaryContactRelation')}
                  >
                    <SelectTrigger className={`${inputStyles} ${naFields.has('secondaryContactRelation') ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="spouse">Spouse / Partner</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="planner">Wedding Planner</SelectItem>
                      <SelectItem value="coordinator">Event Coordinator</SelectItem>
                      <SelectItem value="assistant">Personal Assistant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Address</Label>
                  {renderNaButton('secondaryContactEmail')}
                </div>
                <div className={`relative ${naFields.has('secondaryContactEmail') ? 'opacity-50' : ''}`}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.secondaryContactEmail}
                    onChange={(e) => updateField('secondaryContactEmail', e.target.value)}
                    placeholder="email@example.com"
                    className={`pl-10 ${inputStyles}`}
                    disabled={naFields.has('secondaryContactEmail')}
                  />
                </div>
              </div>

              {renderPhoneInput('secondaryContactPhone', 'secondaryContactPhoneCountry', 'Secondary Contact Phone')}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setActiveTab('event')} className="bg-rose-500 hover:bg-rose-600">
              Next: Event Details
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Event Details Tab */}
        <TabsContent value="event" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Event Type & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>What type of event is this?</Label>
                  {renderNaButton('eventType')}
                </div>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => updateField('eventType', value)}
                  disabled={naFields.has('eventType')}
                >
                  <SelectTrigger className={`${inputStyles} ${naFields.has('eventType') ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {eventTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Additional Comments (if event type not listed above)</Label>
                <Textarea
                  value={formData.eventTypeComments}
                  onChange={(e) => updateField('eventTypeComments', e.target.value)}
                  placeholder="Describe your event if it doesn't fit the categories above..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Event Start Date</Label>
                    {renderNaButton('eventDate')}
                  </div>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => updateField('eventDate', e.target.value)}
                    disabled={naFields.has('eventDate')}
                    className={`${inputStyles} ${naFields.has('eventDate') ? 'opacity-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Event End Date (if multi-day)</Label>
                    {renderNaButton('eventEndDate')}
                  </div>
                  <Input
                    type="date"
                    value={formData.eventEndDate}
                    onChange={(e) => updateField('eventEndDate', e.target.value)}
                    disabled={naFields.has('eventEndDate')}
                    className={`${inputStyles} ${naFields.has('eventEndDate') ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Expected Guest Count</Label>
                    {renderNaButton('guestCount')}
                  </div>
                  <div className={`flex items-center gap-2 ${naFields.has('guestCount') ? 'opacity-50' : ''}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => updateField('guestCount', Math.max(0, formData.guestCount - 10))}
                      disabled={naFields.has('guestCount')}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={formData.guestCount}
                      onChange={(e) => updateField('guestCount', parseInt(e.target.value) || 0)}
                      className={`text-center ${inputStyles}`}
                      disabled={naFields.has('guestCount')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => updateField('guestCount', formData.guestCount + 10)}
                      disabled={naFields.has('guestCount')}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Estimated Budget</Label>
                    {renderNaButton('eventBudget')}
                  </div>
                  <Select
                    value={formData.eventBudget}
                    onValueChange={(value) => updateField('eventBudget', value)}
                    disabled={naFields.has('eventBudget')}
                  >
                    <SelectTrigger className={`${inputStyles} ${naFields.has('eventBudget') ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="under-10k">Under $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                      <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                      <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                      <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                      <SelectItem value="over-1m">Over $1,000,000</SelectItem>
                      <SelectItem value="flexible">Flexible / TBD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('client')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setActiveTab('venue')} className="bg-rose-500 hover:bg-rose-600">
              Next: Venue & Vendors
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Venue & Vendors Tab */}
        <TabsContent value="venue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-500" />
                Venue Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Event Country</Label>
                    {renderNaButton('venueCountry')}
                  </div>
                  <Select
                    value={formData.venueCountry}
                    onValueChange={(value) => {
                      updateField('venueCountry', value);
                      updateField('venueCity', '');
                    }}
                    disabled={naFields.has('venueCountry')}
                  >
                    <SelectTrigger className={`${inputStyles} ${naFields.has('venueCountry') ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {venueCountries.map(country => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    This will auto-set the phone country code for contacts
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Event City</Label>
                    {renderNaButton('venueCity')}
                  </div>
                  <Select
                    value={formData.venueCity}
                    onValueChange={(value) => updateField('venueCity', value)}
                    disabled={naFields.has('venueCity') || !formData.venueCountry}
                  >
                    <SelectTrigger className={`${inputStyles} ${naFields.has('venueCity') ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder={formData.venueCountry ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {venueCities.map(city => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Venue Name (if known)</Label>
                  {renderNaButton('venueName')}
                </div>
                <Select
                  value={formData.venueName}
                  onValueChange={(value) => updateField('venueName', value)}
                  disabled={naFields.has('venueName')}
                >
                  <SelectTrigger className={`${inputStyles} ${naFields.has('venueName') ? 'opacity-50' : ''}`}>
                    <SelectValue placeholder="Select from our database or enter manually" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="tbd">To Be Determined</SelectItem>
                    {suppliers
                      .filter(s => s.category === 'Venues')
                      .filter(s => !formData.venueCountry || s.country === formData.venueCountry)
                      .filter(s => !formData.venueCity || s.city === formData.venueCity)
                      .map(venue => (
                        <SelectItem key={venue.id} value={venue.name}>
                          <div className="flex flex-col">
                            <span>{venue.name}</span>
                            <span className="text-xs text-gray-500">{venue.city}, {venue.country}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Vendor Requirements
              </CardTitle>
              <p className="text-sm text-gray-500">
                Select vendors from our database. These will be fetched and matched to your event.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vendors Required */}
                <div className="space-y-3">
                  <Label className="text-green-600 font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Vendors Required
                  </Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3 bg-white">
                    {vendorCategories.map(vendor => {
                      const isRequired = formData.vendorsRequired.includes(vendor);
                      const supplierCount = suppliers.filter(s => s.category === vendor).length;
                      
                      return (
                        <div
                          key={`req-${vendor}`}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isRequired ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleVendorRequired(vendor)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isRequired} />
                            <span className={isRequired ? 'font-medium text-green-700' : 'text-[#1e3a5f]'}>{vendor}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {supplierCount} available
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vendors Not Required */}
                <div className="space-y-3">
                  <Label className="text-red-600 font-semibold flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Vendors Not Required
                  </Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3 bg-white">
                    {vendorCategories.map(vendor => {
                      const isNotRequired = formData.vendorsNotRequired.includes(vendor);
                      
                      return (
                        <div
                          key={`not-req-${vendor}`}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isNotRequired ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleVendorNotRequired(vendor)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isNotRequired} />
                            <span className={isNotRequired ? 'font-medium text-red-700' : 'text-[#1e3a5f]'}>{vendor}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vendor Comments / Special Requirements</Label>
                <Textarea
                  value={formData.vendorComments}
                  onChange={(e) => updateField('vendorComments', e.target.value)}
                  placeholder="Any specific requirements for vendors, preferred suppliers, or additional notes..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('event')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setActiveTab('style')} className="bg-rose-500 hover:bg-rose-600">
              Next: Style & Colors
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Style & Colors Tab */}
        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Describe Your Style in 3-5 Words
              </CardTitle>
              <p className="text-sm text-gray-500">
                Select up to 5 style descriptions that best represent your vision
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {styleDescriptions.map(style => {
                  const isSelected = formData.selectedStyles.includes(style.id);
                  const isDisabled = !isSelected && formData.selectedStyles.length >= 5;
                  
                  return (
                    <div
                      key={style.id}
                      onClick={() => !isDisabled && toggleStyle(style.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isSelected ? 'text-rose-700' : 'text-[#1e3a5f]'}`}>
                          {style.label}
                        </span>
                        {isSelected && <Check className="w-5 h-5 text-rose-500" />}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {style.keywords.map(keyword => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-sm text-gray-500 text-center">
                {formData.selectedStyles.length} of 5 styles selected
              </div>

              <div className="space-y-2">
                <Label>Additional Style Comments</Label>
                <Textarea
                  value={formData.styleComments}
                  onChange={(e) => updateField('styleComments', e.target.value)}
                  placeholder="Describe any additional style preferences, inspirations, or themes..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-500" />
                Color Palette Ideas
              </CardTitle>
              <p className="text-sm text-gray-500">
                Select colors that will automatically pull through to your client proposal
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ColorSchemePicker
                selectedColors={formData.selectedColors}
                onColorsChange={(colors) => updateField('selectedColors', colors)}
                maxColors={5}
              />

              <div className="space-y-2">
                <Label>Color Notes / Comments</Label>
                <Textarea
                  value={formData.colorComments}
                  onChange={(e) => updateField('colorComments', e.target.value)}
                  placeholder="Any specific color preferences, combinations to avoid, or inspiration sources..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('venue')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setActiveTab('additional')} className="bg-rose-500 hover:bg-rose-600">
              Next: Additional Info
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(e) => updateField('additionalNotes', e.target.value)}
                  placeholder="Any other information you'd like us to know..."
                  rows={4}
                  className={textareaStyles}
                />
              </div>

              <div className="space-y-2">
                <Label>Special Requirements</Label>
                <Textarea
                  value={formData.specialRequirements}
                  onChange={(e) => updateField('specialRequirements', e.target.value)}
                  placeholder="Accessibility needs, cultural considerations, religious requirements..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>

              <div className="space-y-2">
                <Label>Dietary Restrictions</Label>
                <Textarea
                  value={formData.dietaryRestrictions}
                  onChange={(e) => updateField('dietaryRestrictions', e.target.value)}
                  placeholder="List any dietary restrictions or allergies for you or your guests..."
                  rows={3}
                  className={textareaStyles}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-rose-50 to-purple-50 border-rose-200">
            <CardHeader>
              <CardTitle className="text-[#1e3a5f]">Questionnaire Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Client:</span>
                  <p className="font-medium text-[#1e3a5f]">{formData.clientFirstName} {formData.clientLastName || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Event Type:</span>
                  <p className="font-medium text-[#1e3a5f]">{eventTypes.find(e => e.id === formData.eventType)?.name || 'Not selected'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Event Date:</span>
                  <p className="font-medium text-[#1e3a5f]">{formData.eventDate || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Guest Count:</span>
                  <p className="font-medium text-[#1e3a5f]">{formData.guestCount || 'Not set'}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <span className="text-gray-500 text-sm">Selected Colors:</span>
                <div className="flex gap-2 mt-2">
                  {formData.selectedColors.length > 0 ? (
                    formData.selectedColors.map(colorId => {
                      const color = colorPalette.find(c => c.id === colorId);
                      return color ? (
                        <div
                          key={colorId}
                          className="w-8 h-8 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ) : null;
                    })
                  ) : (
                    <span className="text-gray-400 text-sm">No colors selected</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('style')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={saveQuestionnaire}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" onClick={exportQuestionnaire}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button 
                onClick={submitQuestionnaire} 
                disabled={isSubmitting}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Questionnaire
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default EventPlanningWizard;
