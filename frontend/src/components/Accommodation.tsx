import React, { useState } from 'react';
import { 
  MapPin, Star, Users, Calendar, ExternalLink, Percent, Building, Home, Hotel, Bed, 
  Filter, Search, Heart, ChevronDown, Castle, Wine, Waves, TreePine, Mountain, Tent,
  Ship, Palmtree, Snowflake, Sparkles, Leaf, Anchor, Box, Globe, Zap, Tractor,
  Warehouse, Wind, Sun, Binoculars, RefreshCw, X
} from 'lucide-react';
import { accommodationTypes } from '@/data/venueTypes';

interface AccommodationListing {
  id: string;
  name: string;
  type: string;
  image: string;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  originalPrice?: number;
  currency: string;
  guests: number;
  bedrooms: number;
  amenities: string[];
  platform: 'booking' | 'airbnb' | 'direct';
  commission: number;
  preferentialRate: boolean;
  availability: boolean;
  accommodationType: string;
}

const accommodations: AccommodationListing[] = [
  // Castles
  {
    id: '1',
    name: 'Château de Mirambeau',
    type: 'castle',
    accommodationType: 'castles',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
    location: 'Mirambeau, France',
    distance: 'Bordeaux Region',
    rating: 4.95,
    reviews: 234,
    pricePerNight: 1200,
    originalPrice: 1500,
    currency: 'EUR',
    guests: 16,
    bedrooms: 8,
    amenities: ['Pool', 'Wine Cellar', 'Gardens', 'Chef Available', 'Helipad'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  {
    id: '2',
    name: 'Ashford Castle Estate',
    type: 'castle',
    accommodationType: 'castles',
    image: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800&q=80',
    location: 'County Mayo, Ireland',
    distance: 'West Ireland',
    rating: 4.9,
    reviews: 567,
    pricePerNight: 890,
    currency: 'EUR',
    guests: 4,
    bedrooms: 2,
    amenities: ['Spa', 'Golf', 'Falconry', 'Fine Dining', 'Lake Views'],
    platform: 'booking',
    commission: 10,
    preferentialRate: true,
    availability: true,
  },
  // Villas
  {
    id: '3',
    name: 'Villa Cimbrone Ravello',
    type: 'villa',
    accommodationType: 'villas',
    image: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
    location: 'Ravello, Amalfi Coast',
    distance: 'Amalfi Coast',
    rating: 4.98,
    reviews: 189,
    pricePerNight: 2500,
    originalPrice: 3000,
    currency: 'EUR',
    guests: 12,
    bedrooms: 6,
    amenities: ['Infinity Terrace', 'Gardens', 'Sea Views', 'Private Chef', 'Pool'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  // Vineyards
  {
    id: '4',
    name: 'Delaire Graff Lodge',
    type: 'vineyard',
    accommodationType: 'vineyards',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    location: 'Stellenbosch, South Africa',
    distance: 'Cape Winelands',
    rating: 4.95,
    reviews: 312,
    pricePerNight: 650,
    currency: 'USD',
    guests: 2,
    bedrooms: 1,
    amenities: ['Wine Tasting', 'Spa', 'Fine Dining', 'Art Gallery', 'Mountain Views'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  {
    id: '5',
    name: 'Château Margaux Guest House',
    type: 'vineyard',
    accommodationType: 'vineyards',
    image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800&q=80',
    location: 'Margaux, Bordeaux',
    distance: 'Médoc Region',
    rating: 4.9,
    reviews: 145,
    pricePerNight: 450,
    currency: 'EUR',
    guests: 4,
    bedrooms: 2,
    amenities: ['Vineyard Tours', 'Wine Cellar', 'Breakfast', 'Gardens'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: true,
    availability: true,
  },
  // Treehouses
  {
    id: '6',
    name: 'Secluded Treehouse Retreat',
    type: 'treehouse',
    accommodationType: 'treehouses',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    location: 'Bali, Indonesia',
    distance: 'Ubud Jungle',
    rating: 4.92,
    reviews: 423,
    pricePerNight: 280,
    currency: 'USD',
    guests: 2,
    bedrooms: 1,
    amenities: ['Jungle Views', 'Private Pool', 'Outdoor Shower', 'Breakfast'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: false,
    availability: true,
  },
  // Beachfront
  {
    id: '7',
    name: 'Maldives Overwater Villa',
    type: 'beachfront',
    accommodationType: 'beachfront',
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80',
    location: 'North Malé Atoll, Maldives',
    distance: 'Private Island',
    rating: 4.99,
    reviews: 678,
    pricePerNight: 1800,
    originalPrice: 2200,
    currency: 'USD',
    guests: 2,
    bedrooms: 1,
    amenities: ['Overwater', 'Glass Floor', 'Butler Service', 'Spa', 'Diving'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  {
    id: '8',
    name: 'Clifton Beach House',
    type: 'beachfront',
    accommodationType: 'beachfront',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    location: 'Clifton, Cape Town',
    distance: 'Atlantic Seaboard',
    rating: 4.88,
    reviews: 234,
    pricePerNight: 950,
    currency: 'USD',
    guests: 8,
    bedrooms: 4,
    amenities: ['Beach Access', 'Pool', 'Ocean Views', 'Chef Available'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: true,
    availability: true,
  },
  // Mansions
  {
    id: '9',
    name: 'Beverly Hills Estate',
    type: 'mansion',
    accommodationType: 'mansions',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    location: 'Beverly Hills, California',
    distance: 'Los Angeles',
    rating: 4.85,
    reviews: 156,
    pricePerNight: 3500,
    currency: 'USD',
    guests: 16,
    bedrooms: 8,
    amenities: ['Pool', 'Cinema', 'Gym', 'Tennis Court', 'Staff'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  // Domes
  {
    id: '10',
    name: 'Santorini Dome Suite',
    type: 'dome',
    accommodationType: 'domes',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
    location: 'Oia, Santorini',
    distance: 'Cyclades Islands',
    rating: 4.94,
    reviews: 567,
    pricePerNight: 480,
    currency: 'EUR',
    guests: 2,
    bedrooms: 1,
    amenities: ['Caldera Views', 'Private Pool', 'Sunset Views', 'Breakfast'],
    platform: 'booking',
    commission: 10,
    preferentialRate: true,
    availability: true,
  },
  // Safari Lodges
  {
    id: '11',
    name: 'Singita Lebombo Lodge',
    type: 'safari',
    accommodationType: 'safari',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80',
    location: 'Kruger National Park',
    distance: 'South Africa',
    rating: 4.98,
    reviews: 423,
    pricePerNight: 1500,
    currency: 'USD',
    guests: 2,
    bedrooms: 1,
    amenities: ['Game Drives', 'Private Deck', 'All-Inclusive', 'Spa', 'Pool'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  // Houseboats
  {
    id: '12',
    name: 'Amsterdam Canal Houseboat',
    type: 'houseboat',
    accommodationType: 'houseboats',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
    location: 'Jordaan, Amsterdam',
    distance: 'City Center',
    rating: 4.82,
    reviews: 289,
    pricePerNight: 320,
    currency: 'EUR',
    guests: 4,
    bedrooms: 2,
    amenities: ['Canal Views', 'Deck', 'Kitchen', 'Central Location'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: false,
    availability: true,
  },
  // Farms
  {
    id: '13',
    name: 'Tuscan Farmhouse Estate',
    type: 'farm',
    accommodationType: 'farms',
    image: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
    location: 'Chianti, Tuscany',
    distance: 'Florence Region',
    rating: 4.91,
    reviews: 345,
    pricePerNight: 380,
    currency: 'EUR',
    guests: 10,
    bedrooms: 5,
    amenities: ['Pool', 'Olive Grove', 'Wine Production', 'Cooking Classes'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: true,
    availability: true,
  },
  // Ski-in/Ski-out
  {
    id: '14',
    name: 'Chalet Zermatt Peak',
    type: 'ski',
    accommodationType: 'ski-in-out',
    image: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?w=800&q=80',
    location: 'Zermatt, Switzerland',
    distance: 'Matterhorn',
    rating: 4.96,
    reviews: 234,
    pricePerNight: 2800,
    originalPrice: 3500,
    currency: 'CHF',
    guests: 12,
    bedrooms: 6,
    amenities: ['Ski-in/Ski-out', 'Hot Tub', 'Sauna', 'Chef', 'Matterhorn Views'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  // Islands
  {
    id: '15',
    name: 'Private Island Fiji',
    type: 'island',
    accommodationType: 'islands',
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80',
    location: 'Mamanuca Islands, Fiji',
    distance: 'South Pacific',
    rating: 5.0,
    reviews: 89,
    pricePerNight: 5000,
    currency: 'USD',
    guests: 20,
    bedrooms: 10,
    amenities: ['Private Island', 'Beach', 'Diving', 'Yacht', 'Full Staff'],
    platform: 'direct',
    commission: 15,
    preferentialRate: true,
    availability: true,
  },
  // Glamping
  {
    id: '16',
    name: 'Luxury Safari Tent Morocco',
    type: 'glamping',
    accommodationType: 'glamping',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
    location: 'Agafay Desert, Morocco',
    distance: 'Near Marrakech',
    rating: 4.87,
    reviews: 178,
    pricePerNight: 350,
    currency: 'EUR',
    guests: 2,
    bedrooms: 1,
    amenities: ['Desert Views', 'Pool', 'Stargazing', 'Camel Rides', 'Breakfast'],
    platform: 'airbnb',
    commission: 12,
    preferentialRate: false,
    availability: true,
  },
];

const Accommodation: React.FC = () => {
  const [listings] = useState(accommodations);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('recommended');
  const [savedListings, setSavedListings] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const toggleSave = (id: string) => {
    setSavedListings(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredListings = listings
    .filter(l => {
      if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !l.location.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedType !== 'all' && l.accommodationType !== selectedType) return false;
      if (selectedPlatform !== 'all' && l.platform !== selectedPlatform) return false;
      if (l.pricePerNight < priceRange[0] || l.pricePerNight > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.pricePerNight - b.pricePerNight;
        case 'price-high': return b.pricePerNight - a.pricePerNight;
        case 'rating': return b.rating - a.rating;
        default: return b.preferentialRate ? 1 : -1;
      }
    });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'booking': return <Building className="w-4 h-4" />;
      case 'airbnb': return <Home className="w-4 h-4" />;
      case 'direct': return <Hotel className="w-4 h-4" />;
      default: return <Hotel className="w-4 h-4" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'booking': return 'Booking.com';
      case 'airbnb': return 'Airbnb';
      case 'direct': return 'Direct Booking';
      default: return platform;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      castle: <Castle className="w-5 h-5" />,
      villa: <Home className="w-5 h-5" />,
      vineyard: <Wine className="w-5 h-5" />,
      beachfront: <Waves className="w-5 h-5" />,
      treehouse: <TreePine className="w-5 h-5" />,
      mansion: <Building className="w-5 h-5" />,
      dome: <Globe className="w-5 h-5" />,
      safari: <Binoculars className="w-5 h-5" />,
      houseboat: <Ship className="w-5 h-5" />,
      farm: <Tractor className="w-5 h-5" />,
      ski: <Snowflake className="w-5 h-5" />,
      island: <Palmtree className="w-5 h-5" />,
      glamping: <Tent className="w-5 h-5" />,
    };
    return icons[type] || <Hotel className="w-5 h-5" />;
  };

  // Get popular accommodation types for filter
  const popularTypes = accommodationTypes.filter(t => t.popular);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em] mb-4" style={{ color: '#FFFFFF' }}>
            Guest Accommodation
          </h1>
          <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Book preferential rates for your guests and earn commission on every booking
          </p>
        </div>

        {/* Commission Banner */}
        <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
              <Percent className="w-7 h-7 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl" style={{ color: '#FFFFFF' }}>Earn 10-15% Commission</h3>
              <p className="font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                On every booking made through The One platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-4 py-2 bg-gold/20 rounded-full font-body text-sm text-gold">Booking.com: 10%</span>
            <span className="px-4 py-2 bg-gold/20 rounded-full font-body text-sm text-gold">Airbnb: 12%</span>
            <span className="px-4 py-2 bg-gold/20 rounded-full font-body text-sm text-gold">Direct: 15%</span>
          </div>
        </div>

        {/* Accommodation Type Horizontal Scroll */}
        <div className="mb-8">
          <h3 className="font-display text-lg mb-4" style={{ color: '#FFFFFF' }}>
            Browse by Style
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-shrink-0 flex flex-col items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                selectedType === 'all'
                  ? 'bg-gold/20 border-gold text-gold'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:border-white/20'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-body text-xs whitespace-nowrap">All Styles</span>
            </button>
            {popularTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                  selectedType === type.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:border-white/20'
                }`}
              >
                {getTypeIcon(type.id.replace('-', ''))}
                <span className="font-body text-xs whitespace-nowrap">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white flex items-center gap-2 hover:bg-white/[0.1] transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50"
            >
              <option value="recommended" className="bg-navy">Recommended</option>
              <option value="price-low" className="bg-navy">Price: Low to High</option>
              <option value="price-high" className="bg-navy">Price: High to Low</option>
              <option value="rating" className="bg-navy">Highest Rated</option>
            </select>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08] animate-fadeIn">
              <div>
                <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Accommodation Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50"
                >
                  <option value="all" className="bg-navy">All Types</option>
                  {accommodationTypes.map(type => (
                    <option key={type.id} value={type.id} className="bg-navy">{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Booking Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50"
                >
                  <option value="all" className="bg-navy">All Platforms</option>
                  <option value="booking" className="bg-navy">Booking.com</option>
                  <option value="airbnb" className="bg-navy">Airbnb</option>
                  <option value="direct" className="bg-navy">Direct Booking</option>
                </select>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Price Range (per night)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50"
                    placeholder="Min"
                  />
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl font-body text-white focus:outline-none focus:border-gold/50"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {(selectedType !== 'all' || selectedPlatform !== 'all') && (
          <div className="flex items-center gap-2 mb-6">
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Active filters:</span>
            {selectedType !== 'all' && (
              <span className="px-3 py-1 bg-gold/20 rounded-full text-gold text-sm font-body flex items-center gap-2">
                {accommodationTypes.find(t => t.id === selectedType)?.name}
                <button onClick={() => setSelectedType('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedPlatform !== 'all' && (
              <span className="px-3 py-1 bg-gold/20 rounded-full text-gold text-sm font-body flex items-center gap-2">
                {getPlatformName(selectedPlatform)}
                <button onClick={() => setSelectedPlatform('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {filteredListings.length} properties found
          </p>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Properties with preferential rates shown first
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <div
              key={listing.id}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-gold/30 transition-all group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-body font-medium rounded-full flex items-center gap-1">
                    {getTypeIcon(listing.type)}
                    {accommodationTypes.find(t => t.id === listing.accommodationType)?.name || listing.type}
                  </span>
                  {listing.preferentialRate && (
                    <span className="px-3 py-1 bg-gold text-navy text-xs font-body font-medium rounded-full flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      Preferential
                    </span>
                  )}
                </div>
                
                {/* Save Button */}
                <button
                  onClick={() => toggleSave(listing.id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${savedListings.includes(listing.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </button>
                
                {/* Platform Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
                  {getPlatformIcon(listing.platform)}
                  <span className="font-body text-xs text-white">{getPlatformName(listing.platform)}</span>
                </div>
                
                {/* Commission Badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-green-500/80 backdrop-blur-sm rounded-full">
                  <span className="font-body text-xs text-white font-medium">{listing.commission}% commission</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-lg" style={{ color: '#FFFFFF' }}>{listing.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    <span className="font-body text-sm" style={{ color: '#FFFFFF' }}>{listing.rating}</span>
                    <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>({listing.reviews})</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{listing.location}</span>
                </div>
                
                <p className="font-body text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{listing.distance}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-white/40" />
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{listing.guests} guests</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4 text-white/40" />
                    <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{listing.bedrooms} bed</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.amenities.slice(0, 3).map(amenity => (
                    <span key={amenity} className="px-2 py-1 bg-white/[0.05] rounded text-xs font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {amenity}
                    </span>
                  ))}
                  {listing.amenities.length > 3 && (
                    <span className="px-2 py-1 bg-white/[0.05] rounded text-xs font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      +{listing.amenities.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-end justify-between pt-4 border-t border-white/[0.08]">
                  <div>
                    {listing.originalPrice && (
                      <span className="font-body text-sm line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {listing.currency === 'EUR' ? '€' : listing.currency === 'CHF' ? 'CHF ' : '$'}{listing.originalPrice}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl text-gold">
                        {listing.currency === 'EUR' ? '€' : listing.currency === 'CHF' ? 'CHF ' : '$'}{listing.pricePerNight}
                      </span>
                      <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>/night</span>
                    </div>
                  </div>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body font-medium text-sm flex items-center gap-2" style={{ color: '#0B1426' }}>
                    Book Now
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Hotel className="w-10 h-10 text-gold" />
            </div>
            <p className="font-display text-xl mb-2" style={{ color: '#FFFFFF' }}>No properties found</p>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>Try adjusting your filters</p>
          </div>
        )}

        {/* All Accommodation Types Grid */}
        <div className="mt-16">
          <h2 className="font-display text-2xl mb-6" style={{ color: '#FFFFFF' }}>
            Explore All Accommodation Types
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {accommodationTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`bg-white/[0.03] border rounded-xl p-4 transition-all text-left hover:border-gold/30 group ${
                  selectedType === type.id ? 'border-gold bg-gold/10' : 'border-white/[0.08]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                  selectedType === type.id ? 'bg-gold/30 text-gold' : 'bg-gold/10 text-gold/70 group-hover:bg-gold/20'
                }`}>
                  {getTypeIcon(type.id.replace('-', ''))}
                </div>
                <h5 className="font-display text-sm mb-1" style={{ color: '#FFFFFF' }}>{type.name}</h5>
                <p className="font-body text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {type.description}
                </p>
                {type.popular && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gold/20 rounded text-xs font-body text-gold">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accommodation;
