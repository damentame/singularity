import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import ProviderSearchCard, { ServiceProviderData } from './ProviderSearchCard';
import { 
  Search, Filter, X, ChevronDown, MapPin, Grid, List, 
  SlidersHorizontal, Building2, Calendar, Users, DollarSign,
  Loader2, AlertCircle, Send, RefreshCw
} from 'lucide-react';

// Service categories available
const SERVICE_CATEGORIES = [
  'Photography', 'Videography', 'Catering', 'Florals', 'Venues',
  'Entertainment', 'Planners', 'Lighting', 'Transport', 'Decor',
  'Hair & Makeup', 'Stationery', 'Celebrant', 'Music', 'Cake'
];

// Event types
const EVENT_TYPES = [
  { id: 'weddings', label: 'Weddings' },
  { id: 'corporate', label: 'Corporate Events' },
  { id: 'social', label: 'Social Events' },
  { id: 'celebrations', label: 'Celebrations' },
];

// Price ranges
const PRICE_RANGES = [
  { id: '', label: 'Any Budget' },
  { id: 'budget', label: 'Budget Friendly ($)' },
  { id: 'mid', label: 'Mid Range ($$)' },
  { id: 'premium', label: 'Premium ($$$)' },
  { id: 'luxury', label: 'Luxury ($$$$)' },
];

const SearchProviders: React.FC = () => {
  const { user, setShowAuthModal, setAuthMode } = useAppContext();
  
  // State
  const [providers, setProviders] = useState<ServiceProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  
  // Quote request modal
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProviderData | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    eventType: '',
    eventDate: '',
    eventLocation: '',
    guestCount: '',
    budgetRange: '',
    message: '',
    hostName: '',
    hostEmail: '',
    hostPhone: '',
    servicesRequested: [] as string[],
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Get unique countries and cities from providers
  const { countries, cities } = useMemo(() => {
    const countrySet = new Set<string>();
    const citySet = new Set<string>();
    
    providers.forEach(p => {
      if (p.country) countrySet.add(p.country);
      if (p.city) citySet.add(p.city);
    });
    
    return {
      countries: Array.from(countrySet).sort(),
      cities: Array.from(citySet).sort(),
    };
  }, [providers]);

  // Filtered cities based on selected country
  const filteredCities = useMemo(() => {
    if (!selectedCountry) return cities;
    return providers
      .filter(p => p.country === selectedCountry)
      .map(p => p.city)
      .filter((city, index, self) => city && self.indexOf(city) === index)
      .sort();
  }, [providers, selectedCountry, cities]);

  // Load providers from database
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Table may not be accessible yet - show empty state gracefully
        console.warn('Service providers not available yet:', fetchError.message);
        setProviders([]);
        return;
      }
      
      setProviders(data || []);
    } catch (err) {
      console.warn('Error loading providers:', err);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };


  // Filter providers based on all criteria
  const filteredProviders = useMemo(() => {
    let result = [...providers];

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.business_name?.toLowerCase().includes(query) ||
        p.trading_name?.toLowerCase().includes(query) ||
        p.business_description?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.country?.toLowerCase().includes(query)
      );
    }

    // Country filter
    if (selectedCountry) {
      result = result.filter(p => p.country === selectedCountry);
    }

    // City filter
    if (selectedCity) {
      result = result.filter(p => p.city === selectedCity);
    }

    // Event type filter
    if (selectedEventType) {
      result = result.filter(p => 
        p.selected_event_types?.some(et => 
          et.toLowerCase().includes(selectedEventType.toLowerCase())
        )
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter(p => {
        const providerCategories = Object.values(p.selected_categories || {}).flat();
        return selectedCategories.some(cat => 
          providerCategories.some(pc => pc.toLowerCase().includes(cat.toLowerCase()))
        );
      });
    }

    // Price range filter (based on business type/description for now)
    // In a real app, you'd have actual pricing data
    if (selectedPriceRange) {
      // This is a placeholder - in production you'd filter by actual price data
      // For now, we'll just keep all results
    }

    return result;
  }, [providers, searchQuery, selectedCountry, selectedCity, selectedEventType, selectedCategories, selectedPriceRange]);

  // Count active filters
  const activeFilterCount = [
    selectedCountry,
    selectedCity,
    selectedEventType,
    selectedPriceRange,
    ...selectedCategories,
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedEventType('');
    setSelectedCategories([]);
    setSelectedPriceRange('');
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle request quote
  const handleRequestQuote = (provider: ServiceProviderData) => {
    if (!user) {
      setAuthMode('signup');
      setShowAuthModal(true);
      toast({
        title: 'Sign In Required',
        description: 'Please sign in or create an account to request a quote.',
      });
      return;
    }
    
    setSelectedProvider(provider);
    setQuoteForm(prev => ({
      ...prev,
      hostName: user.name || '',
      hostEmail: user.email || '',
    }));
    setShowQuoteModal(true);
  };

  // Handle view profile
  const handleViewProfile = (provider: ServiceProviderData) => {
    // For now, just show a toast - in a full implementation, this would navigate to a profile page
    toast({
      title: provider.business_name,
      description: `${provider.city}, ${provider.country} - ${provider.business_description?.slice(0, 100)}...`,
    });
  };

  // Submit quote request
  const handleSubmitQuote = async () => {
    if (!selectedProvider || !user) return;

    setIsSubmittingQuote(true);
    
    try {
      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert({
          service_provider_id: selectedProvider.id,
          host_id: user.id,
          host_name: quoteForm.hostName,
          host_email: quoteForm.hostEmail,
          host_phone: quoteForm.hostPhone,
          event_type: quoteForm.eventType,
          event_date: quoteForm.eventDate || null,
          event_location: quoteForm.eventLocation,
          guest_count: quoteForm.guestCount ? parseInt(quoteForm.guestCount) : null,
          budget_range: quoteForm.budgetRange,
          message: quoteForm.message,
          services_requested: quoteForm.servicesRequested,
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Quote Request Sent!',
        description: `Your request has been sent to ${selectedProvider.business_name}. They will respond soon.`,
      });

      setShowQuoteModal(false);
      setSelectedProvider(null);
      setQuoteForm({
        eventType: '',
        eventDate: '',
        eventLocation: '',
        guestCount: '',
        budgetRange: '',
        message: '',
        hostName: user.name || '',
        hostEmail: user.email || '',
        hostPhone: '',
        servicesRequested: [],
      });
    } catch (err) {
      console.error('Error submitting quote request:', err);
      toast({
        title: 'Error',
        description: 'Failed to send quote request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Toggle service in quote form
  const toggleServiceRequested = (service: string) => {
    setQuoteForm(prev => ({
      ...prev,
      servicesRequested: prev.servicesRequested.includes(service)
        ? prev.servicesRequested.filter(s => s !== service)
        : [...prev.servicesRequested, service]
    }));
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-white font-normal tracking-[0.04em] mb-4">
            Find Service Providers
          </h1>
          <p className="font-body text-white/60 text-lg">
            Discover exceptional event professionals from our verified network
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, or service..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#B8956A]/50"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Country Filter */}
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedCity(''); // Reset city when country changes
                  }}
                  className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl font-body text-white focus:outline-none focus:border-[#B8956A]/50 cursor-pointer min-w-[150px]"
                >
                  <option value="" className="bg-[#0B1426]">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country} className="bg-[#0B1426]">{country}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* City Filter */}
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl font-body text-white focus:outline-none focus:border-[#B8956A]/50 cursor-pointer min-w-[150px]"
                >
                  <option value="" className="bg-[#0B1426]">All Cities</option>
                  {filteredCities.map(city => (
                    <option key={city} value={city} className="bg-[#0B1426]">{city}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* Event Type Filter */}
              <div className="relative">
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl font-body text-white focus:outline-none focus:border-[#B8956A]/50 cursor-pointer min-w-[160px]"
                >
                  <option value="" className="bg-[#0B1426]">All Event Types</option>
                  {EVENT_TYPES.map(et => (
                    <option key={et.id} value={et.id} className="bg-[#0B1426]">{et.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* More Filters Button */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-[#B8956A] bg-[#B8956A]/10 text-[#B8956A]'
                    : 'border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">More Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-[#B8956A] text-[#0B1426] text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {/* Service Categories */}
              <div className="mb-4">
                <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-3">
                  Service Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${
                        selectedCategories.includes(category)
                          ? 'bg-[#B8956A] text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-3">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedPriceRange(range.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${
                        selectedPriceRange === range.id
                          ? 'bg-[#B8956A] text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedCountry && (
              <Badge className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30 px-3 py-1">
                <MapPin className="w-3 h-3 mr-1" />
                {selectedCountry}
                <button onClick={() => setSelectedCountry('')} className="ml-2 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedCity && (
              <Badge className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30 px-3 py-1">
                {selectedCity}
                <button onClick={() => setSelectedCity('')} className="ml-2 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedEventType && (
              <Badge className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30 px-3 py-1">
                {EVENT_TYPES.find(et => et.id === selectedEventType)?.label}
                <button onClick={() => setSelectedEventType('')} className="ml-2 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedCategories.map(cat => (
              <Badge key={cat} className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30 px-3 py-1">
                {cat}
                <button onClick={() => toggleCategory(cat)} className="ml-2 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/60 font-body">
            <span className="font-semibold text-white">{filteredProviders.length}</span> service providers found
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={loadProviders}
              className="text-white/60 hover:text-white hover:bg-white/10"
              title="Refresh results"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`${viewMode === 'grid' ? 'bg-[#B8956A] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              <Grid className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`${viewMode === 'list' ? 'bg-[#B8956A] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-[#B8956A] animate-spin mb-4" />
            <p className="text-white/60">Loading service providers...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Providers</h3>
              <p className="text-white/60 mb-4">{error}</p>
              <Button onClick={loadProviders} className="bg-[#B8956A] text-white hover:bg-[#B8956A]/90">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProviders.length === 0 && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Providers Found</h3>
              <p className="text-white/60 mb-6">
                {providers.length === 0 
                  ? "There are no approved service providers yet. Check back soon!"
                  : "Try adjusting your filters or search terms to find more providers."}
              </p>
              {activeFilterCount > 0 && (
                <Button onClick={clearFilters} className="bg-[#B8956A] text-white hover:bg-[#B8956A]/90">
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {!isLoading && !error && filteredProviders.length > 0 && (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProviders.map((provider) => (
              <ProviderSearchCard
                key={provider.id}
                provider={provider}
                onRequestQuote={handleRequestQuote}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quote Request Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="bg-[#0B1426] border border-[#B8956A]/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Request Quote from {selectedProvider?.business_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm block mb-2">Event Type *</label>
                <select
                  value={quoteForm.eventType}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, eventType: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#B8956A]/50"
                >
                  <option value="" className="bg-[#0B1426]">Select event type</option>
                  {EVENT_TYPES.map(et => (
                    <option key={et.id} value={et.label} className="bg-[#0B1426]">{et.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Event Date</label>
                <Input
                  type="date"
                  value={quoteForm.eventDate}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Event Location</label>
                <Input
                  value={quoteForm.eventLocation}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, eventLocation: e.target.value }))}
                  placeholder="City or venue"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm block mb-2">Guest Count</label>
                <Input
                  type="number"
                  value={quoteForm.guestCount}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, guestCount: e.target.value }))}
                  placeholder="Estimated guests"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Budget Range */}
            <div>
              <label className="text-white/70 text-sm block mb-2">Budget Range</label>
              <select
                value={quoteForm.budgetRange}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, budgetRange: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#B8956A]/50"
              >
                <option value="" className="bg-[#0B1426]">Select budget range</option>
                <option value="Under $1,000" className="bg-[#0B1426]">Under $1,000</option>
                <option value="$1,000 - $5,000" className="bg-[#0B1426]">$1,000 - $5,000</option>
                <option value="$5,000 - $10,000" className="bg-[#0B1426]">$5,000 - $10,000</option>
                <option value="$10,000 - $25,000" className="bg-[#0B1426]">$10,000 - $25,000</option>
                <option value="$25,000 - $50,000" className="bg-[#0B1426]">$25,000 - $50,000</option>
                <option value="$50,000+" className="bg-[#0B1426]">$50,000+</option>
              </select>
            </div>

            {/* Services Requested */}
            {selectedProvider && Object.keys(selectedProvider.selected_categories || {}).length > 0 && (
              <div>
                <label className="text-white/70 text-sm block mb-2">Services Interested In</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(selectedProvider.selected_categories || {}).flat().map(service => (
                    <button
                      key={service}
                      onClick={() => toggleServiceRequested(service)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        quoteForm.servicesRequested.includes(service)
                          ? 'bg-[#B8956A] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="text-white/70 text-sm block mb-2">Message *</label>
              <Textarea
                value={quoteForm.message}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Tell them about your event and what you're looking for..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
              />
            </div>

            {/* Contact Details */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-white font-medium mb-4">Your Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/70 text-sm block mb-2">Name *</label>
                  <Input
                    value={quoteForm.hostName}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, hostName: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-2">Email *</label>
                  <Input
                    type="email"
                    value={quoteForm.hostEmail}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, hostEmail: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm block mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={quoteForm.hostPhone}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, hostPhone: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuoteModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitQuote}
              disabled={isSubmittingQuote || !quoteForm.eventType || !quoteForm.message || !quoteForm.hostName || !quoteForm.hostEmail}
              className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
            >
              {isSubmittingQuote ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Quote Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchProviders;
