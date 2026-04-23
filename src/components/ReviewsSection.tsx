import React, { useState, useEffect } from 'react';
import { Star, Filter, ChevronDown, PenLine, Loader2, MessageSquare, TrendingUp, ThumbsUp, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import ReviewCard, { Review } from './ReviewCard';
import ReviewForm from './ReviewForm';
import { toast } from '@/components/ui/use-toast';

interface ReviewsSectionProps {
  supplierId: string;
  supplierName: string;
}

interface RatingBreakdown {
  rating: number;
  count: number;
  percentage: number;
}

interface RatingStats {
  averageRating: string;
  totalReviews: number;
  averageValueRating: string;
  averageServiceRating: string;
  averageQualityRating: string;
  averageCommunicationRating: string;
  recommendPercentage: number;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ supplierId, supplierName }) => {
  const { user } = useAppContext();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest' | 'lowest'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Calculate aggregate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  
  // Calculate detailed rating averages
  const calculateAverage = (field: keyof Review): string => {
    const validReviews = reviews.filter(r => r[field] !== null && r[field] !== undefined);
    if (validReviews.length === 0) return '0.0';
    const sum = validReviews.reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
    return (sum / validReviews.length).toFixed(1);
  };

  const ratingStats: RatingStats = {
    averageRating,
    totalReviews,
    averageValueRating: calculateAverage('value_rating'),
    averageServiceRating: calculateAverage('service_rating'),
    averageQualityRating: calculateAverage('quality_rating'),
    averageCommunicationRating: calculateAverage('communication_rating'),
    recommendPercentage: totalReviews > 0 
      ? Math.round((reviews.filter(r => r.would_recommend === true).length / totalReviews) * 100)
      : 0
  };
  
  const ratingBreakdown: RatingBreakdown[] = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => r.rating === rating).length;
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    };
  });

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('supplier_reviews')
        .select('*')
        .eq('supplier_id', supplierId);

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'helpful':
          query = query.order('helpful_count', { ascending: false });
          break;
        case 'highest':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest':
          query = query.order('rating', { ascending: true });
          break;
      }

      // Apply rating filter
      if (filterRating !== null) {
        query = query.eq('rating', filterRating);
      }

      const { data, error } = await query;

      if (error) {
        // Handle case where table doesn't exist - just use empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Reviews table does not exist yet, using empty array');
          setReviews([]);
          return;
        }
        throw error;
      }
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Gracefully handle by setting empty reviews
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReviews();
  }, [supplierId, sortBy, filterRating]);

  const handleHelpful = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      await supabase
        .from('supplier_reviews')
        .update({ helpful_count: review.helpful_count + 1 })
        .eq('id', reviewId);

      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ));

      toast({
        title: 'Thanks for your feedback!',
        description: 'You marked this review as helpful.',
      });
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  const handleRespond = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setResponseText('');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedReviewId || !responseText.trim()) return;

    setSubmittingResponse(true);
    try {
      const { error } = await supabase
        .from('supplier_reviews')
        .update({
          supplier_response: responseText,
          supplier_response_date: new Date().toISOString()
        })
        .eq('id', selectedReviewId);

      if (error) throw error;

      setReviews(prev => prev.map(r => 
        r.id === selectedReviewId 
          ? { ...r, supplier_response: responseText, supplier_response_date: new Date().toISOString() } 
          : r
      ));

      toast({
        title: 'Response Submitted',
        description: 'Your response has been added to the review.',
      });

      setShowResponseModal(false);
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    loadReviews();
  };

  const isSupplier = user?.role === 'supplier';

  return (
    <div className="bg-cream/30 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-navy mb-2">
            Reviews & Ratings
          </h2>
          <p className="text-gray-500 font-body">
            See what others are saying about {supplierName}
          </p>
        </div>

        {user && user.role === 'host' && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors font-body"
          >
            <PenLine className="w-5 h-5" />
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-8">
          <ReviewForm
            supplierId={supplierId}
            supplierName={supplierName}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Rating Summary */}
      <div className="bg-white rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Overall Rating */}
          <div className="text-center lg:text-left lg:border-r lg:border-gray-100 lg:pr-8">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <span className="font-display text-5xl font-bold text-navy">{averageRating}</span>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(parseFloat(averageRating))
                          ? 'text-gold fill-gold'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 font-body">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Recommendation Rate */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-2 justify-center lg:justify-start mt-4 p-3 bg-green-50 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold font-body">
                  {ratingStats.recommendPercentage}% would recommend
                </span>
              </div>
            )}
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            <h4 className="font-display font-semibold text-navy mb-3">Rating Breakdown</h4>
            {ratingBreakdown.map(({ rating, count, percentage }) => (
              <button
                key={rating}
                onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  filterRating === rating ? 'bg-gold/10' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1 w-16">
                  <span className="font-body text-sm text-navy">{rating}</span>
                  <Star className="w-4 h-4 text-gold fill-gold" />
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="font-body text-sm text-gray-500 w-12 text-right">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Category Averages */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              Category Ratings
            </h4>
            {parseFloat(ratingStats.averageValueRating) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-body">Value for Money</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(parseFloat(ratingStats.averageValueRating))
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-navy">{ratingStats.averageValueRating}</span>
                </div>
              </div>
            )}
            {parseFloat(ratingStats.averageServiceRating) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-body">Service Quality</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(parseFloat(ratingStats.averageServiceRating))
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-navy">{ratingStats.averageServiceRating}</span>
                </div>
              </div>
            )}
            {parseFloat(ratingStats.averageQualityRating) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-body">Product/Venue</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(parseFloat(ratingStats.averageQualityRating))
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-navy">{ratingStats.averageQualityRating}</span>
                </div>
              </div>
            )}
            {parseFloat(ratingStats.averageCommunicationRating) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-body">Communication</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(parseFloat(ratingStats.averageCommunicationRating))
                            ? 'text-gold fill-gold'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-navy">{ratingStats.averageCommunicationRating}</span>
                </div>
              </div>
            )}
            {parseFloat(ratingStats.averageValueRating) === 0 && 
             parseFloat(ratingStats.averageServiceRating) === 0 && 
             parseFloat(ratingStats.averageQualityRating) === 0 && 
             parseFloat(ratingStats.averageCommunicationRating) === 0 && (
              <p className="text-sm text-gray-400 font-body italic">
                No detailed ratings yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-body">Sort by:</span>
        </div>
        
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg bg-white text-sm font-body focus:ring-2 focus:ring-gold focus:border-transparent cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {filterRating !== null && (
          <button
            onClick={() => setFilterRating(null)}
            className="px-3 py-1.5 bg-gold/10 text-gold text-sm font-medium rounded-full flex items-center gap-1 hover:bg-gold/20 transition-colors"
          >
            {filterRating} Star{filterRating !== 1 ? 's' : ''}
            <span className="ml-1">×</span>
          </button>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-xl text-navy mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 font-body mb-6">
            {filterRating !== null 
              ? `No ${filterRating}-star reviews found.`
              : 'Be the first to share your experience!'}
          </p>
          {user && user.role === 'host' && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors font-body"
            >
              Write the First Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              isSupplier={isSupplier}
              onRespond={handleRespond}
            />
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-gold" />
              <h3 className="font-display text-xl font-semibold text-navy">
                Respond to Review
              </h3>
            </div>
            
            <p className="text-gray-500 font-body mb-4">
              Your response will be visible to all users viewing this review.
            </p>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank you for your feedback..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body resize-none mb-4"
            />
            <p className="text-xs text-gray-400 font-body mb-4">
              {responseText.length}/1000 characters
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={submitResponse}
                disabled={submittingResponse || !responseText.trim()}
                className="flex-1 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body flex items-center justify-center gap-2"
              >
                {submittingResponse ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </button>
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-body"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
