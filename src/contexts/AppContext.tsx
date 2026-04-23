import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { suppliers, Supplier } from '@/data/suppliers';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'host' | 'supplier' | 'coordinator';
  eventType?: string;
  avatar?: string;
  phone?: string;
  companyName?: string;
  country?: string;
  city?: string;
  availableRoles?: string[];
}

export interface BookingRequest {
  id: string;
  supplierId: string;
  supplierName: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  budget?: string;
  message: string;
  status: 'pending' | 'confirmed' | 'declined';
  createdAt: string;
  taskId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export type ViewType = 'home' | 'browse' | 'search-providers' | 'supplier' | 'dashboard' | 'messages' | 'budget' | 'checklist' | 'guests' | 'seating' | 'weather' | 'accommodation' | 'supplier-upload' | 'wizard' | 'workbook' | 'moodboard' | 'service-provider-registration' | 'provider-dashboard' | 'planner-dashboard' | 'event-detail' | 'event-proposal' | 'role-selector' | 'coordinator-dashboard' | 'coordinator-event' | 'coordinator-proposal' | 'profile' | 'reset-password';

// Service Provider Registration Data
export interface ServiceProviderFormData {
  country: string;
  state: string;
  city: string;
  postcode: string;
  serviceRadius: string;
  businessName: string;
  tradingName: string;
  registrationNumber: string;
  businessType: string;
  yearsInOperation: string;
  teamSize: string;
  businessDescription: string;
  website: string;
  instagram: string;
  facebook: string;
  pinterest: string;
  tiktok: string;
  selectedEventTypes: string[];
  selectedCategories: Record<string, string[]>;
  serviceDetails: Record<string, Record<string, any>>;
  insuranceTypes: string[];
  publicLiabilityAmount: string;
  policyNumber: string;
  expiryDate: string;
}

interface Filters {
  category: string;
  region: string;
  city: string;
  eventType: string;
  priceRange: string;
  search: string;
  sortBy: string;
  location: string;
}


interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: 'host' | 'supplier' | 'coordinator', eventType?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  routeToRoleDashboard: (role: string) => void;
  switchRole: (newRole: 'host' | 'supplier' | 'coordinator') => Promise<boolean>;
  refreshProfile: () => Promise<void>;

  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (v: boolean) => void;
  
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Suppliers
  selectedSupplierId: string | null;
  setSelectedSupplierId: (id: string | null) => void;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  
  // Wishlist
  wishlist: string[];
  toggleWishlist: (supplierId: string) => void;
  isInWishlist: (supplierId: string) => boolean;
  
  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  
  // Bookings
  bookingRequests: BookingRequest[];
  addBookingRequest: (request: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>) => void;
  getBookingForTask: (taskId: string) => BookingRequest | undefined;
  
  // Messages
  conversations: Conversation[];
  messages: Message[];
  sendMessage: (conversationId: string, content: string) => void;
  
  // Quote Modal
  quoteSupplier: Supplier | null;
  setQuoteSupplier: (supplier: Supplier | null) => void;
  showQuoteModal: boolean;
  setShowQuoteModal: (show: boolean) => void;
  
  // Auth Modal
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  preselectedRole: 'host' | 'supplier' | 'coordinator' | null;
  setPreselectedRole: (role: 'host' | 'supplier' | 'coordinator' | null) => void;
  preselectedEventType: string | null;
  setPreselectedEventType: (eventType: string | null) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const defaultFilters: Filters = {
  category: '',
  region: '',
  city: '',
  eventType: '',
  priceRange: '',
  search: '',
  sortBy: 'featured',
  location: '',
};

const defaultContext: AppContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  logout: async () => {},
  routeToRoleDashboard: () => {},
  switchRole: async () => false,
  refreshProfile: async () => {},

  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
  currentView: 'home',
  setCurrentView: () => {},
  selectedSupplierId: null,
  setSelectedSupplierId: () => {},
  selectedSupplier: null,
  setSelectedSupplier: () => {},
  wishlist: [],
  toggleWishlist: () => {},
  isInWishlist: () => false,
  filters: defaultFilters,
  setFilters: () => {},
  resetFilters: () => {},
  bookingRequests: [],
  addBookingRequest: () => {},
  getBookingForTask: () => undefined,
  conversations: [],
  messages: [],
  sendMessage: () => {},
  quoteSupplier: null,
  setQuoteSupplier: () => {},
  showQuoteModal: false,
  setShowQuoteModal: () => {},
  showAuthModal: false,
  setShowAuthModal: () => {},
  authMode: 'login',
  setAuthMode: () => {},
  preselectedRole: null,
  setPreselectedRole: () => {},
  preselectedEventType: null,
  setPreselectedEventType: () => {},
  sidebarOpen: false,
  toggleSidebar: () => {},
};

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  
  // Navigation
  const [currentView, setCurrentViewState] = useState<ViewType>('home');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  
  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  // Filters
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);
  
  // Bookings
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  
  // Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Modals
  const [quoteSupplier, setQuoteSupplier] = useState<Supplier | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAuthModal, setShowAuthModalState] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [preselectedRole, setPreselectedRole] = useState<'host' | 'supplier' | 'coordinator' | null>(null);
  const [preselectedEventType, setPreselectedEventType] = useState<string | null>(null);
  
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track whether we've already auto-routed on session restore
  const hasAutoRouted = useRef(false);

  // Derived state
  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [selectedSupplierId]);

  // ─── Centralized role-based routing ───
  const routeToRoleDashboard = useCallback((role: string) => {
    switch (role) {
      case 'coordinator':
        setCurrentViewState('coordinator-dashboard');
        break;
      case 'supplier':
        setCurrentViewState('provider-dashboard');
        break;
      case 'host':
        setCurrentViewState('dashboard');
        break;
      default:
        setCurrentViewState('home');
        break;
    }
  }, []);

  // Guarded setCurrentView
  const setCurrentView = useCallback((view: ViewType) => {
    // Redirect legacy role-selector to home
    if (view === 'role-selector') {
      setCurrentViewState('home');
      return;
    }
    setCurrentViewState(view);
  }, []);

  // Guarded setShowAuthModal — never open if already authenticated
  const setShowAuthModal = useCallback((show: boolean) => {
    if (show && user) {
      // Already authenticated — don't show auth modal, route to dashboard instead
      routeToRoleDashboard(user.role);
      return;
    }
    setShowAuthModalState(show);
  }, [user, routeToRoleDashboard]);

  // ─── Build user object from Supabase session + profile ───
  const buildUserFromProfile = (sessionUser: { id: string; email?: string | null }, profile: any): User => {
    return {
      id: sessionUser.id,
      email: sessionUser.email || '',
      name: profile?.full_name || profile?.name || sessionUser.email?.split('@')[0] || '',
      role: profile?.role || 'host',
      eventType: profile?.event_type,
      avatar: profile?.avatar_url,
      phone: profile?.phone,
      companyName: profile?.company_name,
      country: profile?.country,
      city: profile?.city,
      availableRoles: profile?.available_roles || [profile?.role || 'host'],
    };
  };

  // ─── Refresh profile from DB ───
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        setUser(buildUserFromProfile(session.user, profile));
      }
    }
  }, []);

  // ─── Switch role ───
  const switchRole = useCallback(async (newRole: 'host' | 'supplier' | 'coordinator'): Promise<boolean> => {
    if (!user) return false;
    try {
      // Update role in DB
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString(),
          // Ensure the new role is in available_roles
          available_roles: user.availableRoles?.includes(newRole) 
            ? user.availableRoles 
            : [...(user.availableRoles || []), newRole]
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: 'Role Switch Failed',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, role: newRole } : null);
      
      // Route to new dashboard
      routeToRoleDashboard(newRole);

      toast({
        title: 'Role Switched',
        description: `You are now using The One as a ${newRole === 'supplier' ? 'Service Provider' : newRole.charAt(0).toUpperCase() + newRole.slice(1)}.`,
      });
      return true;
    } catch (err) {
      console.error('Role switch error:', err);
      return false;
    }
  }, [user, routeToRoleDashboard]);

  // ─── Check session on mount ───
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const restoredUser = buildUserFromProfile(session.user, profile);
          setUser(restoredUser);

          // Auto-route returning users to their role-specific dashboard
          if (!hasAutoRouted.current) {
            hasAutoRouted.current = true;
            routeToRoleDashboard(restoredUser.role);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the password reset link in their email
        setIsPasswordRecovery(true);
        setCurrentViewState('reset-password');
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(buildUserFromProfile(session.user, profile));
        }
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const newUser = buildUserFromProfile(session.user, profile);
        setUser(newUser);

        // Close auth modal on sign-in
        setShowAuthModalState(false);

        // Route to dashboard after fresh sign-in (not session restore)
        if (hasAutoRouted.current) {
          // This is a fresh login (not initial page load), route to dashboard
          routeToRoleDashboard(newUser.role);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        hasAutoRouted.current = false;
        setIsPasswordRecovery(false);
        setCurrentViewState('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theone_wishlist');
    if (saved) {
      setWishlist(JSON.parse(saved));
    }
  }, []);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('theone_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Surface clear, specific error messages
        let friendlyMessage = error.message;
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('invalid') && lowerMsg.includes('credentials')) {
          friendlyMessage = 'Invalid email or password. Please check your details and try again.';
        } else if (lowerMsg.includes('email not confirmed') || lowerMsg.includes('not confirmed')) {
          friendlyMessage = 'Please confirm your email address before signing in. Check your inbox for a confirmation link.';
        } else if (lowerMsg.includes('user not found')) {
          friendlyMessage = 'No account found with this email. Please sign up first.';
        }

        toast({
          title: 'Login Failed',
          description: friendlyMessage,
          variant: 'destructive',
        });
        return { success: false, error: friendlyMessage };
      }

      if (data.user) {
        // Fetch profile to get role for routing (safely)
        let profile: any = null;
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          profile = profileData;
        } catch (profileErr) {
          console.warn('Profile fetch failed:', profileErr);
        }

        // If no profile exists yet, create a default host profile
        if (!profile) {
          try {
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email || email,
                full_name: data.user.email?.split('@')[0] || 'User',
                role: 'host',
                available_roles: ['host'],
              })
              .select()
              .single();
            profile = newProfile;
          } catch (insertErr) {
            console.warn('Profile create-on-login failed:', insertErr);
          }
        }

        const loggedInUser = buildUserFromProfile(data.user, profile);
        setUser(loggedInUser);

        // Close modal and route
        setShowAuthModalState(false);
        routeToRoleDashboard(loggedInUser.role);

        toast({
          title: 'Welcome Back',
          description: 'You have successfully logged in.',
        });
        return { success: true };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.message || 'Something went wrong. Please try again.';
      toast({
        title: 'Login Error',
        description: msg,
        variant: 'destructive',
      });
      return { success: false, error: msg };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: 'host' | 'supplier' | 'coordinator',
    eventType?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let friendlyMessage = error.message;
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('already registered') || lowerMsg.includes('already exists') || lowerMsg.includes('user already')) {
          friendlyMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (lowerMsg.includes('password')) {
          friendlyMessage = `Password issue: ${error.message}`;
        } else if (lowerMsg.includes('email') && lowerMsg.includes('invalid')) {
          friendlyMessage = 'Please enter a valid email address.';
        }

        toast({
          title: 'Signup Failed',
          description: friendlyMessage,
          variant: 'destructive',
        });
        return { success: false, error: friendlyMessage };
      }

      if (data.user) {
        // Create profile (best-effort — don't block signup if this fails due to RLS timing)
        try {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            email: trimmedEmail,
            full_name: name,
            role,
            available_roles: [role],
            event_type: eventType || null,
          });
          if (profileError) {
            console.warn('Profile creation warning:', profileError.message);
          }
        } catch (profileErr) {
          console.warn('Profile creation exception:', profileErr);
        }

        // If a session was returned, user is logged in immediately
        if (data.session) {
          const newUser: User = {
            id: data.user.id,
            email: trimmedEmail,
            name,
            role,
            eventType,
            availableRoles: [role],
          };
          setUser(newUser);

          setShowAuthModalState(false);

          if (role === 'supplier') {
            setCurrentViewState('service-provider-registration');
          } else {
            routeToRoleDashboard(role);
          }

          toast({
            title: 'Account Created',
            description: 'Welcome to The One! Your account has been created.',
          });
          return { success: true };
        } else {
          // Email confirmation required — user cannot log in immediately
          toast({
            title: 'Check Your Email',
            description: 'We sent you a confirmation link. Please confirm your email before signing in.',
          });
          return { success: true };
        }
      }
      return { success: false, error: 'Signup failed. Please try again.' };
    } catch (err: any) {
      console.error('Signup error:', err);
      const msg = err?.message || 'Something went wrong. Please try again.';
      toast({
        title: 'Signup Error',
        description: msg,
        variant: 'destructive',
      });
      return { success: false, error: msg };
    }
  };



  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    hasAutoRouted.current = false;
    setIsPasswordRecovery(false);
    setCurrentViewState('home');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully.',
    });
  };

  const toggleWishlist = (supplierId: string) => {
    setWishlist(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      }
      return [...prev, supplierId];
    });
  };

  const isInWishlist = (supplierId: string) => wishlist.includes(supplierId);

  const setFilters = (newFilters: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFiltersState(defaultFilters);
  };

  const addBookingRequest = (request: Omit<BookingRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: BookingRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setBookingRequests(prev => [...prev, newRequest]);
    toast({
      title: 'Quote Request Sent',
      description: `Your request has been sent to ${request.supplierName}.`,
    });
  };

  const getBookingForTask = (taskId: string) => {
    return bookingRequests.find(r => r.taskId === taskId);
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (!user) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      receiverId: conversationId,
      receiverName: 'Supplier',
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const setSelectedSupplier = (supplier: Supplier | null) => {
    setSelectedSupplierId(supplier?.id || null);
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        routeToRoleDashboard,
        switchRole,
        refreshProfile,
        isPasswordRecovery,
        setIsPasswordRecovery,
        currentView,
        setCurrentView,
        selectedSupplierId,
        setSelectedSupplierId,
        selectedSupplier,
        setSelectedSupplier,
        wishlist,
        toggleWishlist,
        isInWishlist,
        filters,
        setFilters,
        resetFilters,
        bookingRequests,
        addBookingRequest,
        getBookingForTask,
        conversations,
        messages,
        sendMessage,
        quoteSupplier,
        setQuoteSupplier,
        showQuoteModal,
        setShowQuoteModal,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        preselectedRole,
        setPreselectedRole,
        preselectedEventType,
        setPreselectedEventType,
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
