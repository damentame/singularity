import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { suppliers } from '@/data/suppliers';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Heart, Share2, MapPin, Star, BadgeCheck, Clock, 
  Globe, DollarSign, Calendar, ChevronLeft, ChevronRight, X,
  Users, Maximize, Check, LayoutGrid, Bed, Video, Camera,
  Upload, Building2, Eye, EyeOff, MessageSquare, FileText
} from 'lucide-react';
import ReviewsSection from './ReviewsSection';
import SupplierDetailsPanel from './SupplierDetailsPanel';
import QuoteRequestForm from './QuoteRequestForm';
import PortfolioGallery from './PortfolioGallery';


interface SupplierMedia {
  id: string;
  media_type: string;
  category: string;
  title: string;
  description: string;
  file_url: string;
  is_featured: boolean;
  is_cover: boolean;
}

const SupplierProfile: React.FC = () => {
  const { 
    selectedSupplierId, 
    setCurrentView, 
    toggleWishlist, 
    isInWishlist,
    user,
  } = useAppContext();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedSubVenue, setSelectedSubVenue] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'floorplans' | 'rooms' | 'videos'>('photos');
  const [supplierMedia, setSupplierMedia] = useState<SupplierMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [hidePricing, setHidePricing] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  
  const quoteFormRef = useRef<HTMLDivElement>(null);

  const supplier = suppliers.find(s => s.id === selectedSupplierId);

  // Load supplier media from database
  useEffect(() => {
    const loadMedia = async () => {
      if (!selectedSupplierId) return;
      
      try {
        const { data, error } = await supabase
          .from('supplier_media')
          .select('*')
          .eq('supplier_id', selectedSupplierId)
          .order('sort_order', { ascending: true });

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            setSupplierMedia([]);
            return;
          }
          throw error;
        }
        
        if (data) {
          setSupplierMedia(data);
        }
      } catch (err) {
        console.error('Error loading media:', err);
        setSupplierMedia([]);
      } finally {
        setLoadingMedia(false);
      }
    };

    loadMedia();
  }, [selectedSupplierId]);

  // Load portfolio URLs and cover image from service_providers table
  useEffect(() => {
    const loadPortfolio = async () => {
      if (!selectedSupplierId) return;
      
      try {
        // Try to find a service provider linked to this supplier
        const { data, error } = await supabase
          .from('service_providers')
          .select('portfolio_urls, cover_image_url')
          .or(`user_id.eq.${selectedSupplierId},id.eq.${selectedSupplierId}`)
          .limit(1);

        if (!error && data && data.length > 0) {
          if (data[0].portfolio_urls) {
            setPortfolioUrls(data[0].portfolio_urls);
          }
          if (data[0].cover_image_url) {
            setCoverImageUrl(data[0].cover_image_url);
          }
        }
      } catch (err) {
        console.error('Error loading portfolio:', err);
      }
    };

    loadPortfolio();
  }, [selectedSupplierId]);



  if (!supplier) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ backgroundColor: '#0B1426' }}>
        <div className="text-center">
          <h2 className="font-display text-2xl mb-4" style={{ color: '#FFFFFF' }}>Supplier not found</h2>
          <button
            onClick={() => setCurrentView('browse')}
            className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(supplier.id);

  const handleRequestQuote = () => {
    setShowQuoteForm(true);
    // Scroll to the quote form
    setTimeout(() => {
      quoteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Combine images — cover image first (hero), then static, then uploaded media
  const baseImages = [
    ...supplier.images,
    ...supplierMedia.filter(m => m.media_type === 'image').map(m => m.file_url)
  ];
  const allImages = coverImageUrl
    ? [coverImageUrl, ...baseImages.filter(img => img !== coverImageUrl)]
    : baseImages;


  const floorplans = supplierMedia.filter(m => m.media_type === 'floorplan');
  const hotelRooms = supplierMedia.filter(m => m.media_type === 'hotel_room');
  const videos = supplierMedia.filter(m => m.media_type === 'video');
  const capacityCharts = supplierMedia.filter(m => m.media_type === 'capacity_chart');

  // Get services from supplier
  const providerServices = supplier.amenities || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#F5F3EF' }}>
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => setCurrentView('browse')}
          className="flex items-center gap-2 text-navy hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Browse</span>
        </button>
      </div>

      {/* Hero Image Gallery */}
      <div className="relative h-[50vh] md:h-[60vh]" style={{ backgroundColor: '#0B1426' }}>
        <img
          src={allImages[currentImageIndex]}
          alt={supplier.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />

        {/* Gallery Navigation */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-navy" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-navy" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {allImages.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-gold' : 'bg-white/50'
              }`}
            />
          ))}
          {allImages.length > 10 && (
            <span className="text-white/70 text-xs">+{allImages.length - 10}</span>
          )}
        </div>

        {/* View All Photos */}
        <button
          onClick={() => setShowGallery(true)}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
        >
          <Maximize className="w-4 h-4" />
          <span className="text-sm font-medium">View All Photos ({allImages.length})</span>
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => toggleWishlist(supplier.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              inWishlist ? 'bg-gold text-navy' : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gold/10 text-gold text-sm font-medium rounded-full">
                  {supplier.category}
                </span>
                {supplier.subcategory && (
                  <span className="px-3 py-1 bg-navy/10 text-navy text-sm font-medium rounded-full">
                    {supplier.subcategory}
                  </span>
                )}
                {supplier.verified && (
                  <span className="flex items-center gap-1 text-blue-500 text-sm">
                    <BadgeCheck className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-navy font-semibold mb-4">
                {supplier.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>{supplier.city}, {supplier.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span className="font-semibold text-navy">{supplier.rating}</span>
                  <span>({supplier.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4 text-gold" />
                  <span>{supplier.region}</span>
                </div>
              </div>
            </div>

            {/* Media Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveMediaTab('photos')}
                  className={`flex-1 px-6 py-4 font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMediaTab === 'photos' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-navy'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Photos ({allImages.length})
                </button>
                <button
                  onClick={() => setActiveMediaTab('floorplans')}
                  className={`flex-1 px-6 py-4 font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMediaTab === 'floorplans' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-navy'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Floor Plans ({floorplans.length + (supplier.subVenues?.filter(v => v.floorPlanUrl).length || 0)})
                </button>
                <button
                  onClick={() => setActiveMediaTab('rooms')}
                  className={`flex-1 px-6 py-4 font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMediaTab === 'rooms' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-navy'
                  }`}
                >
                  <Bed className="w-4 h-4" />
                  Rooms ({hotelRooms.length})
                </button>
                <button
                  onClick={() => setActiveMediaTab('videos')}
                  className={`flex-1 px-6 py-4 font-body text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeMediaTab === 'videos' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-navy'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Videos ({videos.length})
                </button>
              </div>

              <div className="p-6">
                {activeMediaTab === 'photos' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {allImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setCurrentImageIndex(idx);
                          setShowGallery(true);
                        }}
                      >
                        <img
                          src={img}
                          alt={`${supplier.name} ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeMediaTab === 'floorplans' && (
                  <div className="space-y-6">
                    {floorplans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {floorplans.map(fp => (
                          <div key={fp.id} className="bg-gray-50 rounded-xl p-4">
                            <img
                              src={fp.file_url}
                              alt={fp.title}
                              className="w-full rounded-lg mb-3"
                            />
                            <h4 className="font-display text-lg text-navy">{fp.title}</h4>
                            {fp.description && (
                              <p className="font-body text-sm text-gray-600">{fp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No floor plans uploaded yet</p>
                      </div>
                    )}

                    {/* Capacity Charts */}
                    {capacityCharts.length > 0 && (
                      <div>
                        <h4 className="font-display text-lg text-navy mb-4">Capacity Charts</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {capacityCharts.map(chart => (
                            <div key={chart.id} className="bg-gray-50 rounded-xl p-4">
                              <img
                                src={chart.file_url}
                                alt={chart.title}
                                className="w-full rounded-lg mb-3"
                              />
                              <h5 className="font-body font-medium text-navy">{chart.title}</h5>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeMediaTab === 'rooms' && (
                  <div>
                    {hotelRooms.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hotelRooms.map(room => (
                          <div key={room.id} className="bg-gray-50 rounded-xl overflow-hidden">
                            <img
                              src={room.file_url}
                              alt={room.title}
                              className="w-full aspect-[4/3] object-cover"
                            />
                            <div className="p-4">
                              <h4 className="font-display text-lg text-navy">{room.title}</h4>
                              {room.description && (
                                <p className="font-body text-sm text-gray-600">{room.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No room photos uploaded yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeMediaTab === 'videos' && (
                  <div>
                    {videos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map(video => (
                          <div key={video.id} className="bg-gray-50 rounded-xl overflow-hidden">
                            <video
                              src={video.file_url}
                              controls
                              className="w-full aspect-video"
                            />
                            <div className="p-4">
                              <h4 className="font-display text-lg text-navy">{video.title}</h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No videos uploaded yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-display text-2xl text-navy font-semibold mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed font-body">
                {supplier.longDescription || supplier.description}
              </p>
            </div>

            {/* Sub-Venues */}
            {supplier.subVenues && supplier.subVenues.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-navy font-semibold mb-4">
                  Available Spaces ({supplier.subVenues.length})
                </h2>
                <div className="space-y-4">
                  {supplier.subVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className={`bg-white rounded-xl border-2 transition-colors cursor-pointer ${
                        selectedSubVenue === venue.id ? 'border-gold' : 'border-gray-100 hover:border-gold/50'
                      }`}
                      onClick={() => setSelectedSubVenue(selectedSubVenue === venue.id ? null : venue.id)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-display text-xl text-navy font-semibold">
                              {venue.name}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 font-body">{venue.description}</p>
                          </div>
                          {selectedSubVenue === venue.id && (
                            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                              <Check className="w-4 h-4 text-navy" />
                            </div>
                          )}
                        </div>

                        {/* Capacity */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-cream rounded-lg">
                            <Users className="w-5 h-5 text-gold mx-auto mb-1" />
                            <p className="text-xs text-gray-500 font-body">Seated</p>
                            <p className="font-semibold text-navy">{venue.capacity.seated}</p>
                          </div>
                          <div className="text-center p-3 bg-cream rounded-lg">
                            <Users className="w-5 h-5 text-gold mx-auto mb-1" />
                            <p className="text-xs text-gray-500 font-body">Standing</p>
                            <p className="font-semibold text-navy">{venue.capacity.standing}</p>
                          </div>
                          <div className="text-center p-3 bg-cream rounded-lg">
                            <Users className="w-5 h-5 text-gold mx-auto mb-1" />
                            <p className="text-xs text-gray-500 font-body">Ceremony</p>
                            <p className="font-semibold text-navy">{venue.capacity.ceremony}</p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap gap-2 text-sm font-body">
                          <span className="px-3 py-1 bg-navy/5 rounded-full">
                            Setup: {venue.setupTime}
                          </span>
                          {venue.marqueeAvailable && (
                            <span className="px-3 py-1 bg-gold/10 text-gold rounded-full">
                              Marquee Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            <div>
              <h2 className="font-display text-2xl text-navy font-semibold mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {supplier.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-body"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio Gallery - loaded from storage */}
            {portfolioUrls.length > 0 && (
              <PortfolioGallery 
                images={portfolioUrls} 
                providerName={supplier.name}
                columns={3}
              />
            )}


            {/* Event Types */}
            <div>
              <h2 className="font-display text-2xl text-navy font-semibold mb-4">Event Types</h2>
              <div className="flex flex-wrap gap-2">
                {supplier.eventTypes.map((type, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gold/10 text-gold rounded-full text-sm font-medium font-body"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Seasonal Notes */}
            {supplier.seasonalNotes && (
              <div className="bg-navy/5 rounded-xl p-6">
                <h3 className="font-display text-lg text-navy font-semibold mb-2">
                  Seasonal Information
                </h3>
                <p className="text-gray-600 font-body">{supplier.seasonalNotes}</p>
              </div>
            )}

            {/* Reviews Section */}
            <ReviewsSection 
              supplierId={supplier.id} 
              supplierName={supplier.name} 
            />

            {/* Quote Request Form Section */}
            <div ref={quoteFormRef} id="quote-form" className="scroll-mt-24">
              {showQuoteForm ? (
                <div className="bg-[#0B1426] rounded-2xl p-6 md:p-8">
                  <QuoteRequestForm
                    providerId={supplier.id}
                    providerName={supplier.name}
                    providerEmail={supplier.contact?.email}
                    providerServices={providerServices}
                    onSuccess={() => setShowQuoteForm(false)}
                  />
                </div>

              ) : (
                <div className="bg-gradient-to-br from-navy to-navy/90 rounded-2xl p-8 text-center">
                  <FileText className="w-12 h-12 text-gold mx-auto mb-4" />
                  <h3 className="font-display text-2xl text-white font-semibold mb-2">
                    Ready to Get Started?
                  </h3>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Send a quote request to {supplier.name} and they'll get back to you within 24-48 hours.
                  </p>
                  <button
                    onClick={handleRequestQuote}
                    className="px-8 py-4 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-light transition-colors inline-flex items-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Request a Quote
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-6">
              {/* Price */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1 font-body">Starting from</p>
                <p className="font-display text-3xl text-navy font-semibold">
                  {supplier.priceRange.split(' - ')[0]}
                </p>
                <p className="text-sm text-gray-500 font-body">{supplier.currency}</p>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gold" />
                  <span className="text-gray-600 font-body">Timezone: {supplier.timezone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <span className="text-gray-600 font-body">Currency: {supplier.currency}</span>
                </div>
                {supplier.instantBook && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gold" />
                    <span className="text-gold font-medium font-body">Instant Book Available</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleRequestQuote}
                className="w-full py-4 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors mb-3 font-body flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Request Quote
              </button>
              <button className="w-full py-4 border-2 border-navy text-navy font-semibold rounded-lg hover:bg-navy hover:text-white transition-colors font-body flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Send Message
              </button>

              {/* View Supplier Details */}
              <button
                onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                className="w-full mt-3 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-body flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                {showDetailsPanel ? 'Hide Details' : 'View Company Details'}
              </button>

              {/* Hide Pricing Toggle */}
              <button
                onClick={() => setHidePricing(!hidePricing)}
                className={`w-full mt-3 py-3 rounded-lg font-body flex items-center justify-center gap-2 transition-colors ${
                  hidePricing 
                    ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}
              >
                {hidePricing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {hidePricing ? 'Pricing Hidden' : 'Hide Pricing (Presentation Mode)'}
              </button>

              {/* Supplier Upload CTA (for suppliers) */}
              {user?.role === 'supplier' && (
                <button
                  onClick={() => setCurrentView('supplier-upload')}
                  className="w-full mt-3 py-4 border-2 border-gold text-gold font-semibold rounded-lg hover:bg-gold/10 transition-colors font-body flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Manage Media
                </button>
              )}

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 font-body">
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                    Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    Top Rated
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier Details Panel */}
            {showDetailsPanel && (
              <div className="mt-6 bg-navy rounded-2xl p-6">
                <SupplierDetailsPanel
                  supplierId={supplier.id}
                  supplierName={supplier.name}
                  hidePricing={hidePricing}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <img
            src={allImages[currentImageIndex]}
            alt={supplier.name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-body">
            {currentImageIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProfile;
