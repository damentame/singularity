import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Star, CheckCircle, Globe, Instagram, 
  MessageSquare, Eye, Building2, Calendar
} from 'lucide-react';

export interface ServiceProviderData {
  id: string;
  user_id: string;
  business_name: string;
  trading_name: string;
  business_description: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  service_radius: string;
  website: string;
  instagram: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
  selected_event_types: string[];
  selected_categories: Record<string, string[]>;
  service_details: Record<string, Record<string, any>>;
  insurance_types: string[];
  public_liability_amount: string;
  policy_number: string;
  insurance_expiry_date: string;
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  years_in_operation: string;
  team_size: string;
  business_type: string;
  created_at: string;
  // Joined data
  portfolio_count?: number;
  review_count?: number;
  average_rating?: number;
}

interface ProviderSearchCardProps {
  provider: ServiceProviderData;
  onRequestQuote: (provider: ServiceProviderData) => void;
  onViewProfile: (provider: ServiceProviderData) => void;
}

const ProviderSearchCard: React.FC<ProviderSearchCardProps> = ({
  provider,
  onRequestQuote,
  onViewProfile,
}) => {
  // Get all categories across all event types
  const getAllCategories = (): string[] => {
    if (!provider.selected_categories) return [];
    const categories: string[] = [];
    Object.values(provider.selected_categories).forEach(cats => {
      cats.forEach(cat => {
        if (!categories.includes(cat)) {
          categories.push(cat);
        }
      });
    });
    return categories.slice(0, 4); // Show max 4 categories
  };

  const categories = getAllCategories();
  const eventTypes = provider.selected_event_types || [];

  // Get a placeholder image based on business type
  const getPlaceholderImage = () => {
    const images: Record<string, string> = {
      'Photography': 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&h=300&fit=crop',
      'Videography': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
      'Catering': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop',
      'Florals': 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop',
      'Venues': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop',
      'Entertainment': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
      'Planners': 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=400&h=300&fit=crop',
    };
    
    // Try to match a category
    for (const cat of categories) {
      if (images[cat]) return images[cat];
    }
    
    // Default image
    return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop';
  };

  return (
    <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20 overflow-hidden group hover:border-[#B8956A]/50 transition-all duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={getPlaceholderImage()}
          alt={provider.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1426] via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {provider.is_featured && (
            <Badge className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white border-0">
              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
            </Badge>
          )}
          {provider.is_verified && (
            <Badge className="bg-emerald-500/90 text-white border-0">
              <CheckCircle className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </div>

        {/* Quick View Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewProfile(provider)}
            className="bg-white/90 text-[#0B1426] hover:bg-white"
          >
            <Eye className="w-4 h-4 mr-1" /> View
          </Button>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Business Name & Location */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white group-hover:text-[#B8956A] transition-colors line-clamp-1">
            {provider.business_name}
          </h3>
          {provider.trading_name && provider.trading_name !== provider.business_name && (
            <p className="text-white/50 text-sm">Trading as: {provider.trading_name}</p>
          )}
          <div className="flex items-center gap-1 mt-1 text-white/60 text-sm">
            <MapPin className="w-4 h-4 text-[#B8956A]" />
            <span>{provider.city}, {provider.state}</span>
            {provider.country && <span className="text-white/40">• {provider.country}</span>}
          </div>
        </div>

        {/* Description */}
        {provider.business_description && (
          <p className="text-white/70 text-sm line-clamp-2 mb-4">
            {provider.business_description}
          </p>
        )}

        {/* Event Types */}
        {eventTypes.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {eventTypes.slice(0, 3).map(eventType => (
                <Badge 
                  key={eventType} 
                  variant="outline" 
                  className="bg-[#B8956A]/10 text-[#B8956A] border-[#B8956A]/30 text-xs"
                >
                  {eventType}
                </Badge>
              ))}
              {eventTypes.length > 3 && (
                <Badge variant="outline" className="bg-white/5 text-white/60 border-white/20 text-xs">
                  +{eventTypes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map(category => (
                <Badge 
                  key={category} 
                  className="bg-white/10 text-white/80 border-white/20 text-xs"
                >
                  {category}
                </Badge>
              ))}
              {Object.values(provider.selected_categories || {}).flat().length > 4 && (
                <Badge className="bg-white/5 text-white/50 border-white/10 text-xs">
                  +{Object.values(provider.selected_categories || {}).flat().length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {provider.years_in_operation && (
            <div className="flex items-center gap-1 text-white/60">
              <Calendar className="w-4 h-4 text-[#B8956A]" />
              <span>{provider.years_in_operation} years</span>
            </div>
          )}
          {provider.team_size && (
            <div className="flex items-center gap-1 text-white/60">
              <Building2 className="w-4 h-4 text-[#B8956A]" />
              <span>{provider.team_size}</span>
            </div>
          )}
          {provider.average_rating && (
            <div className="flex items-center gap-1 text-white/60">
              <Star className="w-4 h-4 text-[#B8956A] fill-current" />
              <span>{provider.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3 mb-4">
          {provider.website && (
            <a 
              href={provider.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#B8956A] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          {provider.instagram && (
            <a 
              href={`https://instagram.com/${provider.instagram.replace('@', '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#B8956A] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onRequestQuote(provider)}
            className="flex-1 bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white hover:opacity-90"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Request Quote
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewProfile(provider)}
            className="border-[#B8956A]/30 text-[#B8956A] hover:bg-[#B8956A]/10"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderSearchCard;
