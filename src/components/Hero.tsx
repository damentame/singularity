import React, { useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ArrowRight, ChevronDown, Check, Sparkles } from 'lucide-react';
import MusicPlayer from './MusicPlayer';
import TerritorySelector from './TerritorySelector';
import InlineCelebrationPicker from './InlineCelebrationPicker';
import { CelebrationType } from '@/data/celebrationTypes';

const Hero: React.FC = () => {
  const { 
    setCurrentView, 
    setFilters, 
    setShowAuthModal, 
    setAuthMode,
    setPreselectedRole,
    setPreselectedEventType,
    isAuthenticated,
    user,
    routeToRoleDashboard,
  } = useAppContext();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const eventTypeSectionRef = useRef<HTMLDivElement>(null);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);

    // If already authenticated, route directly — no auth modal
    if (isAuthenticated) {
      routeToRoleDashboard(roleId);
      return;
    }

    // Not authenticated → open auth modal with role pre-selected
    setPreselectedRole(roleId as 'host' | 'supplier' | 'coordinator');
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleCelebrationTypeSelect = (celebrationType: CelebrationType) => {
    setPreselectedEventType(celebrationType.id);
    setFilters({ eventType: celebrationType.category });
    setCurrentView('browse');
  };

  const handleContinueAsGuest = () => {
    setCurrentView('browse');
  };

  const handleTerritorySelect = (location: string) => {
    setFilters({ location });
  };

  const stats = [
    { value: '500+', label: 'Premium Suppliers' },
    { value: '50+', label: 'Countries' },
    { value: '10,000+', label: 'Events Planned' },
    { value: '4.9', label: 'Average Rating' },
  ];

  const userTypes = [
    {
      id: 'host',
      title: 'Host',
      subtitle: 'Planning an Event',
      description: 'Find and book the perfect suppliers for your special day',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
      features: ['Browse curated suppliers', 'Request quotes', 'Manage your event'],
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      ),
    },
    {
      id: 'supplier',
      title: 'Service Provider',
      subtitle: 'Offer Your Services',
      description: 'Connect with clients and grow your event business',
      image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
      features: ['Showcase your portfolio', 'Receive inquiries', 'Manage bookings'],
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
      ),
    },
    {
      id: 'coordinator',
      title: 'Coordinator',
      subtitle: 'Manage Events',
      description: 'Streamline planning and coordinate multiple suppliers',
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
      features: ['Create unlimited events', 'Coordinate suppliers', 'Cloud-saved & synced'],
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ];

  // Celebration picker is enabled for authenticated hosts
  const celebrationPickerEnabled = isAuthenticated && user?.role === 'host';

  return (
    <section className="relative min-h-screen" style={{ backgroundColor: '#0B1426' }}>
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Main Hero Content */}
        <div className="text-center mb-20">
          {/* Gold Circle Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative w-28 h-28 md:w-32 md:h-32 animate-cinematic-orbit">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#goldGradient)" strokeWidth="1" />
              </svg>
            </div>
          </div>

          {/* The One */}
          <h1 
            className="text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.08em] mb-6"
            style={{ 
              color: '#FFFFFF', 
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            The One
          </h1>

          {/* Classic Tagline */}
          <h2 
            className="text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.06em] mb-6"
            style={{ 
              color: '#C9A96E', 
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            Your Event &middot; Your Way
          </h2>

          {/* Elegant Descriptor */}
          <p 
            className="text-sm md:text-base max-w-xl mx-auto mb-10 uppercase tracking-[0.3em] font-light"
            style={{ 
              color: 'rgba(255,255,255,0.55)',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Curated Luxury &middot; Global Reach &middot; Flawless Execution
          </p>

          {/* Territory Selector */}
          <div className="mb-8">
            <TerritorySelector onSelect={handleTerritorySelect} />
          </div>
        </div>

        {/* STEP 1: Are You A... Section */}
        <div className="mb-16">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 mb-8">
              <span className="w-8 h-8 rounded-full bg-gold text-navy font-bold flex items-center justify-center text-sm">1</span>
              <span className="text-gold text-sm uppercase tracking-[0.2em] font-medium">
                {isAuthenticated ? 'Welcome Back' : 'Get Started'}
              </span>
            </div>
            
            <h2 
              className="text-5xl md:text-6xl lg:text-7xl text-center mb-6 tracking-[0.04em] font-light"
              style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {isAuthenticated ? `Hello, ${user?.name?.split(' ')[0]}` : 'Are You a'}
            </h2>
            <p 
              className="text-center text-lg md:text-xl uppercase tracking-[0.25em] font-light"
              style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.8 }}
            >
              {isAuthenticated 
                ? 'Select where you\'d like to go' 
                : 'Select Your Role to Begin Your Journey'
              }
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {userTypes.map((type) => {
              const isActiveRole = isAuthenticated && user?.role === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleRoleSelect(type.id)}
                  className={`group relative overflow-hidden rounded-3xl transition-all duration-500 transform hover:scale-[1.02] ${
                    selectedRole === type.id || isActiveRole
                      ? 'ring-4 ring-gold shadow-2xl shadow-gold/20 scale-[1.02]' 
                      : 'hover:shadow-xl hover:shadow-gold/10'
                  }`}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={type.image}
                      alt={type.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        selectedRole === type.id || isActiveRole ? 'scale-110' : 'group-hover:scale-110'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1426] via-[#0B1426]/80 to-[#0B1426]/20" />
                  </div>

                  {(selectedRole === type.id || isActiveRole) && (
                    <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gold flex items-center justify-center animate-scale-in">
                      <Check className="w-6 h-6 text-navy" strokeWidth={3} />
                    </div>
                  )}

                  {/* Active role badge for authenticated users */}
                  {isActiveRole && (
                    <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-gold/90 text-navy text-xs font-semibold uppercase tracking-wider">
                      Your Role
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-gold/30 transition-all duration-300 ${
                      selectedRole === type.id || isActiveRole ? 'bg-gold/40' : 'group-hover:bg-gold/20'
                    }`}>
                      <span className="text-gold">{type.icon}</span>
                    </div>

                    <h3 
                      className="text-3xl md:text-4xl font-light tracking-[0.04em] mb-2"
                      style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
                    >
                      {type.title}
                    </h3>
                    <p className="text-gold text-sm uppercase tracking-[0.2em] mb-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {type.subtitle}
                    </p>
                    <p className="text-base mb-6" style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.85 }}>
                      {type.description}
                    </p>

                    <ul className="space-y-2">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                          <span style={{ fontFamily: '"Inter", sans-serif' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
                    selectedRole === type.id || isActiveRole ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-gold/15 to-transparent" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue as Guest — only show when NOT authenticated */}
          {!isAuthenticated && (
            <div className="text-center mt-10">
              <button
                onClick={handleContinueAsGuest}
                className="text-white/60 hover:text-white text-sm uppercase tracking-[0.15em] transition-colors duration-300 flex items-center gap-2 mx-auto group"
                style={{ fontFamily: '"Inter", sans-serif' }}
              >
                <span>Or continue as guest</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Animated Scroll Indicator */}
        <div className="flex justify-center mb-16">
          <div className={`transition-all duration-500 ${celebrationPickerEnabled ? 'opacity-100 animate-bounce' : 'opacity-30'}`}>
            <ChevronDown className="w-8 h-8 text-gold" />
          </div>
        </div>

        {/* STEP 2: What Type of Celebration? — Only for Hosts */}
        <div 
          ref={eventTypeSectionRef}
          className={`mb-24 transition-all duration-700 ${
            celebrationPickerEnabled ? 'opacity-100 translate-y-0' : 'opacity-40'
          }`}
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border mb-8 transition-all duration-500 ${
              celebrationPickerEnabled
                ? 'bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30' 
                : 'bg-white/5 border-white/10'
            }`}>
              <span className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm transition-all duration-500 ${
                celebrationPickerEnabled ? 'bg-gold text-navy' : 'bg-white/20 text-white/50'
              }`}>2</span>
              <span className={`text-sm uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${
                celebrationPickerEnabled ? 'text-gold' : 'text-white/50'
              }`}>Step Two</span>
            </div>
            
            <h2 
              className="text-4xl md:text-5xl lg:text-6xl text-center mb-4 tracking-[0.04em] font-light"
              style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              What Type of Celebration?
            </h2>
            <p 
              className="text-center text-base md:text-lg uppercase tracking-[0.2em] font-light mb-2"
              style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.7 }}
            >
              Tap to explore 800+ celebration types
            </p>

            {/* Disabled overlay message */}
            {!celebrationPickerEnabled && (
              <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Sparkles className="w-4 h-4 text-gold/60" />
                <span className="text-white/50 text-sm" style={{ fontFamily: '"Inter", sans-serif' }}>
                  {isAuthenticated ? 'Available for Host accounts' : 'Sign in as a Host to unlock'}
                </span>
              </div>
            )}
          </div>

          {/* Inline Celebration Picker */}
          <InlineCelebrationPicker
            onSelect={handleCelebrationTypeSelect}
            disabled={!celebrationPickerEnabled}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto pt-12 border-t border-white/10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div 
                className="text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-dark font-light mb-3 group-hover:scale-110 transition-transform duration-300 tracking-wide"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {stat.value}
              </div>
              <div 
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.7 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border border-gold/30 flex justify-center pt-2">
          <div className="w-1 h-3 bg-gradient-to-b from-gold to-gold/10 rounded-full" />
        </div>
      </div>

      {/* Music Tab Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-8">
          <h2 
            className="text-3xl md:text-4xl font-light tracking-[0.04em] mb-4"
            style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Set the Mood
          </h2>
          <p 
            className="text-sm uppercase tracking-[0.2em]"
            style={{ color: '#FFFFFF', fontFamily: '"Inter", sans-serif', opacity: 0.6 }}
          >
            Connect your music platform and create the perfect playlist
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <MusicPlayer />
        </div>
      </div>
    </section>
  );
};

export default Hero;
