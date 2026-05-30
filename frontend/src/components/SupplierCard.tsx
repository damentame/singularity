import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Supplier } from '@/data/suppliers';
import { Heart, MapPin, Star, BadgeCheck, Zap } from 'lucide-react';

interface SupplierCardProps {
  supplier: Supplier;
}

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier }) => {
  const { setCurrentView, setSelectedSupplierId, toggleWishlist, isInWishlist } = useAppContext();

  const handleClick = () => {
    setSelectedSupplierId(supplier.id);
    setCurrentView('supplier');
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(supplier.id);
  };

  const inWishlist = isInWishlist(supplier.id);

  // Render star rating with partial fill support
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasPartial = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= fullStars 
                ? 'text-gold fill-gold' 
                : star === fullStars + 1 && hasPartial
                  ? 'text-gold fill-gold/50'
                  : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover-lift border border-gray-100"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={supplier.images[0]}
          alt={supplier.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {supplier.featured && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-gold-light to-gold font-body text-caption uppercase rounded-full shadow-lg" style={{ color: '#0a1628' }}>
              Featured
            </span>
          )}
          {supplier.instantBook && (
            <span className="px-3 py-1.5 bg-white/95 font-body text-caption uppercase rounded-full flex items-center gap-1.5 shadow-lg" style={{ color: '#0a1628' }}>
              <Zap className="w-3 h-3" />
              Instant
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
            inWishlist
              ? 'bg-gradient-to-br from-gold-light to-gold'
              : 'bg-white/95 text-gray-500 hover:bg-white hover:text-gold'
          }`}
          style={{ color: inWishlist ? '#0a1628' : undefined }}
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} strokeWidth={1.5} />
        </button>

        {/* Sub-venues indicator */}
        {supplier.subVenues && supplier.subVenues.length > 0 && (
          <div className="absolute bottom-4 left-4 px-4 py-1.5 backdrop-blur-sm font-body text-caption uppercase rounded-full border border-gold/30" style={{ backgroundColor: 'rgba(10, 22, 40, 0.9)', color: '#FFFFFF' }}>
            {supplier.subVenues.length} Spaces
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category & Location */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="font-body text-caption uppercase text-gold">{supplier.category}</span>
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="w-4 h-4" strokeWidth={1.5} />
            <span className="font-body text-body-sm">{supplier.city}, {supplier.country}</span>
          </div>
        </div>

        {/* Name */}
        <h3 
          className="font-display text-xl font-normal mb-4 group-hover:text-gold transition-colors duration-300 tracking-[0.04em]"
          style={{ color: '#0a1628' }}
        >
          {supplier.name}
        </h3>

        {/* Description */}
        <p 
          className="font-body text-body-sm mb-6 line-clamp-2 leading-relaxed"
          style={{ color: '#6b7280' }}
        >
          {supplier.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          {/* Rating with Stars */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {renderStars(supplier.rating)}
                <span className="font-display font-semibold text-lg" style={{ color: '#0a1628' }}>
                  {supplier.rating}
                </span>
              </div>
              <span className="text-gray-400 font-body text-xs">
                {supplier.reviewCount} review{supplier.reviewCount !== 1 ? 's' : ''}
              </span>
            </div>
            {supplier.verified && (
              <BadgeCheck className="w-5 h-5 text-blue-500 ml-1" strokeWidth={1.5} />
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="font-body text-caption uppercase text-gray-400">From</span>
            <p className="font-display font-medium text-lg" style={{ color: '#0a1628' }}>{supplier.priceRange.split(' - ')[0]}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierCard;
