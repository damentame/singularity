import React, { useState, useRef } from 'react';
import { Star, Upload, X, Camera, Calendar, Loader2, Mail, Phone, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

interface ReviewFormProps {
  supplierId: string;
  supplierName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ supplierId, supplierName, onSuccess, onCancel }) => {
  const { user } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Basic review fields
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Additional rating categories
  const [valueRating, setValueRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [hoverValueRating, setHoverValueRating] = useState(0);
  const [hoverServiceRating, setHoverServiceRating] = useState(0);
  const [hoverQualityRating, setHoverQualityRating] = useState(0);
  const [hoverCommunicationRating, setHoverCommunicationRating] = useState(0);
  
  // Recommendation
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  
  // Reviewer contact info
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewerEmail, setReviewerEmail] = useState(user?.email || '');
  const [reviewerPhone, setReviewerPhone] = useState('');

  const eventTypes = ['Wedding', 'Corporate Event', 'Birthday', 'Anniversary', 'Engagement', 'Baby Shower', 'Graduation', 'Holiday Party', 'Other Celebration'];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 10) {
      toast({
        title: 'Too many photos',
        description: 'You can upload a maximum of 10 photos.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview URLs
    const newUrls = files.map(file => URL.createObjectURL(file));
    setPhotos(prev => [...prev, ...files]);
    setPhotoUrls(prev => [...prev, ...newUrls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoUrls[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user?.id || 'anonymous'}/${supplierId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('supplier-media')
        .upload(`reviews/${fileName}`, photo);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('supplier-media')
          .getPublicUrl(`reviews/${fileName}`);
        uploadedUrls.push(publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select an overall star rating.',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !content.trim() || !eventType || !eventDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!reviewerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name.',
        variant: 'destructive',
      });
      return;
    }

    if (wouldRecommend === null) {
      toast({
        title: 'Recommendation Required',
        description: 'Please indicate if you would recommend this service provider.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0) {
        uploadedPhotoUrls = await uploadPhotos();
      }

      // Insert review
      const { error } = await supabase
        .from('supplier_reviews')
        .insert({
          supplier_id: supplierId,
          user_id: user?.id || null,
          reviewer_name: reviewerName,
          user_name: reviewerName,
          user_avatar: user?.avatar,
          event_type: eventType,
          event_date: eventDate,
          rating,
          title,
          review_text: content,
          content: content,
          photos: uploadedPhotoUrls,
          verified_booking: false,
          reviewer_email: reviewerEmail,
          reviewer_phone: reviewerPhone,
          would_recommend: wouldRecommend,
          value_rating: valueRating || null,
          service_rating: serviceRating || null,
          quality_rating: qualityRating || null,
          communication_rating: communicationRating || null,
          helpful_count: 0,
        });


      if (error) throw error;

      toast({
        title: 'Review Submitted',
        description: 'Thank you for sharing your experience!',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || '';
  };

  const renderStarRating = (
    currentRating: number,
    hoverRating: number,
    setRating: (rating: number) => void,
    setHoverRating: (rating: number) => void,
    size: 'sm' | 'lg' = 'lg'
  ) => {
    const starSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} transition-colors ${
                star <= (hoverRating || currentRating)
                  ? 'text-gold fill-gold'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h3 className="font-display text-2xl font-semibold text-navy mb-2">
        Write a Review
      </h3>
      <p className="text-gray-500 font-body mb-6">
        Share your experience with {supplierName}
      </p>

      {/* Reviewer Information */}
      <div className="bg-cream/30 rounded-xl p-5 mb-6">
        <h4 className="font-display text-lg font-semibold text-navy mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gold" />
          Your Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-body font-medium text-navy mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
              required
            />
          </div>
          <div>
            <label className="block font-body font-medium text-navy mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block font-body font-medium text-navy mb-2">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={reviewerPhone}
                onChange={(e) => setReviewerPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
              />
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Overall Star Rating */}
      <div className="mb-6">
        <label className="block font-body font-medium text-navy mb-3">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-4">
          {renderStarRating(rating, hoverRating, setRating, setHoverRating, 'lg')}
          {(hoverRating || rating) > 0 && (
            <span className="text-gold font-medium font-body">
              {getRatingLabel(hoverRating || rating)}
            </span>
          )}
        </div>
      </div>

      {/* Category Ratings */}
      <div className="bg-gray-50 rounded-xl p-5 mb-6">
        <h4 className="font-display text-lg font-semibold text-navy mb-4">
          Rate Specific Areas (Optional)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="font-body text-gray-700">Value for Money</span>
            {renderStarRating(valueRating, hoverValueRating, setValueRating, setHoverValueRating, 'sm')}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-gray-700">Service Quality</span>
            {renderStarRating(serviceRating, hoverServiceRating, setServiceRating, setHoverServiceRating, 'sm')}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-gray-700">Product/Venue Quality</span>
            {renderStarRating(qualityRating, hoverQualityRating, setQualityRating, setHoverQualityRating, 'sm')}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-gray-700">Communication</span>
            {renderStarRating(communicationRating, hoverCommunicationRating, setCommunicationRating, setHoverCommunicationRating, 'sm')}
          </div>
        </div>
      </div>

      {/* Would Recommend */}
      <div className="mb-6">
        <label className="block font-body font-medium text-navy mb-3">
          Would you recommend {supplierName}? <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
              wouldRecommend === true
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-green-300 text-gray-600'
            }`}
          >
            <ThumbsUp className={`w-6 h-6 ${wouldRecommend === true ? 'fill-green-500' : ''}`} />
            <span className="font-semibold">Yes, I would recommend</span>
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`flex-1 py-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
              wouldRecommend === false
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-red-300 text-gray-600'
            }`}
          >
            <ThumbsDown className={`w-6 h-6 ${wouldRecommend === false ? 'fill-red-500' : ''}`} />
            <span className="font-semibold">No, I would not</span>
          </button>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block font-body font-medium text-navy mb-2">
            Event Type <span className="text-red-500">*</span>
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
            required
          >
            <option value="">Select event type</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block font-body font-medium text-navy mb-2">
            Event Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
              required
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Review Title */}
      <div className="mb-6">
        <label className="block font-body font-medium text-navy mb-2">
          Review Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience in a few words"
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body"
          required
        />
        <p className="text-xs text-gray-400 mt-1 font-body">{title.length}/100 characters</p>
      </div>

      {/* Review Content */}
      <div className="mb-6">
        <label className="block font-body font-medium text-navy mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell others about your experience. What went well? What could be improved? Would you use this service provider again?"
          rows={5}
          minLength={50}
          maxLength={2000}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent font-body resize-none"
          required
        />
        <p className="text-xs text-gray-400 mt-1 font-body">
          {content.length}/2000 characters (minimum 50)
        </p>
      </div>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="block font-body font-medium text-navy mb-2">
          Event Photos (Optional)
        </label>
        <p className="text-sm text-gray-500 font-body mb-3">
          Share photos from your event to help others visualize their experience
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Photo Grid */}
        <div className="grid grid-cols-5 gap-3">
          {photoUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {photos.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gold hover:bg-gold/5 transition-colors"
            >
              <Camera className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400 font-body">Add Photo</span>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 font-body">
          {photos.length}/10 photos uploaded
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Review'
          )}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors font-body"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
