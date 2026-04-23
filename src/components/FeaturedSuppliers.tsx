import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { suppliers } from '@/data/suppliers';
import { supplierCategories, accommodationTypes, venueSubcategories } from '@/data/venueTypes';
import SupplierCard from './SupplierCard';
import { 
  ArrowRight, Building2, Camera, Video, UtensilsCrossed, Flower2, Music, 
  Lightbulb, ClipboardList, Car, Bed, Sparkles, PenTool, Castle, Home, 
  Wine, Waves, TreePine, Mountain, Tent, Ship, Palmtree, Snowflake,
  Crown, Landmark, ChevronLeft, ChevronRight
} from 'lucide-react';

const FeaturedSuppliers: React.FC = () => {
  const { setCurrentView } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeAccommodationType, setActiveAccommodationType] = useState<string | null>(null);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Building2: <Building2 className="w-5 h-5" />,
      Camera: <Camera className="w-5 h-5" />,
      Video: <Video className="w-5 h-5" />,
      UtensilsCrossed: <UtensilsCrossed className="w-5 h-5" />,
      Flower2: <Flower2 className="w-5 h-5" />,
      Music: <Music className="w-5 h-5" />,
      Lightbulb: <Lightbulb className="w-5 h-5" />,
      ClipboardList: <ClipboardList className="w-5 h-5" />,
      Car: <Car className="w-5 h-5" />,
      Bed: <Bed className="w-5 h-5" />,
      Sparkles: <Sparkles className="w-5 h-5" />,
      PenTool: <PenTool className="w-5 h-5" />,
      Castle: <Castle className="w-5 h-5" />,
      Home: <Home className="w-5 h-5" />,
      Wine: <Wine className="w-5 h-5" />,
      Waves: <Waves className="w-5 h-5" />,
      TreePine: <TreePine className="w-5 h-5" />,
      Mountain: <Mountain className="w-5 h-5" />,
      Tent: <Tent className="w-5 h-5" />,
      Ship: <Ship className="w-5 h-5" />,
      Palmtree: <Palmtree className="w-5 h-5" />,
      Snowflake: <Snowflake className="w-5 h-5" />,
      Crown: <Crown className="w-5 h-5" />,
      Landmark: <Landmark className="w-5 h-5" />,
    };
    return icons[iconName] || <Building2 className="w-5 h-5" />;
  };

  // Get featured suppliers, optionally filtered by category
  const getFilteredSuppliers = () => {
    let filtered = suppliers.filter(s => s.featured);
    
    if (activeCategory) {
      const category = supplierCategories.find(c => c.id === activeCategory);
      if (category) {
        filtered = suppliers.filter(s => 
          s.category.toLowerCase() === category.name.toLowerCase() ||
          (s.subcategory && category.subcategories.includes(s.subcategory))
        );
      }
    }
    
    if (activeAccommodationType) {
      const accType = accommodationTypes.find(t => t.id === activeAccommodationType);
      if (accType) {
        filtered = suppliers.filter(s => 
          s.subcategory?.toLowerCase().includes(accType.name.toLowerCase()) ||
          s.category === 'Venues'
        );
      }
    }
    
    return filtered.slice(0, 8);
  };

  const filteredSuppliers = getFilteredSuppliers();

  // Popular accommodation types for the horizontal scroll
  const popularAccommodationTypes = accommodationTypes.filter(t => t.popular);

  return (
    <section className="py-28" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span 
            className="text-xs uppercase tracking-[0.2em] text-gold"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Curated Selection
          </span>
          <h2 
            className="text-4xl md:text-5xl font-light mt-5 mb-6 tracking-[0.06em]"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            Featured Suppliers
          </h2>
          <p 
            className="text-base max-w-2xl mx-auto"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Inter", sans-serif',
              opacity: 0.75,
            }}
          >
            Discover our handpicked collection of the world's finest event suppliers, 
            each vetted for excellence and exceptional service.
          </p>
        </div>

        {/* Accommodation Types Horizontal Scroll (Airbnb Style) */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg" style={{ color: '#FFFFFF' }}>
              Browse by Accommodation Type
            </h3>
          </div>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {popularAccommodationTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveAccommodationType(activeAccommodationType === type.id ? null : type.id);
                    setActiveCategory(null);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-xl border transition-all ${
                    activeAccommodationType === type.id
                      ? 'bg-gold/20 border-gold text-gold'
                      : 'bg-white/[0.03] border-white/[0.08] text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {getIconComponent(type.icon)}
                  <span className="font-body text-sm whitespace-nowrap">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Supplier Categories */}
        <div className="mb-10">
          <h3 className="font-display text-lg mb-4" style={{ color: '#FFFFFF' }}>
            Browse by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveCategory(null);
                setActiveAccommodationType(null);
              }}
              className={`px-5 py-2.5 rounded-full font-body text-sm transition-all flex items-center gap-2 ${
                !activeCategory && !activeAccommodationType
                  ? 'bg-gold text-navy'
                  : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.1]'
              }`}
            >
              All Featured
            </button>
            {supplierCategories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(activeCategory === category.id ? null : category.id);
                  setActiveAccommodationType(null);
                }}
                className={`px-5 py-2.5 rounded-full font-body text-sm transition-all flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-gold text-navy'
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/[0.1]'
                }`}
              >
                {getIconComponent(category.icon)}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories (when a category is selected) */}
        {activeCategory && (
          <div className="mb-10 animate-fadeIn">
            <h4 className="font-body text-sm uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {supplierCategories.find(c => c.id === activeCategory)?.name} Subcategories
            </h4>
            <div className="flex flex-wrap gap-2">
              {supplierCategories
                .find(c => c.id === activeCategory)
                ?.subcategories.map(sub => (
                  <span
                    key={sub}
                    className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg font-body text-sm text-white/60 hover:border-gold/30 hover:text-gold cursor-pointer transition-all"
                  >
                    {sub}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Venue Types Grid (when Venues category is selected) */}
        {activeCategory === 'venues' && (
          <div className="mb-10 animate-fadeIn">
            <h4 className="font-body text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Popular Venue Types
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {venueSubcategories.slice(0, 12).map(venue => (
                <div
                  key={venue.id}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-gold/30 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                    {getIconComponent(venue.icon)}
                  </div>
                  <h5 className="font-display text-sm mb-1" style={{ color: '#FFFFFF' }}>{venue.name}</h5>
                  <p className="font-body text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {venue.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accommodation Types Grid (when Accommodation category is selected) */}
        {activeCategory === 'accommodation' && (
          <div className="mb-10 animate-fadeIn">
            <h4 className="font-body text-sm uppercase tracking-wider mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Accommodation Styles
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {accommodationTypes.slice(0, 18).map(accType => (
                <div
                  key={accType.id}
                  onClick={() => setActiveAccommodationType(accType.id)}
                  className={`bg-white/[0.03] border rounded-xl p-4 transition-all cursor-pointer group ${
                    activeAccommodationType === accType.id
                      ? 'border-gold bg-gold/10'
                      : 'border-white/[0.08] hover:border-gold/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                    activeAccommodationType === accType.id ? 'bg-gold/30' : 'bg-gold/10 group-hover:bg-gold/20'
                  }`}>
                    {getIconComponent(accType.icon)}
                  </div>
                  <h5 className="font-display text-sm mb-1" style={{ color: '#FFFFFF' }}>{accType.name}</h5>
                  <p className="font-body text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {accType.description}
                  </p>
                  {accType.popular && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gold/20 rounded text-xs font-body text-gold">
                      Popular
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filter Badge */}
        {(activeCategory || activeAccommodationType) && (
          <div className="mb-6 flex items-center gap-2">
            <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Showing:
            </span>
            {activeCategory && (
              <span className="px-3 py-1 bg-gold/20 rounded-full text-gold text-sm font-body flex items-center gap-2">
                {supplierCategories.find(c => c.id === activeCategory)?.name}
                <button onClick={() => setActiveCategory(null)} className="hover:text-white">×</button>
              </span>
            )}
            {activeAccommodationType && (
              <span className="px-3 py-1 bg-gold/20 rounded-full text-gold text-sm font-body flex items-center gap-2">
                {accommodationTypes.find(t => t.id === activeAccommodationType)?.name}
                <button onClick={() => setActiveAccommodationType(null)} className="hover:text-white">×</button>
              </span>
            )}
          </div>
        )}

        {/* Supplier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gold" />
            </div>
            <p className="font-display text-xl mb-2" style={{ color: '#FFFFFF' }}>No suppliers found</p>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Try selecting a different category
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => setCurrentView('browse')}
            className="inline-flex items-center gap-3 px-10 py-4 font-medium text-xs uppercase tracking-[0.15em] rounded-lg transition-all group bg-gradient-to-r from-gold-light via-gold to-gold-dark hover:shadow-lg hover:shadow-gold/20"
            style={{ color: '#0B1426' }}
          >
            <span>View All Suppliers</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Supplier Upload CTA */}
        <div className="mt-16 bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h3 className="font-display text-xl mb-1" style={{ color: '#FFFFFF' }}>
                Are you a supplier?
              </h3>
              <p className="font-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Upload your venue images, floor plans, capacity charts, and hotel rooms to showcase your offerings.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('supplier-upload')}
            className="px-8 py-3 bg-white/[0.05] border border-gold/50 rounded-lg font-body font-medium text-gold hover:bg-gold/10 transition-all whitespace-nowrap"
          >
            Upload Media
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSuppliers;
