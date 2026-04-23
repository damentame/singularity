import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { suppliers, categories, regions } from '@/data/suppliers';
import SupplierCard from './SupplierCard';
import { 
  Search, Filter, X, ChevronDown, MapPin, Grid, List, PartyPopper,
  Mail, Send, FileText, Building2, Flower2, UtensilsCrossed, Lightbulb,
  Music, Camera, Video, Car, Tent, Check, Users
} from 'lucide-react';
import CelebrationTypeSelector from './CelebrationTypeSelector';
import { supplierQuestionnaireTemplate } from '@/data/supplierWorkbookData';

const BrowseSuppliers: React.FC = () => {
  const { filters, setFilters, resetFilters, setCurrentView } = useAppContext();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [celebrationFilter, setCelebrationFilter] = useState('');
  const [celebrationDisplayName, setCelebrationDisplayName] = useState('');
  
  // Multi-select categories for email
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    eventName: '',
    eventDate: '',
    eventType: '',
    guestCount: '',
    budget: '',
    message: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  // Get unique cities
  const cities = useMemo(() => {
    const citySet = new Set(suppliers.map(s => s.city));
    return Array.from(citySet).sort();
  }, []);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let result = [...suppliers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.city.toLowerCase().includes(searchLower) ||
        s.country.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category) {
      result = result.filter(s => s.category === filters.category);
    }

    // Multi-select category filter
    if (selectedCategories.length > 0) {
      result = result.filter(s => selectedCategories.includes(s.category));
    }

    if (filters.region) {
      result = result.filter(s => s.region === filters.region);
    }

    if (filters.city) {
      result = result.filter(s => s.city === filters.city);
    }

    if (filters.eventType) {
      const eventTypeFilter = filters.eventType.startsWith('celebrations:') 
        ? 'celebrations' 
        : filters.eventType;
      result = result.filter(s => 
        s.eventTypes.map(e => e.toLowerCase()).includes(eventTypeFilter.toLowerCase())
      );
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case 'price-high':
        result.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'featured':
      default:
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [filters, selectedCategories]);

  const activeFilterCount = [
    filters.category,
    filters.region,
    filters.city,
    filters.eventType,
    celebrationFilter,
  ].filter(Boolean).length + selectedCategories.length;

  const handleEventTypeChange = (value: string) => {
    setFilters({ eventType: value });
    if (value !== 'celebrations') {
      setCelebrationFilter('');
      setCelebrationDisplayName('');
    }
  };

  const handleCelebrationChange = (value: string, displayName?: string) => {
    setCelebrationFilter(value);
    setCelebrationDisplayName(displayName || '');
    if (value) {
      setFilters({ eventType: `celebrations:${value}` });
    } else {
      setFilters({ eventType: 'celebrations' });
    }
  };

  const toggleCategorySelection = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Venues': <Building2 className="w-5 h-5" />,
      'Florals': <Flower2 className="w-5 h-5" />,
      'Catering': <UtensilsCrossed className="w-5 h-5" />,
      'Lighting': <Lightbulb className="w-5 h-5" />,
      'Entertainment': <Music className="w-5 h-5" />,
      'Photography': <Camera className="w-5 h-5" />,
      'Videography': <Video className="w-5 h-5" />,
      'Transport': <Car className="w-5 h-5" />,
      'Planners': <FileText className="w-5 h-5" />,
    };
    return icons[categoryName] || <Tent className="w-5 h-5" />;
  };

  const handleSendInquiry = () => {
    // This would send emails to all selected suppliers
    console.log('Sending inquiry to suppliers in categories:', selectedCategories);
    console.log('Form data:', emailFormData);
    setShowEmailModal(false);
    // Reset form
    setEmailFormData({
      eventName: '',
      eventDate: '',
      eventType: '',
      guestCount: '',
      budget: '',
      message: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
    setSelectedCategories([]);
  };

  const suppliersInSelectedCategories = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return suppliers.filter(s => selectedCategories.includes(s.category));
  }, [selectedCategories]);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-white font-normal tracking-[0.04em] mb-4">
            Browse Suppliers
          </h1>
          <p className="font-body text-white/60">
            Discover exceptional event suppliers from around the world
          </p>
        </div>

        {/* Multi-Select Category Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-display text-lg mb-1">Browse by Category</h3>
              <p className="text-white/50 text-sm font-body">Select multiple categories to compare and send inquiries</p>
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body text-sm flex items-center gap-2 transition-all hover:scale-105"
                style={{ color: '#0B1426' }}
              >
                <Mail className="w-4 h-4" />
                Email {suppliersInSelectedCategories.length} Suppliers
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategorySelection(cat.name)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedCategories.includes(cat.name)
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedCategories.includes(cat.name) ? 'bg-gold/30' : 'bg-white/10'
                }`}>
                  {getCategoryIcon(cat.name)}
                </div>
                <div className="text-left flex-1">
                  <p className="font-body text-sm font-medium">{cat.name}</p>
                  <p className="text-xs opacity-60">{cat.count} suppliers</p>
                </div>
                {selectedCategories.includes(cat.name) && (
                  <Check className="w-5 h-5 text-gold" />
                )}
              </button>
            ))}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  <span className="text-white/70 text-sm font-body">
                    {suppliersInSelectedCategories.length} suppliers in {selectedCategories.length} selected categories
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-white/50 hover:text-white text-sm font-body"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Search suppliers, locations..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-3">
              {/* Category */}
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ category: e.target.value })}
                  className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl font-body text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                >
                  <option value="" className="bg-navy">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name} className="bg-navy">{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* Region */}
              <div className="relative">
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({ region: e.target.value })}
                  className="appearance-none px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl font-body text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                >
                  <option value="" className="bg-navy">All Regions</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.name} className="bg-navy">{region.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-gold text-navy text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* City */}
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">City</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters({ city: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="" className="bg-navy">All Cities</option>
                    {cities.map(city => (
                      <option key={city} value={city} className="bg-navy">{city}</option>
                    ))}
                  </select>
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Event Type</label>
                  <select
                    value={filters.eventType?.startsWith('celebrations:') ? 'celebrations' : filters.eventType}
                    onChange={(e) => handleEventTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="" className="bg-navy">All Events</option>
                    <option value="weddings" className="bg-navy">Weddings</option>
                    <option value="corporate" className="bg-navy">Corporate</option>
                    <option value="celebrations" className="bg-navy">Celebrations</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="featured" className="bg-navy">Featured</option>
                    <option value="rating" className="bg-navy">Highest Rated</option>
                    <option value="reviews" className="bg-navy">Most Reviews</option>
                    <option value="price-low" className="bg-navy">Price: Low to High</option>
                    <option value="price-high" className="bg-navy">Price: High to Low</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      resetFilters();
                      setCelebrationFilter('');
                      setCelebrationDisplayName('');
                      setSelectedCategories([]);
                    }}
                    className="w-full px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:border-white/30 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Celebration Type Selector */}
              {(filters.eventType === 'celebrations' || filters.eventType?.startsWith('celebrations:')) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <PartyPopper className="w-4 h-4 text-gold" />
                    Select Celebration Type
                  </label>
                  <div className="max-w-md">
                    <CelebrationTypeSelector
                      value={celebrationFilter}
                      onChange={handleCelebrationChange}
                      placeholder="Browse all celebration types..."
                      compact
                    />
                  </div>
                  {celebrationDisplayName && (
                    <p className="mt-2 text-sm text-gold">
                      Filtering by: {celebrationDisplayName}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/60 font-body">
            <span className="font-semibold text-white">{filteredSuppliers.length}</span> suppliers found
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gold text-navy' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gold text-navy' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Filters Pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-body">
                {filters.category}
                <button onClick={() => setFilters({ category: '' })} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {filters.region && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-body">
                {filters.region}
                <button onClick={() => setFilters({ region: '' })} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {filters.city && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-body">
                <MapPin className="w-3 h-3" />
                {filters.city}
                <button onClick={() => setFilters({ city: '' })} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {selectedCategories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-body">
                {getCategoryIcon(cat)}
                {cat}
                <button onClick={() => toggleCategorySelection(cat)} className="hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suppliers Grid */}
        {filteredSuppliers.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
              <Search className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="font-display text-2xl text-white mb-2">No suppliers found</h3>
            <p className="text-white/60 mb-6 font-body">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                resetFilters();
                setCelebrationFilter('');
                setCelebrationDisplayName('');
                setSelectedCategories([]);
              }}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-navy border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-display text-2xl">Send Inquiry to Suppliers</h2>
                  <p className="text-white/50 font-body text-sm mt-1">
                    Your inquiry will be sent to {suppliersInSelectedCategories.length} suppliers in {selectedCategories.length} categories
                  </p>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Categories */}
              <div>
                <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-2">Selected Categories</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <span key={cat} className="px-3 py-1 bg-gold/20 text-gold rounded-full text-sm font-body flex items-center gap-2">
                      {getCategoryIcon(cat)}
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Event Name</label>
                  <input
                    type="text"
                    value={emailFormData.eventName}
                    onChange={(e) => setEmailFormData({ ...emailFormData, eventName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                    placeholder="e.g., Smith Wedding"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Event Date</label>
                  <input
                    type="date"
                    value={emailFormData.eventDate}
                    onChange={(e) => setEmailFormData({ ...emailFormData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Event Type</label>
                  <select
                    value={emailFormData.eventType}
                    onChange={(e) => setEmailFormData({ ...emailFormData, eventType: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  >
                    <option value="" className="bg-navy">Select type</option>
                    <option value="wedding" className="bg-navy">Wedding</option>
                    <option value="corporate" className="bg-navy">Corporate</option>
                    <option value="celebration" className="bg-navy">Celebration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Guest Count</label>
                  <input
                    type="number"
                    value={emailFormData.guestCount}
                    onChange={(e) => setEmailFormData({ ...emailFormData, guestCount: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                    placeholder="e.g., 150"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Budget Range</label>
                <input
                  type="text"
                  value={emailFormData.budget}
                  onChange={(e) => setEmailFormData({ ...emailFormData, budget: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  placeholder="e.g., $10,000 - $15,000"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Message to Suppliers</label>
                <textarea
                  value={emailFormData.message}
                  onChange={(e) => setEmailFormData({ ...emailFormData, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50 resize-none"
                  placeholder="Describe your event and what you're looking for..."
                />
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Your Name</label>
                  <input
                    type="text"
                    value={emailFormData.contactName}
                    onChange={(e) => setEmailFormData({ ...emailFormData, contactName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={emailFormData.contactEmail}
                    onChange={(e) => setEmailFormData({ ...emailFormData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-white/50 uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="tel"
                    value={emailFormData.contactPhone}
                    onChange={(e) => setEmailFormData({ ...emailFormData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Questionnaire Preview */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-white font-display text-sm mb-3">Questionnaire will include:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {supplierQuestionnaireTemplate.general.slice(0, 4).map((q, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/60 text-xs font-body">
                      <Check className="w-3 h-3 text-gold" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInquiry}
                className="px-6 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body text-sm flex items-center gap-2 transition-all hover:scale-105"
                style={{ color: '#0B1426' }}
              >
                <Send className="w-4 h-4" />
                Send Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseSuppliers;
