import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, Camera, CheckCircle, ChevronDown, ChevronUp, Award, ThumbsDown } from 'lucide-react';

export interface Review {
  id: string;
  supplier_id: string;
  user_id?: string;
  user_name?: string;
  reviewer_name?: string;
  user_avatar?: string;
  event_type: string;
  event_date: string;
  rating: number;
  title: string;
  content?: string;
  review_text?: string;
  photos?: string[];
  supplier_response?: string;
  supplier_response_date?: string;
  helpful_count: number;
  verified_booking?: boolean;
  created_at: string;
  would_recommend?: boolean;
  value_rating?: number;
  service_rating?: number;
  quality_rating?: number;
  communication_rating?: number;
  reviewer_email?: string;
  reviewer_phone?: string;
}

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  isSupplier?: boolean;
  onRespond?: (reviewId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onHelpful, isSupplier, onRespond }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${star <= rating ? 'text-gold fill-gold' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  // Use content or review_text, whichever is available
  const reviewContent = review.content || review.review_text || '';
  const displayName = review.user_name || review.reviewer_name || 'Anonymous';
  
  const shouldTruncate = reviewContent.length > 300;
  const displayContent = shouldTruncate && !showFullContent 
    ? reviewContent.slice(0, 300) + '...' 
    : reviewContent;

  const hasDetailedRatings = review.value_rating || review.service_rating || review.quality_rating || review.communication_rating;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {review.user_avatar ? (
            <img
              src={review.user_avatar}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center">
              <span className="font-display font-semibold text-navy text-sm">
                {getInitials(displayName)}
              </span>
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-semibold text-navy">{displayName}</h4>
              {review.verified_booking && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified Booking
                </span>
              )}
              {review.would_recommend === true && (
                <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  <ThumbsUp className="w-3 h-3" />
                  Recommends
                </span>
              )}
              {review.would_recommend === false && (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <ThumbsDown className="w-3 h-3" />
                  Does Not Recommend
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 font-body">
              {review.event_type} • {formatDate(review.event_date)}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="text-right">
          {renderStars(review.rating)}
          <p className="text-xs text-gray-400 mt-1 font-body">
            {formatDate(review.created_at)}
          </p>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-semibold text-navy mb-2">{review.title}</h3>

      {/* Content */}
      <p className="text-gray-600 font-body leading-relaxed mb-4">
        {displayContent}
      </p>
      
      {shouldTruncate && (
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="text-gold hover:text-gold-dark font-medium text-sm flex items-center gap-1 mb-4"
        >
          {showFullContent ? (
            <>Show less <ChevronUp className="w-4 h-4" /></>
          ) : (
            <>Read more <ChevronDown className="w-4 h-4" /></>
          )}
        </button>
      )}

      {/* Detailed Ratings */}
      {hasDetailedRatings && (
        <div className="mb-4">
          <button
            onClick={() => setShowDetailedRatings(!showDetailedRatings)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy transition-colors mb-2"
          >
            <Award className="w-4 h-4" />
            <span className="font-body">Detailed Ratings</span>
            {showDetailedRatings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showDetailedRatings && (
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3">
              {review.value_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-body">Value for Money</span>
                  {renderStars(review.value_rating, 'sm')}
                </div>
              )}
              {review.service_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-body">Service Quality</span>
                  {renderStars(review.service_rating, 'sm')}
                </div>
              )}
              {review.quality_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-body">Product/Venue</span>
                  {renderStars(review.quality_rating, 'sm')}
                </div>
              )}
              {review.communication_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-body">Communication</span>
                  {renderStars(review.communication_rating, 'sm')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPhotos(!showPhotos)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy transition-colors mb-3"
          >
            <Camera className="w-4 h-4" />
            <span className="font-body">{review.photos.length} Event Photos</span>
            {showPhotos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showPhotos && (
            <div className="grid grid-cols-4 gap-2">
              {review.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo}
                    alt={`Event photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Supplier Response */}
      {review.supplier_response && (
        <div className="bg-cream/50 rounded-lg p-4 mt-4 border-l-4 border-gold">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-gold" />
            <span className="font-display font-semibold text-navy text-sm">Supplier Response</span>
            {review.supplier_response_date && (
              <span className="text-xs text-gray-400 font-body">
                • {formatDate(review.supplier_response_date)}
              </span>
            )}
          </div>
          <p className="text-gray-600 font-body text-sm">{review.supplier_response}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onHelpful?.(review.id)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-body">Helpful ({review.helpful_count || 0})</span>
        </button>

        {isSupplier && !review.supplier_response && (
          <button
            onClick={() => onRespond?.(review.id)}
            className="flex items-center gap-2 text-sm text-gold hover:text-gold-dark transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-body">Respond</span>
          </button>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Event photo"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
