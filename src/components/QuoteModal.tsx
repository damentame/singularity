import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { X, Calendar as CalendarIcon, Users, MessageSquare, DollarSign, Clock, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import CelebrationTypeSelector from './CelebrationTypeSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths, subMonths, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const QuoteModal: React.FC = () => {
  const { showQuoteModal, setShowQuoteModal, quoteSupplier, addBookingRequest, user } = useAppContext();

  const [formData, setFormData] = useState({
    eventDate: undefined as Date | undefined,
    eventType: 'weddings',
    celebrationType: '',
    celebrationDisplayName: '',
    guestCount: '',
    budget: '',
    message: '',
    setupTime: '14:00',
    ceremonyTime: '16:00',
    receptionTime: '18:00',
    strikeTime: '00:00',
    isNextDay: false,
  });

  const [step, setStep] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Reset form when modal opens
  useEffect(() => {
    if (showQuoteModal) {
      setCalendarMonth(new Date());
    }
  }, [showQuoteModal]);

  if (!showQuoteModal || !quoteSupplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For celebrations, include the specific celebration type
    const finalEventType = formData.eventType === 'celebrations' && formData.celebrationType
      ? `celebrations:${formData.celebrationType}`
      : formData.eventType;
    
    addBookingRequest({
      supplierId: quoteSupplier.id,
      supplierName: quoteSupplier.name,
      eventDate: formData.eventDate ? format(formData.eventDate, 'yyyy-MM-dd') : '',
      eventType: finalEventType,
      guestCount: parseInt(formData.guestCount) || 0,
      budget: formData.budget,
      message: formData.message,
    });

    setShowQuoteModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      eventDate: undefined,
      eventType: 'weddings',
      celebrationType: '',
      celebrationDisplayName: '',
      guestCount: '',
      budget: '',
      message: '',
      setupTime: '14:00',
      ceremonyTime: '16:00',
      receptionTime: '18:00',
      strikeTime: '00:00',
      isNextDay: false,
    });
    setStep(1);
  };

  const handleClose = () => {
    setShowQuoteModal(false);
    resetForm();
  };

  const handleCelebrationChange = (value: string, displayName?: string) => {
    setFormData({
      ...formData,
      celebrationType: value,
      celebrationDisplayName: displayName || '',
    });
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData({ ...formData, eventDate: date });
    setCalendarOpen(false);
  };

  // Disable past dates
  const disabledDays = { before: startOfDay(new Date()) };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-navy p-6 rounded-t-2xl z-10">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="font-playfair text-2xl text-white font-semibold">
            Request a Quote
          </h2>
          <p className="text-white/70 mt-1">{quoteSupplier.name}</p>

          {/* Step Indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step ? 'bg-gold' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {step === 1 ? (
            <>
              {/* Event Date - Elegant Calendar Picker */}
              <div>
                <label 
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <CalendarIcon className="w-4 h-4 text-gold" />
                  Event Date
                </label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 border border-gray-300 rounded-lg text-left transition-all duration-200",
                        "hover:border-gold/50 focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none",
                        "bg-white flex items-center justify-between group",
                        calendarOpen && "ring-2 ring-gold border-gold",
                        !formData.eventDate && "text-gray-400"
                      )}
                    >
                      <span className={cn(
                        "flex items-center gap-3",
                        formData.eventDate ? "text-gray-900" : "text-gray-400"
                      )}>
                        <CalendarIcon className={cn(
                          "w-5 h-5 transition-colors",
                          formData.eventDate ? "text-gold" : "text-gray-400 group-hover:text-gold"
                        )} />
                        {formData.eventDate ? (
                          <span className="font-medium">
                            {format(formData.eventDate, 'EEEE, MMMM d, yyyy')}
                          </span>
                        ) : (
                          <span>Select your event date</span>
                        )}
                      </span>
                      <ChevronRight className={cn(
                        "w-5 h-5 text-gray-400 transition-transform duration-200",
                        calendarOpen && "rotate-90"
                      )} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden" 
                    align="start"
                    sideOffset={8}
                  >
                    {/* Custom Calendar Header */}
                    <div className="bg-gradient-to-r from-navy to-navy/90 p-4 text-white">
                      <p className="text-xs uppercase tracking-wider text-gold/80 mb-1">Select Date</p>
                      <p className="text-lg font-playfair">
                        {formData.eventDate 
                          ? format(formData.eventDate, 'MMMM d, yyyy')
                          : 'Choose your special day'
                        }
                      </p>
                    </div>
                    
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h3 className="font-semibold text-gray-900">
                        {format(calendarMonth, 'MMMM yyyy')}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
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
                        caption: "hidden", // We use custom header
                        caption_label: "hidden",
                        nav: "hidden", // We use custom navigation
                        table: "w-full border-collapse",
                        head_row: "flex mb-2",
                        head_cell: "text-gray-500 rounded-md w-10 font-medium text-xs uppercase tracking-wide",
                        row: "flex w-full",
                        cell: cn(
                          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                          "[&:has([aria-selected])]:bg-transparent"
                        ),
                        day: cn(
                          "h-10 w-10 p-0 font-normal rounded-full transition-all duration-200",
                          "hover:bg-gold/10 hover:text-navy",
                          "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
                          "aria-selected:opacity-100"
                        ),
                        day_range_end: "day-range-end",
                        day_selected: cn(
                          "bg-gold text-navy font-semibold",
                          "hover:bg-gold hover:text-navy",
                          "focus:bg-gold focus:text-navy",
                          "shadow-lg shadow-gold/30"
                        ),
                        day_today: cn(
                          "bg-navy/5 text-navy font-semibold",
                          "ring-1 ring-navy/20"
                        ),
                        day_outside: "text-gray-300 opacity-50",
                        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
                        day_hidden: "invisible",
                      }}
                    />

                    {/* Quick Select Options */}
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                      <p className="text-xs text-gray-500 mb-2 font-medium">Quick Select</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: '3 months', months: 3 },
                          { label: '6 months', months: 6 },
                          { label: '1 year', months: 12 },
                          { label: '18 months', months: 18 },
                        ].map(({ label, months }) => {
                          const date = addMonths(new Date(), months);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, eventDate: date });
                                setCalendarMonth(date);
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:border-gold hover:text-gold transition-colors"
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['weddings', 'corporate', 'celebrations'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFormData({ 
                          ...formData, 
                          eventType: type,
                          celebrationType: type !== 'celebrations' ? '' : formData.celebrationType,
                          celebrationDisplayName: type !== 'celebrations' ? '' : formData.celebrationDisplayName,
                        });
                      }}
                      className={`py-3 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${
                        formData.eventType === type
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 text-gray-600 hover:border-gold/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Celebration Type Selector - Shows when Celebrations is selected */}
              {formData.eventType === 'celebrations' && (
                <div className="animate-slideDown">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <PartyPopper className="w-4 h-4 text-gold" />
                    What type of celebration?
                  </label>
                  <CelebrationTypeSelector
                    value={formData.celebrationType}
                    onChange={handleCelebrationChange}
                    placeholder="Select your celebration type..."
                    compact
                  />
                  {formData.celebrationDisplayName && (
                    <p className="mt-2 text-xs text-gold">
                      Selected: {formData.celebrationDisplayName}
                    </p>
                  )}
                </div>
              )}

              {/* Guest Count */}
              <div>
                <label 
                  htmlFor="quote-guest-count"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <Users className="w-4 h-4 text-gold" />
                  Expected Guests
                </label>
                <input
                  id="quote-guest-count"
                  type="number"
                  value={formData.guestCount}
                  onChange={handleInputChange('guestCount')}
                  placeholder="e.g., 150"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900"
                  required
                  min="1"
                />
              </div>

              {/* Budget */}
              <div>
                <label 
                  htmlFor="quote-budget"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <DollarSign className="w-4 h-4 text-gold" />
                  Budget Range (Optional)
                </label>
                <select
                  id="quote-budget"
                  value={formData.budget}
                  onChange={handleInputChange('budget')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900 cursor-pointer"
                >
                  <option value="">Select budget range</option>
                  <option value="under-50k">Under $50,000</option>
                  <option value="50k-100k">$50,000 - $100,000</option>
                  <option value="100k-250k">$100,000 - $250,000</option>
                  <option value="250k-500k">$250,000 - $500,000</option>
                  <option value="over-500k">Over $500,000</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.eventDate || (formData.eventType === 'celebrations' && !formData.celebrationType)}
                className="w-full py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              {/* Event Timeline */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 text-gold" />
                  Event Timeline
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label htmlFor="setup-time" className="w-24 text-sm text-gray-600">Setup</label>
                    <input
                      id="setup-time"
                      type="time"
                      value={formData.setupTime}
                      onChange={handleInputChange('setupTime')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                  {formData.eventType === 'weddings' && (
                    <div className="flex items-center gap-3">
                      <label htmlFor="ceremony-time" className="w-24 text-sm text-gray-600">Ceremony</label>
                      <input
                        id="ceremony-time"
                        type="time"
                        value={formData.ceremonyTime}
                        onChange={handleInputChange('ceremonyTime')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <label htmlFor="reception-time" className="w-24 text-sm text-gray-600">Reception</label>
                    <input
                      id="reception-time"
                      type="time"
                      value={formData.receptionTime}
                      onChange={handleInputChange('receptionTime')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="strike-time" className="w-24 text-sm text-gray-600">Strike</label>
                    <input
                      id="strike-time"
                      type="time"
                      value={formData.strikeTime}
                      onChange={handleInputChange('strikeTime')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isNextDay: !formData.isNextDay })}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors ${
                        formData.isNextDay
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 text-gray-500'
                      }`}
                    >
                      {formData.isNextDay ? 'Next Day' : 'Same Day'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label 
                  htmlFor="quote-message"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <MessageSquare className="w-4 h-4 text-gold" />
                  Additional Details
                </label>
                <textarea
                  id="quote-message"
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  placeholder="Tell us about your event, special requirements, or questions..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold focus:outline-none resize-none bg-white text-gray-900"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
                >
                  Send Request
                </button>
              </div>
            </>
          )}

          {/* Info */}
          <p className="text-center text-xs text-gray-500">
            The supplier will respond within 24-48 hours
          </p>
        </form>
      </div>
    </div>
  );
};

export default QuoteModal;
