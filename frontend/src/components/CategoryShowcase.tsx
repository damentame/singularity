import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { categories, suppliers } from '@/data/suppliers';
import { 
  Building2, Camera, Video, UtensilsCrossed, Flower2, 
  Music, Lightbulb, ClipboardList, Car, ArrowRight 
} from 'lucide-react';

const iconMap: { [key: string]: React.ElementType } = {
  Building2,
  Camera,
  Video,
  UtensilsCrossed,
  Flower2,
  Music,
  Lightbulb,
  ClipboardList,
  Car,
};

const categoryImages: { [key: string]: string } = {
  venues: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600',
  photography: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600',
  videography: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600',
  florals: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600',
  entertainment: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600',
  lighting: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600',
  planners: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600',
  transport: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600',
};

const CategoryShowcase: React.FC = () => {
  const { setCurrentView, setFilters } = useAppContext();

  const handleCategoryClick = (categoryId: string) => {
    const categoryName = categories.find(c => c.id === categoryId)?.name || '';
    setFilters({ category: categoryName });
    setCurrentView('browse');
  };

  return (
    <section className="py-28 relative" style={{ backgroundColor: '#0B1426' }}>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <span 
            className="text-xs uppercase tracking-[0.2em] text-gold"
            style={{ fontFamily: '"Inter", sans-serif' }}
          >
            Explore Categories
          </span>
          <h2 
            className="text-4xl md:text-5xl font-light mt-5 mb-6 tracking-[0.06em]"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            Find Your Perfect Match
          </h2>
          <p 
            className="text-xl max-w-2xl mx-auto leading-relaxed italic font-light"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '"Playfair Display", Georgia, serif',
              opacity: 0.75,
            }}
          >
            Browse our comprehensive selection of event suppliers across every category 
            you need to create an unforgettable experience.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Building2;
            const count = suppliers.filter(s => s.category === category.name).length;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group relative overflow-hidden rounded-2xl aspect-square hover-lift"
              >
                <img
                  src={categoryImages[category.id]}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1426] via-[#0B1426]/50 to-transparent group-hover:from-[#0B1426]/95 transition-all duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/25 to-gold/5 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-gold/25">
                    <Icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
                  </div>
                  <h3 
                    className="text-base font-light text-center tracking-[0.06em]"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: '"Playfair Display", Georgia, serif',
                    }}
                  >
                    {category.name}
                  </h3>
                  <p 
                    className="text-xs uppercase tracking-[0.15em] mt-2"
                    style={{ 
                      color: '#FFFFFF',
                      fontFamily: '"Inter", sans-serif',
                      opacity: 0.8,
                    }}
                  >
                    {count} suppliers
                  </p>
                  <div 
                    className="mt-4 flex items-center text-gold text-xs uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ fontFamily: '"Inter", sans-serif' }}
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
