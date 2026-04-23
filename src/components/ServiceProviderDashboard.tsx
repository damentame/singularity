import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { 
  User, Building2, Calendar, Image, BarChart3, MessageSquare, 
  Clock, CheckCircle, XCircle, Eye, TrendingUp, DollarSign,
  Plus, Trash2, Star, Edit, Upload, ChevronLeft, ChevronRight,
  MapPin, Mail, Phone, Globe, Instagram, Facebook, ThumbsUp, Award,
  Loader2, ImageIcon, Maximize2, X, Crown
} from 'lucide-react';
import { Review } from './ReviewCard';
import {
  uploadPortfolioImages,
  appendPortfolioUrls,
  removePortfolioUrl,
  loadPortfolioUrls,
  setCoverImage,
  loadCoverImage,
  type UploadProgress,
} from '@/lib/portfolioUpload';
import PortfolioGallery from './PortfolioGallery';


interface ServiceProvider {
  id: string;
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
  created_at: string;
}

interface QuoteRequest {
  id: string;
  host_id: string;
  host_name: string;
  host_email: string;
  host_phone: string;
  event_type: string;
  event_name: string;
  event_date: string;
  event_location: string;
  venue_name: string;
  guest_count: number;
  budget_range: string;
  message: string;
  services_requested: string[];
  special_requirements: string;
  flexible_dates: boolean;
  preferred_contact_method: string;
  status: string;
  created_at: string;
  responded_at: string;
  quoted_amount: number;
  provider_notes: string;
}

interface Booking {
  id: string;
  host_name: string;
  event_name: string;
  event_type: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_location: string;
  venue_name: string;
  guest_count: number;
  total_amount: number;
  deposit_paid: boolean;
  status: string;
}

interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string;
  title: string;
  description: string;
  category: string;
  is_featured: boolean;
  display_order: number;
}

interface Analytics {
  total_profile_views: number;
  monthly_profile_views: number;
  weekly_profile_views: number;
  total_inquiries: number;
  monthly_inquiries: number;
  total_bookings: number;
  total_contact_clicks: number;
}

const ServiceProviderDashboard: React.FC = () => {
  const { user, setCurrentView } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'calendar' | 'portfolio' | 'reviews' | 'analytics'>('overview');
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    title: '',
    description: '',
    category: '',
    is_featured: false
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  // Storage-backed portfolio (service_providers.portfolio_urls)
  // Storage-backed portfolio (service_providers.portfolio_urls)
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {

    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load service provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (providerError) throw providerError;
      setProvider(providerData);

      if (providerData?.id) {
        // Load quote requests
        const { data: quotesData } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('service_provider_id', providerData.id)
          .order('created_at', { ascending: false });
        setQuoteRequests(quotesData || []);

        // Load bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*')
          .eq('service_provider_id', providerData.id)
          .order('event_date', { ascending: true });
        setBookings(bookingsData || []);

        // Load portfolio items
        const { data: portfolioData } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('service_provider_id', providerData.id)
          .order('display_order', { ascending: true });
        setPortfolioItems(portfolioData || []);

        // Load analytics summary
        const { data: analyticsData } = await supabase
          .from('provider_analytics_summary')
          .select('*')
          .eq('service_provider_id', providerData.id)
          .single();
        setAnalytics(analyticsData || {
          total_profile_views: 0,
          monthly_profile_views: 0,
          weekly_profile_views: 0,
          total_inquiries: 0,
          monthly_inquiries: 0,
          total_bookings: 0,
          total_contact_clicks: 0
        });
      }

      // Load storage-backed portfolio URLs and cover image from service_providers
      if (user?.id) {
        const urls = await loadPortfolioUrls(user.id);
        setPortfolioUrls(urls);
        const cover = await loadCoverImage(user.id);
        setCoverImageUrl(cover);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default analytics if view doesn't exist yet
      setAnalytics({
        total_profile_views: 0,
        monthly_profile_views: 0,
        weekly_profile_views: 0,
        total_inquiries: 0,
        monthly_inquiries: 0,
        total_bookings: 0,
        total_contact_clicks: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Portfolio Image Upload to Supabase Storage =====
  const handlePortfolioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePortfolioFiles(Array.from(e.target.files));
      e.target.value = ''; // reset so same file can be re-selected
    }
  };

  const handlePortfolioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePortfolioFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handlePortfolioDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handlePortfolioFiles = async (files: File[]) => {
    if (!user?.id) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to upload images.',
        variant: 'destructive',
      });
      return;
    }

    // Validate files
    const validFiles = files.filter(f => {
      if (!f.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${f.name} is not an image and was skipped.`,
          variant: 'destructive',
        });
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${f.name} exceeds the 10MB limit.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Check max portfolio size (20)
    const remaining = 20 - portfolioUrls.length;
    if (remaining <= 0) {
      toast({
        title: 'Portfolio full',
        description: 'You have reached the maximum of 20 portfolio images.',
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = validFiles.slice(0, remaining);
    if (filesToUpload.length < validFiles.length) {
      toast({
        title: 'Some files skipped',
        description: `Only ${filesToUpload.length} files uploaded — limit is 20 total.`,
      });
    }

    setIsUploadingPortfolio(true);
    setUploadProgress(null);

    try {
      const results = await uploadPortfolioImages(
        filesToUpload,
        user.id,
        (progress) => setUploadProgress(progress)
      );

      const successUrls = results.filter(r => !r.error && r.url).map(r => r.url);
      const failedCount = results.length - successUrls.length;

      if (successUrls.length > 0) {
        const { success, allUrls, error } = await appendPortfolioUrls(user.id, successUrls);
        if (success) {
          setPortfolioUrls(allUrls);
          toast({
            title: 'Upload complete',
            description: `${successUrls.length} image${successUrls.length !== 1 ? 's' : ''} added to your portfolio.`,
          });
        } else {
          toast({
            title: 'Save failed',
            description: error || 'Could not save uploaded images to your profile.',
            variant: 'destructive',
          });
        }
      }

      if (failedCount > 0) {
        toast({
          title: `${failedCount} upload${failedCount !== 1 ? 's' : ''} failed`,
          description: 'Some images could not be uploaded. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Portfolio upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPortfolio(false);
      setUploadProgress(null);
    }
  };

  const handleRemovePortfolioImage = async (url: string) => {
    if (!user?.id) return;
    if (!confirm('Remove this image from your portfolio? This cannot be undone.')) return;

    try {
      const { success, remainingUrls, error } = await removePortfolioUrl(user.id, url);
      if (success) {
        setPortfolioUrls(remainingUrls);
        // If the removed image was the cover, clear the cover
        if (coverImageUrl === url) {
          await setCoverImage(user.id, null);
          setCoverImageUrl(null);
        }
        toast({
          title: 'Image removed',
          description: 'The image has been removed from your portfolio.',
        });
      } else {
        toast({
          title: 'Remove failed',
          description: error || 'Could not remove the image.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Remove failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleSetCover = async (url: string) => {
    if (!user?.id) return;
    // Toggle: if already cover, clear it; otherwise set it
    const newCover = coverImageUrl === url ? null : url;
    setSettingCover(url);
    try {
      const { success, error } = await setCoverImage(user.id, newCover);
      if (success) {
        setCoverImageUrl(newCover);
        toast({
          title: newCover ? 'Cover image set' : 'Cover image cleared',
          description: newCover
            ? 'This image will now appear as your profile banner.'
            : 'Your profile banner has been reset to the default.',
        });
      } else {
        toast({
          title: 'Update failed',
          description: error || 'Could not update cover image.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSettingCover(null);
    }
  };




  const calculateProfileCompletion = (): number => {
    if (!provider) return 0;
    
    const fields = [
      provider.business_name,
      provider.business_description,
      provider.country,
      provider.city,
      provider.service_radius,
      provider.selected_event_types?.length > 0,
      Object.keys(provider.selected_categories || {}).length > 0,
      provider.insurance_types?.length > 0,
      provider.public_liability_amount,
      provider.website || provider.instagram || provider.facebook,
      portfolioItems.length > 0,
      portfolioItems.length >= 5,
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleRespondToQuote = async (status: 'quoted' | 'declined') => {
    if (!selectedQuote || !provider) return;

    try {
      const updateData: any = {
        status,
        responded_at: new Date().toISOString()
      };

      if (status === 'quoted') {
        updateData.quoted_amount = parseFloat(quoteAmount);
        updateData.quote_message = quoteMessage;
        updateData.quote_valid_until = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('quote_requests')
        .update(updateData)
        .eq('id', selectedQuote.id);

      if (error) throw error;

      toast({
        title: status === 'quoted' ? 'Quote Sent' : 'Request Declined',
        description: status === 'quoted' 
          ? `Your quote of $${quoteAmount} has been sent to ${selectedQuote.host_name}.`
          : 'The quote request has been declined.',
      });

      setShowQuoteModal(false);
      setSelectedQuote(null);
      setQuoteAmount('');
      setQuoteMessage('');
      loadDashboardData();
    } catch (error) {
      console.error('Error responding to quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to quote request.',
        variant: 'destructive',
      });
    }
  };

  const handleAddPortfolioItem = async () => {
    if (!provider || !newPortfolioItem.url) return;

    try {
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          service_provider_id: provider.id,
          ...newPortfolioItem,
          display_order: portfolioItems.length
        });

      if (error) throw error;

      toast({
        title: 'Portfolio Updated',
        description: 'New item added to your portfolio.',
      });

      setShowPortfolioModal(false);
      setNewPortfolioItem({
        type: 'image',
        url: '',
        title: '',
        description: '',
        category: '',
        is_featured: false
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add portfolio item.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Item Deleted',
        description: 'Portfolio item has been removed.',
      });

      loadDashboardData();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete portfolio item.',
        variant: 'destructive',
      });
    }
  };

  const toggleFeatured = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .update({ is_featured: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      loadDashboardData();
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getBookingsForDate = (day: number) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => b.event_date === dateStr);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'viewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'quoted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B1426' }}>
        <div className="text-center">
          <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto mb-4 animate-spin">
            <defs>
              <linearGradient id="loadingGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B8956A" />
                <stop offset="50%" stopColor="#8B6914" />
                <stop offset="100%" stopColor="#6B5210" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#loadingGold)" strokeWidth="2" strokeDasharray="100" />
          </svg>
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B1426' }}>
        <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-[#B8956A]" />
            <h2 className="text-xl font-semibold text-white mb-2">No Provider Profile Found</h2>
            <p className="text-white/60 mb-6">You haven't completed your service provider registration yet.</p>
            <Button 
              onClick={() => setCurrentView('service-provider-registration')}
              className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
            >
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();
  const pendingQuotes = quoteRequests.filter(q => q.status === 'pending').length;
  const upcomingBookings = bookings.filter(b => new Date(b.event_date) >= new Date()).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'quotes', label: 'Quote Requests', icon: MessageSquare, badge: pendingQuotes },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: upcomingBookings },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{provider.business_name}</h1>
              {provider.trading_name && provider.trading_name !== provider.business_name && (
                <p className="text-white/60 mt-1">Trading as: {provider.trading_name}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {provider.is_verified && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              {provider.is_featured && (
                <Badge className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30">
                  <Star className="w-3 h-3 mr-1" /> Featured
                </Badge>
              )}
              <Badge className={getStatusColor(provider.status)}>
                {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-[#B8956A]/30 text-[#B8956A]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Completion */}
            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-[#B8956A]" />
                  Profile Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/70">Profile Strength</span>
                    <span className="text-[#B8956A] font-semibold">{profileCompletion}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#B8956A] to-[#8B6914] rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
                {profileCompletion < 100 && (
                  <div className="text-sm text-white/60">
                    <p className="mb-2">Complete your profile to increase visibility:</p>
                    <ul className="space-y-1">
                      {!provider.business_description && <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Add business description</li>}
                      {portfolioItems.length === 0 && <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Upload portfolio images</li>}
                      {portfolioItems.length < 5 && portfolioItems.length > 0 && <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-amber-400" /> Add more portfolio items (5+ recommended)</li>}
                      {!provider.website && !provider.instagram && <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Add social media links</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Profile Views</p>
                      <p className="text-2xl font-bold text-white mt-1">{analytics?.monthly_profile_views || 0}</p>
                      <p className="text-xs text-white/40 mt-1">This month</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#B8956A]/20 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-[#B8956A]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Quote Requests</p>
                      <p className="text-2xl font-bold text-white mt-1">{pendingQuotes}</p>
                      <p className="text-xs text-white/40 mt-1">Pending response</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Upcoming Events</p>
                      <p className="text-2xl font-bold text-white mt-1">{upcomingBookings}</p>
                      <p className="text-xs text-white/40 mt-1">Confirmed bookings</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Total Bookings</p>
                      <p className="text-2xl font-bold text-white mt-1">{analytics?.total_bookings || 0}</p>
                      <p className="text-xs text-white/40 mt-1">All time</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#B8956A]" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#B8956A] mt-0.5" />
                    <div>
                      <p className="text-white">{provider.city}, {provider.state}</p>
                      <p className="text-white/60 text-sm">{provider.country} • {provider.service_radius}km service radius</p>
                    </div>
                  </div>
                  {provider.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#B8956A]" />
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-[#B8956A] hover:underline">
                        {provider.website}
                      </a>
                    </div>
                  )}
                  {provider.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-[#B8956A]" />
                      <span className="text-white/70">@{provider.instagram.replace('@', '')}</span>
                    </div>
                  )}
                  {provider.facebook && (
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-[#B8956A]" />
                      <span className="text-white/70">{provider.facebook}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#B8956A]" />
                    Services Offered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {provider.selected_event_types?.map(eventType => (
                      <div key={eventType}>
                        <p className="text-white font-medium mb-2">{eventType}</p>
                        <div className="flex flex-wrap gap-2">
                          {provider.selected_categories?.[eventType]?.map(category => (
                            <Badge key={category} className="bg-white/10 text-white/80 border-white/20">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#B8956A]" />
                  Recent Quote Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quoteRequests.length === 0 ? (
                  <p className="text-white/60 text-center py-8">No quote requests yet. Complete your profile to start receiving inquiries!</p>
                ) : (
                  <div className="space-y-3">
                    {quoteRequests.slice(0, 5).map(quote => (
                      <div key={quote.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{quote.host_name}</p>
                          <p className="text-white/60 text-sm">{quote.event_type} • {formatDate(quote.event_date)}</p>
                        </div>
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Quote Requests</h2>
              <div className="flex gap-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {pendingQuotes} Pending
                </Badge>
              </div>
            </div>

            {quoteRequests.length === 0 ? (
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#B8956A]/50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Quote Requests Yet</h3>
                  <p className="text-white/60">When hosts request quotes from you, they'll appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map(quote => (
                  <Card key={quote.id} className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-white">{quote.host_name}</h3>
                            <Badge className={getStatusColor(quote.status)}>
                              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </Badge>
                            {quote.flexible_dates && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                Flexible Dates
                              </Badge>
                            )}
                          </div>
                          
                          {/* Event Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-white/50 text-xs uppercase">Event Type</p>
                              <p className="text-white capitalize">{quote.event_type}</p>
                            </div>
                            <div>
                              <p className="text-white/50 text-xs uppercase">Event Date</p>
                              <p className="text-white">{quote.event_date ? formatDate(quote.event_date) : 'TBD'}</p>
                            </div>
                            <div>
                              <p className="text-white/50 text-xs uppercase">Guest Count</p>
                              <p className="text-white">{quote.guest_count || 'TBD'}</p>
                            </div>
                            <div>
                              <p className="text-white/50 text-xs uppercase">Budget</p>
                              <p className="text-white">{quote.budget_range || 'Not specified'}</p>
                            </div>
                          </div>

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {quote.event_name && (
                              <div>
                                <p className="text-white/50 text-xs uppercase">Event Name</p>
                                <p className="text-white">{quote.event_name}</p>
                              </div>
                            )}
                            {quote.event_location && (
                              <div>
                                <p className="text-white/50 text-xs uppercase">Location</p>
                                <p className="text-white">{quote.event_location}</p>
                              </div>
                            )}
                            {quote.venue_name && (
                              <div>
                                <p className="text-white/50 text-xs uppercase">Venue</p>
                                <p className="text-white">{quote.venue_name}</p>
                              </div>
                            )}
                          </div>

                          {/* Services Requested */}
                          {quote.services_requested && quote.services_requested.length > 0 && (
                            <div className="mb-4">
                              <p className="text-white/50 text-xs uppercase mb-2">Services Requested</p>
                              <div className="flex flex-wrap gap-2">
                                {quote.services_requested.map((service, idx) => (
                                  <Badge key={idx} className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Message */}
                          {quote.message && (
                            <div className="bg-white/5 rounded-lg p-4 mb-4">
                              <p className="text-white/50 text-xs uppercase mb-2">Message</p>
                              <p className="text-white/80">{quote.message}</p>
                            </div>
                          )}

                          {/* Special Requirements */}
                          {quote.special_requirements && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                              <p className="text-amber-400 text-xs uppercase mb-2">Special Requirements</p>
                              <p className="text-white/80">{quote.special_requirements}</p>
                            </div>
                          )}

                          {/* Contact Information */}
                          <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <a href={`mailto:${quote.host_email}`} className="text-[#B8956A] hover:underline">
                                {quote.host_email}
                              </a>
                            </div>
                            {quote.host_phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${quote.host_phone}`} className="text-[#B8956A] hover:underline">
                                  {quote.host_phone}
                                </a>
                              </div>
                            )}
                            {quote.preferred_contact_method && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/40">Prefers:</span>
                                <span className="capitalize">{quote.preferred_contact_method}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 ml-auto">
                              <Clock className="w-4 h-4" />
                              Received {formatDate(quote.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        {quote.status === 'pending' && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              onClick={() => {
                                setSelectedQuote(quote);
                                setShowQuoteModal(true);
                              }}
                              className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
                            >
                              Send Quote
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedQuote(quote);
                                handleRespondToQuote('declined');
                              }}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        
                        {/* Show quoted amount if already quoted */}
                        {quote.status === 'quoted' && quote.quoted_amount && (
                          <div className="ml-4 text-right">
                            <p className="text-white/50 text-xs uppercase">Quoted</p>
                            <p className="text-2xl font-bold text-[#B8956A]">${quote.quoted_amount.toLocaleString()}</p>
                            {quote.responded_at && (
                              <p className="text-white/40 text-xs mt-1">
                                Sent {formatDate(quote.responded_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#B8956A]" />
                    Booking Calendar
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-white font-medium min-w-[140px] text-center">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-white/50 text-sm py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, index) => {
                    const dayBookings = day ? getBookingsForDate(day) : [];
                    const isToday = day && 
                      new Date().getDate() === day && 
                      new Date().getMonth() === currentMonth.getMonth() &&
                      new Date().getFullYear() === currentMonth.getFullYear();
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-2 rounded-lg ${
                          day 
                            ? isToday 
                              ? 'bg-[#B8956A]/20 border border-[#B8956A]/50' 
                              : 'bg-white/5 hover:bg-white/10'
                            : ''
                        }`}
                      >
                        {day && (
                          <>
                            <span className={`text-sm ${isToday ? 'text-[#B8956A] font-bold' : 'text-white/70'}`}>
                              {day}
                            </span>
                            {dayBookings.map(booking => (
                              <div
                                key={booking.id}
                                className="mt-1 p-1 bg-emerald-500/20 rounded text-xs text-emerald-400 truncate"
                                title={`${booking.event_name} - ${booking.host_name}`}
                              >
                                {booking.event_name}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <CardTitle className="text-white">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.filter(b => new Date(b.event_date) >= new Date()).length === 0 ? (
                  <p className="text-white/60 text-center py-8">No upcoming events scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings
                      .filter(b => new Date(b.event_date) >= new Date())
                      .slice(0, 10)
                      .map(booking => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-[#B8956A]/20 flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-[#B8956A]" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{booking.event_name}</p>
                              <p className="text-white/60 text-sm">
                                {formatDate(booking.event_date)} • {booking.host_name}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}



        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Portfolio Management</h2>
                <p className="text-sm text-white/50 mt-1">
                  Upload images to your gallery (max 20). They appear on your public profile.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => portfolioFileInputRef.current?.click()}
                  disabled={isUploadingPortfolio || portfolioUrls.length >= 20}
                  className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
                >
                  {isUploadingPortfolio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPortfolioModal(true)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add by URL
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={portfolioFileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePortfolioFileSelect}
              className="hidden"
            />

            {/* Drag & drop upload area */}
            <Card
              className={`bg-[#0B1426]/80 border-2 border-dashed transition-all cursor-pointer ${
                dragActive
                  ? 'border-[#B8956A] bg-[#B8956A]/10'
                  : 'border-[#B8956A]/30 hover:border-[#B8956A]/60'
              } ${isUploadingPortfolio ? 'pointer-events-none opacity-70' : ''}`}
              onDragEnter={handlePortfolioDrag}
              onDragLeave={handlePortfolioDrag}
              onDragOver={handlePortfolioDrag}
              onDrop={handlePortfolioDrop}
              onClick={() => !isUploadingPortfolio && portfolioFileInputRef.current?.click()}
            >
              <CardContent className="p-8 text-center">
                {isUploadingPortfolio ? (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto mb-3 text-[#B8956A] animate-spin" />
                    <p className="text-white font-medium">
                      {uploadProgress
                        ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                        : 'Preparing upload...'}
                    </p>
                    {uploadProgress && (
                      <>
                        <p className="text-white/50 text-sm mt-1 truncate max-w-md mx-auto">
                          {uploadProgress.fileName}
                        </p>
                        <div className="mt-3 max-w-sm mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#B8956A] to-[#8B6914] transition-all"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-3 text-[#B8956A]" />
                    <p className="text-white font-medium">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-white/50 text-sm mt-1">
                      JPG, PNG, WebP • Max 10MB each • {portfolioUrls.length} / 20 uploaded
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Storage-backed Portfolio Gallery */}
            {portfolioUrls.length > 0 && (
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#B8956A]" />
                        Uploaded Portfolio Images
                      </CardTitle>
                      <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-[#B8956A]" />
                        Click the crown icon on any image to set it as your profile cover/banner.
                      </p>
                    </div>
                    <Badge className="bg-[#B8956A]/20 text-[#B8956A] border-[#B8956A]/30">
                      {portfolioUrls.length} / 20
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {portfolioUrls.map((url, idx) => {
                      const isCover = coverImageUrl === url;
                      const isSettingThis = settingCover === url;
                      return (
                        <div
                          key={`${url}-${idx}`}
                          className={`relative group aspect-square rounded-xl overflow-hidden bg-white/5 border-2 transition-all ${
                            isCover
                              ? 'border-[#B8956A] ring-2 ring-[#B8956A]/40 shadow-lg shadow-[#B8956A]/20'
                              : 'border-white/10'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Portfolio ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Cover badge (always visible when set) */}
                          {isCover && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white border-0 shadow-lg flex items-center gap-1 px-2 py-1">
                                <Crown className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-semibold uppercase tracking-wide">Cover</span>
                              </Badge>
                            </div>
                          )}

                          {/* Hover overlay with actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCover(url);
                              }}
                              disabled={isSettingThis}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                                isCover
                                  ? 'bg-gradient-to-r from-[#B8956A] to-[#8B6914] hover:from-[#c9a479] hover:to-[#9c7618]'
                                  : 'bg-white/20 hover:bg-[#B8956A]/80'
                              }`}
                              title={isCover ? 'Remove as cover image' : 'Set as cover image'}
                            >
                              {isSettingThis ? (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                              ) : (
                                <Crown className={`w-4 h-4 text-white ${isCover ? 'fill-current' : ''}`} />
                              )}
                            </button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                              title="View full size"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Maximize2 className="w-4 h-4 text-white" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePortfolioImage(url);
                              }}
                              className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {coverImageUrl && (
                    <div className="mt-4 p-3 rounded-lg bg-[#B8956A]/10 border border-[#B8956A]/30 flex items-center gap-3">
                      <Crown className="w-5 h-5 text-[#B8956A] flex-shrink-0" />
                      <p className="text-sm text-white/80 flex-1">
                        Cover image is set. It will appear as the hero banner on your public profile page.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCover(coverImageUrl)}
                        disabled={!!settingCover}
                        className="border-[#B8956A]/40 text-[#B8956A] hover:bg-[#B8956A]/20"
                      >
                        Clear Cover
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


            {/* Existing portfolio_items (URL-based legacy) heading */}
            {(portfolioItems.length > 0 || portfolioUrls.length === 0) && (
              <div className="flex items-center justify-between pt-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-[#B8956A]" />
                  Portfolio Items by URL
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPortfolioModal(true)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>
            )}


            {portfolioItems.length === 0 ? (
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-12 text-center">
                  <Image className="w-16 h-16 mx-auto mb-4 text-[#B8956A]/50" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Portfolio Items Yet</h3>
                  <p className="text-white/60 mb-6">Showcase your work by adding images and videos to your portfolio.</p>
                  <Button
                    onClick={() => setShowPortfolioModal(true)}
                    className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {portfolioItems.map(item => (
                  <Card key={item.id} className="bg-[#0B1426]/80 border border-[#B8956A]/20 overflow-hidden group">
                    <div className="relative aspect-square">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url || item.thumbnail_url} 
                          alt={item.title || 'Portfolio item'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <p className="text-white/60 text-sm">Video</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFeatured(item.id, item.is_featured)}
                          className={`${item.is_featured ? 'text-[#B8956A]' : 'text-white/70'} hover:text-[#B8956A]`}
                        >
                          <Star className={`w-5 h-5 ${item.is_featured ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeletePortfolioItem(item.id)}
                          className="text-white/70 hover:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      {item.is_featured && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-[#B8956A] text-white">
                            <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-white font-medium truncate">{item.title || 'Untitled'}</p>
                      {item.category && (
                        <p className="text-white/50 text-sm">{item.category}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Analytics & Insights</h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Eye className="w-8 h-8 text-[#B8956A]" />
                    <span className="text-emerald-400 text-sm flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> +12%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics?.total_profile_views || 0}</p>
                  <p className="text-white/60 text-sm">Total Profile Views</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <MessageSquare className="w-8 h-8 text-amber-400" />
                    <span className="text-emerald-400 text-sm flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> +8%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics?.total_inquiries || 0}</p>
                  <p className="text-white/60 text-sm">Total Inquiries</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <span className="text-emerald-400 text-sm flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> +15%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics?.total_bookings || 0}</p>
                  <p className="text-white/60 text-sm">Total Bookings</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Phone className="w-8 h-8 text-purple-400" />
                    <span className="text-emerald-400 text-sm flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> +5%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics?.total_contact_clicks || 0}</p>
                  <p className="text-white/60 text-sm">Contact Clicks</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <CardTitle className="text-white">This Month's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-white/5 rounded-lg">
                    <p className="text-4xl font-bold text-[#B8956A]">{analytics?.monthly_profile_views || 0}</p>
                    <p className="text-white/60 mt-2">Profile Views</p>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#B8956A] rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-lg">
                    <p className="text-4xl font-bold text-amber-400">{analytics?.monthly_inquiries || 0}</p>
                    <p className="text-white/60 mt-2">Quote Requests</p>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div className="text-center p-6 bg-white/5 rounded-lg">
                    <p className="text-4xl font-bold text-emerald-400">{analytics?.weekly_profile_views || 0}</p>
                    <p className="text-white/60 mt-2">Views This Week</p>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-[#0B1426]/80 border border-[#B8956A]/20">
              <CardHeader>
                <CardTitle className="text-white">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-white/60 text-sm">Profile Views</div>
                    <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#B8956A] to-[#8B6914] rounded-lg flex items-center justify-end pr-3" style={{ width: '100%' }}>
                        <span className="text-white text-sm font-medium">{analytics?.total_profile_views || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-white/60 text-sm">Contact Clicks</div>
                    <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg flex items-center justify-end pr-3" 
                        style={{ width: `${Math.min(100, ((analytics?.total_contact_clicks || 0) / Math.max(1, analytics?.total_profile_views || 1)) * 100)}%` }}
                      >
                        <span className="text-white text-sm font-medium">{analytics?.total_contact_clicks || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-white/60 text-sm">Inquiries</div>
                    <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-end pr-3" 
                        style={{ width: `${Math.min(100, ((analytics?.total_inquiries || 0) / Math.max(1, analytics?.total_profile_views || 1)) * 100)}%` }}
                      >
                        <span className="text-white text-sm font-medium">{analytics?.total_inquiries || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-white/60 text-sm">Bookings</div>
                    <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-end pr-3" 
                        style={{ width: `${Math.min(100, ((analytics?.total_bookings || 0) / Math.max(1, analytics?.total_profile_views || 1)) * 100)}%` }}
                      >
                        <span className="text-white text-sm font-medium">{analytics?.total_bookings || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quote Response Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="bg-[#0B1426] border border-[#B8956A]/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Send Quote to {selectedQuote?.host_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Quote Amount ($)</label>
              <Input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="Enter your quote amount"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Message (Optional)</label>
              <Textarea
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
                placeholder="Add details about your quote, inclusions, terms..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuoteModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleRespondToQuote('quoted')}
              disabled={!quoteAmount}
              className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
            >
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Portfolio Item Modal */}
      <Dialog open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <DialogContent className="bg-[#0B1426] border border-[#B8956A]/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Portfolio Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-white/70 text-sm block mb-2">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={newPortfolioItem.type === 'image' ? 'default' : 'outline'}
                  onClick={() => setNewPortfolioItem(prev => ({ ...prev, type: 'image' }))}
                  className={newPortfolioItem.type === 'image' 
                    ? 'bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white' 
                    : 'border-white/20 text-white hover:bg-white/10'}
                >
                  <Image className="w-4 h-4 mr-2" /> Image
                </Button>
                <Button
                  variant={newPortfolioItem.type === 'video' ? 'default' : 'outline'}
                  onClick={() => setNewPortfolioItem(prev => ({ ...prev, type: 'video' }))}
                  className={newPortfolioItem.type === 'video' 
                    ? 'bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white' 
                    : 'border-white/20 text-white hover:bg-white/10'}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Video
                </Button>
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">URL</label>
              <Input
                value={newPortfolioItem.url}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, url: e.target.value }))}
                placeholder={newPortfolioItem.type === 'image' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Title</label>
              <Input
                value={newPortfolioItem.title}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Elegant Garden Wedding"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Category</label>
              <Input
                value={newPortfolioItem.category}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Weddings, Corporate, etc."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-2">Description</label>
              <Textarea
                value={newPortfolioItem.description}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this work..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={newPortfolioItem.is_featured}
                onChange={(e) => setNewPortfolioItem(prev => ({ ...prev, is_featured: e.target.checked }))}
                className="rounded border-white/20"
              />
              <label htmlFor="featured" className="text-white/70 text-sm">Mark as featured</label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPortfolioModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPortfolioItem}
              disabled={!newPortfolioItem.url}
              className="bg-gradient-to-r from-[#B8956A] to-[#8B6914] text-white"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceProviderDashboard;
