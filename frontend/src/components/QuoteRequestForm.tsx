import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths, subMonths, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  Users,
  MapPin,
  DollarSign,
  MessageSquare,
  Send,
  Loader2,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Briefcase,
  Heart,
  Sparkles,
  Clock,
  CheckCircle,
  Building2,
  FileText
} from 'lucide-react';

// Event types with icons
const EVENT_TYPES = [
  { id: 'weddings', label: 'Wedding', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { id: 'corporate', label: 'Corporate', icon: Briefcase, color: 'from-blue-500 to-indigo-500' },
  { id: 'social', label: 'Social', icon: PartyPopper, color: 'from-purple-500 to-violet-500' },
  { id: 'celebrations', label: 'Celebration', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
];

// Budget ranges
const BUDGET_RANGES = [
  { id: 'under-1k', label: 'Under $1,000' },
  { id: '1k-5k', label: '$1,000 - $5,000' },
  { id: '5k-10k', label: '$5,000 - $10,000' },
  { id: '10k-25k', label: '$10,000 - $25,000' },
  { id: '25k-50k', label: '$25,000 - $50,000' },
  { id: '50k-100k', label: '$50,000 - $100,000' },
  { id: 'over-100k', label: 'Over $100,000' },
];

// Preferred contact methods
const CONTACT_METHODS = [
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'any', label: 'Any' },
];

interface QuoteRequestFormProps {
  providerId: string;
  providerUserId?: string;
  providerName: string;
  providerEmail?: string;
  providerServices?: string[];
  onSuccess?: () => void;
  compact?: boolean;
}

const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({
  providerId,
  providerUserId,
  providerName,
  providerEmail,
  providerServices = [],
  onSuccess,
  compact = false,
}) => {

  const { user, setShowAuthModal, setAuthMode } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    // Event Details
    eventType: '',
    eventName: '',
    eventDate: undefined as Date | undefined,
    flexibleDates: false,
    eventLocation: '',
    venueName: '',
    guestCount: '',
    
    // Budget & Services
    budgetRange: '',
    servicesNeeded: [] as string[],
    specialRequirements: '',
    
    // Contact Information
    hostName: user?.name || '',
    hostEmail: user?.email || '',
    hostPhone: '',
    preferredContactMethod: 'email',
    
    // Message
    message: '',
  });

  // Update form when user changes
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        hostName: user.name || prev.hostName,
        hostEmail: user.email || prev.hostEmail,
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(service)
        ? prev.servicesNeeded.filter(s => s !== service)
        : [...prev.servicesNeeded, service]
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventDate: date }));
    setCalendarOpen(false);
  };

  const validateForm = (): boolean => {
    if (!formData.eventType) {
      toast({ title: 'Please select an event type', variant: 'destructive' });
      return false;
    }
    if (!formData.hostName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return false;
    }
    if (!formData.hostEmail.trim()) {
      toast({ title: 'Please enter your email', variant: 'destructive' });
      return false;
    }
    if (!formData.message.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      toast({
        title: 'Sign In Required',
        description: 'Please sign in or create an account to send a quote request.',
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Insert quote request
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_requests')
        .insert({
          service_provider_id: providerId,
          supplier_user_id: providerUserId || null,
          host_id: user.id,
          host_name: formData.hostName,
          host_email: formData.hostEmail,
          host_phone: formData.hostPhone,
          event_type: formData.eventType,
          event_name: formData.eventName || null,
          event_date: formData.eventDate ? format(formData.eventDate, 'yyyy-MM-dd') : null,
          flexible_dates: formData.flexibleDates,
          event_location: formData.eventLocation,
          venue_name: formData.venueName || null,
          guest_count: formData.guestCount ? parseInt(formData.guestCount) : null,
          budget_range: formData.budgetRange,
          services_requested: formData.servicesNeeded,
          special_requirements: formData.specialRequirements || null,
          preferred_contact_method: formData.preferredContactMethod,
          message: formData.message,
          status: 'pending',
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create notification for the service provider
      if (providerUserId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: providerUserId,
            type: 'quote_request',
            title: 'New Quote Request',
            message: `${formData.hostName} has requested a quote for their ${formData.eventType} event.`,
            data: {
              quote_request_id: quoteData?.id,
              host_name: formData.hostName,
              host_email: formData.hostEmail,
              event_type: formData.eventType,
              event_date: formData.eventDate ? format(formData.eventDate, 'yyyy-MM-dd') : null,
              guest_count: formData.guestCount,
            },
          });

        // Also call the edge function to send email notification
        try {
          const dashboardUrl = `${window.location.origin}/?view=provider-dashboard`;
          
          await supabase.functions.invoke('send-quote-notification', {
            body: {
              quoteRequestId: quoteData?.id,
              providerUserId: providerUserId,
              providerEmail: providerEmail,
              providerBusinessName: providerName,
              hostName: formData.hostName,
              hostEmail: formData.hostEmail,
              hostPhone: formData.hostPhone || null,
              eventType: EVENT_TYPES.find(t => t.id === formData.eventType)?.label || formData.eventType,
              eventName: formData.eventName || null,
              eventDate: formData.eventDate ? format(formData.eventDate, 'yyyy-MM-dd') : null,
              eventLocation: formData.eventLocation || null,
              venueName: formData.venueName || null,
              guestCount: formData.guestCount ? parseInt(formData.guestCount) : null,
              budgetRange: formData.budgetRange || null,
              servicesNeeded: formData.servicesNeeded.length > 0 ? formData.servicesNeeded : null,
              specialRequirements: formData.specialRequirements || null,
              flexibleDates: formData.flexibleDates,
              preferredContactMethod: CONTACT_METHODS.find(m => m.id === formData.preferredContactMethod)?.label || formData.preferredContactMethod,
              message: formData.message,
              dashboardUrl: dashboardUrl,
            },
          });
        } catch (notifyErr) {
          console.error('Error sending notification:', notifyErr);
          // Don't fail the whole request if notification fails
        }
      }


      setIsSubmitted(true);
      toast({
        title: 'Quote Request Sent!',
        description: `Your request has been sent to ${providerName}. They will respond soon.`,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error submitting quote request:', err);
      toast({
        title: 'Error',
        description: 'Failed to send quote request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Quote Request Sent!</h3>
        <p className="text-white/60 mb-6">
          Your request has been sent to {providerName}. They typically respond within 24-48 hours.
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          Send Another Request
        </Button>
      </div>
    );
  }

  // Disabled past dates
  const disabledDays = { before: startOfDay(new Date()) };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${compact ? '' : 'bg-white/5 border border-white/10 rounded-2xl p-6'}`}>
      {!compact && (
        <div className="border-b border-white/10 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#B8956A]" />
            Request a Quote
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Fill out the form below and {providerName} will get back to you soon.
          </p>
        </div>
      )}

      {/* Event Type Selection */}
      <div>
        <label className="text-white/70 text-sm font-medium block mb-3">
          Event Type <span className="text-[#B8956A]">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EVENT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.eventType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleInputChange('eventType', type.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-center group",
                  isSelected
                    ? "border-[#B8956A] bg-[#B8956A]/10"
                    : "border-white/10 bg-white/5 hover:border-white/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center transition-all",
                  isSelected
                    ? `bg-gradient-to-br ${type.color}`
                    : "bg-white/10 group-hover:bg-white/20"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-white/70")} />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-white" : "text-white/70"
                )}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Name (Optional) */}
      <div>
        <label className="text-white/70 text-sm font-medium block mb-2">
          Event Name (Optional)
        </label>
        <Input
          value={formData.eventName}
          onChange={(e) => handleInputChange('eventName', e.target.value)}
          placeholder="e.g., Sarah & John's Wedding"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
        />
      </div>

      {/* Event Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-white/70 text-sm font-medium block mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-2 text-[#B8956A]" />
            Event Date
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left",
                  "hover:border-white/30 focus:border-[#B8956A]/50 focus:outline-none",
                  "flex items-center justify-between transition-all",
                  !formData.eventDate && "text-white/40"
                )}
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {formData.eventDate
                    ? format(formData.eventDate, 'MMMM d, yyyy')
                    : 'Select date'}
                </span>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden" align="start">
              <div className="bg-gradient-to-r from-[#0B1426] to-[#0B1426]/90 p-4 text-white">
                <p className="text-xs uppercase tracking-wider text-[#B8956A]/80 mb-1">Select Date</p>
                <p className="text-lg font-semibold">
                  {formData.eventDate ? format(formData.eventDate, 'MMMM d, yyyy') : 'Choose your event date'}
                </p>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</h3>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <Calendar
                mode="single"
                selected={formData.eventDate}
                onSelect={handleDateSelect}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                disabled={disabledDays}
                className="p-4"
                classNames={{
                  months: "flex flex-col",
                  month: "space-y-4",
                  caption: "hidden",
                  nav: "hidden",
                  table: "w-full border-collapse",
                  head_row: "flex mb-2",
                  head_cell: "text-gray-500 rounded-md w-10 font-medium text-xs uppercase tracking-wide",
                  row: "flex w-full",
                  cell: "relative p-0 text-center text-sm",
                  day: cn(
                    "h-10 w-10 p-0 font-normal rounded-full transition-all duration-200",
                    "hover:bg-[#B8956A]/20 hover:text-[#0B1426]"
                  ),
                  day_selected: "bg-[#B8956A] text-white hover:bg-[#B8956A] hover:text-white shadow-lg",
                  day_today: "bg-[#0B1426]/10 text-[#0B1426] font-semibold ring-1 ring-[#0B1426]/20",
                  day_outside: "text-gray-300 opacity-50",
                  day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-white/70 text-sm font-medium block mb-2">
            <Users className="w-4 h-4 inline mr-2 text-[#B8956A]" />
            Guest Count
          </label>
          <Input
            type="number"
            value={formData.guestCount}
            onChange={(e) => handleInputChange('guestCount', e.target.value)}
            placeholder="Estimated number of guests"
            min="1"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
          />
        </div>
      </div>

      {/* Flexible Dates Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => handleInputChange('flexibleDates', !formData.flexibleDates)}
          className={cn(
            "w-12 h-6 rounded-full transition-all duration-200 relative",
            formData.flexibleDates ? "bg-[#B8956A]" : "bg-white/20"
          )}
        >
          <span className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200",
            formData.flexibleDates ? "left-7" : "left-1"
          )} />
        </button>
        <span className="text-white/70 text-sm">My dates are flexible</span>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-white/70 text-sm font-medium block mb-2">
            <MapPin className="w-4 h-4 inline mr-2 text-[#B8956A]" />
            Event Location
          </label>
          <Input
            value={formData.eventLocation}
            onChange={(e) => handleInputChange('eventLocation', e.target.value)}
            placeholder="City or region"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm font-medium block mb-2">
            <Building2 className="w-4 h-4 inline mr-2 text-[#B8956A]" />
            Venue Name (if known)
          </label>
          <Input
            value={formData.venueName}
            onChange={(e) => handleInputChange('venueName', e.target.value)}
            placeholder="Venue name"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
          />
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <label className="text-white/70 text-sm font-medium block mb-2">
          <DollarSign className="w-4 h-4 inline mr-2 text-[#B8956A]" />
          Budget Range
        </label>
        <select
          value={formData.budgetRange}
          onChange={(e) => handleInputChange('budgetRange', e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#B8956A]/50 cursor-pointer"
        >
          <option value="" className="bg-[#0B1426]">Select budget range</option>
          {BUDGET_RANGES.map(range => (
            <option key={range.id} value={range.label} className="bg-[#0B1426]">{range.label}</option>
          ))}
        </select>
      </div>

      {/* Services Needed */}
      {providerServices.length > 0 && (
        <div>
          <label className="text-white/70 text-sm font-medium block mb-3">
            Services Needed
          </label>
          <div className="flex flex-wrap gap-2">
            {providerServices.map(service => (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  formData.servicesNeeded.includes(service)
                    ? "bg-[#B8956A] text-white"
                    : "bg-white/5 text-white/70 border border-white/10 hover:border-white/30"
                )}
              >
                {service}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Special Requirements */}
      <div>
        <label className="text-white/70 text-sm font-medium block mb-2">
          Special Requirements (Optional)
        </label>
        <Textarea
          value={formData.specialRequirements}
          onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
          placeholder="Any dietary requirements, accessibility needs, or special requests..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50 min-h-[80px]"
        />
      </div>

      {/* Contact Information */}
      <div className="border-t border-white/10 pt-6">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-[#B8956A]" />
          Your Contact Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Full Name <span className="text-[#B8956A]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={formData.hostName}
                onChange={(e) => handleInputChange('hostName', e.target.value)}
                placeholder="Your full name"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Email Address <span className="text-[#B8956A]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="email"
                value={formData.hostEmail}
                onChange={(e) => handleInputChange('hostEmail', e.target.value)}
                placeholder="your@email.com"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="tel"
                value={formData.hostPhone}
                onChange={(e) => handleInputChange('hostPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Preferred Contact Method
            </label>
            <select
              value={formData.preferredContactMethod}
              onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#B8956A]/50 cursor-pointer"
            >
              {CONTACT_METHODS.map(method => (
                <option key={method.id} value={method.id} className="bg-[#0B1426]">{method.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="text-white/70 text-sm font-medium block mb-2">
          <MessageSquare className="w-4 h-4 inline mr-2 text-[#B8956A]" />
          Your Message <span className="text-[#B8956A]">*</span>
        </label>
        <Textarea
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Tell them about your event, what you're looking for, and any questions you have..."
          className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50 min-h-[120px]"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Send Quote Request
          </>
        )}
      </Button>

      {/* Info Text */}
      <p className="text-center text-white/40 text-xs">
        <Clock className="w-3 h-3 inline mr-1" />
        {providerName} typically responds within 24-48 hours
      </p>
    </form>
  );
};

export default QuoteRequestForm;
