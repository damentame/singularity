import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Menu, X, Heart, LogOut, MessageSquare, LayoutDashboard, ChevronDown, Briefcase, Home, UserCircle } from 'lucide-react';

const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout,
    currentView,
    setCurrentView,
    wishlist,
    setShowAuthModal,
    setAuthMode,
    routeToRoleDashboard,
  } = useAppContext();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleSignIn = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // Build nav items based on auth state and role
  const navItems = [
    { label: 'Home', view: 'home' as const, icon: Home },
    { label: 'Browse', view: 'browse' as const },
    { label: 'Find Providers', view: 'search-providers' as const },
    ...(isAuthenticated && user?.role === 'coordinator' 
      ? [{ label: 'My Events', view: 'coordinator-dashboard' as const, icon: Briefcase, highlight: true }] 
      : []),
    ...(isAuthenticated && user?.role === 'host'
      ? [{ label: 'Dashboard', view: 'dashboard' as const, icon: LayoutDashboard }]
      : []),
    ...(isAuthenticated && user?.role === 'supplier'
      ? [{ label: 'Provider Hub', view: 'provider-dashboard' as const, icon: Briefcase }]
      : []),
  ];

  const handleNavClick = (view: string) => {
    setCurrentView(view as any);
    setMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    if (user) {
      routeToRoleDashboard(user.role);
    }
    setUserMenuOpen(false);
  };

  const handleProfileClick = () => {
    setCurrentView('profile');
    setUserMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || currentView !== 'home'
          ? 'shadow-2xl'
          : 'bg-transparent'
      }`}
      style={{
        backgroundColor: isScrolled || currentView !== 'home' ? '#0B1426' : 'transparent'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-22">
          {/* Logo */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center space-x-4 group"
          >
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="headerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#B8956A" />
                    <stop offset="50%" stopColor="#8B6914" />
                    <stop offset="100%" stopColor="#6B5210" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#headerGold)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#headerGold)" strokeWidth="1" />
              </svg>
            </div>
            <span 
              className="text-xl tracking-[0.08em] font-light"
              style={{ color: '#FFFFFF', fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              The One
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-12">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`text-xs uppercase tracking-[0.25em] gold-underline transition-colors ${
                  currentView === item.view ? 'text-gold' : 'hover:text-white'
                }`}
                style={{ 
                  color: currentView === item.view ? undefined : '#FFFFFF',
                  fontFamily: '"Inter", sans-serif',
                  opacity: currentView === item.view ? 1 : 0.85,
                }}
              >
                {(item as any).highlight && <Briefcase className="w-3 h-3 inline mr-1.5 mb-0.5" />}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-5">
            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="relative p-2 hover:text-gold transition-colors"
                  style={{ color: '#FFFFFF' }}
                >
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-[#0B1426] text-xs font-medium rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                {/* Messages */}
                <button
                  onClick={() => setCurrentView('messages')}
                  className="p-2 hover:text-gold transition-colors"
                  style={{ color: '#FFFFFF' }}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    className="flex items-center space-x-3 px-4 py-2 rounded-xl transition-colors border border-white/[0.15] hover:border-gold/30"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-medium text-sm" style={{ color: '#0B1426' }}>
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="text-sm block" style={{ color: '#FFFFFF' }}>{user?.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold/70">
                        {user?.role === 'supplier' ? 'Provider' : user?.role}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: '#FFFFFF', opacity: 0.7 }} />
                  </button>

                  {userMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-light" style={{ color: '#0B1426', fontFamily: '"Playfair Display", Georgia, serif' }}>{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">
                          {user?.role === 'supplier' ? 'Service Provider' : user?.role}
                        </span>
                      </div>

                      {/* My Profile */}
                      <button
                        onClick={handleProfileClick}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <UserCircle className="w-4 h-4 text-gold" />
                        <span>My Profile</span>
                      </button>

                      {/* Role-specific dashboard link */}
                      <button
                        onClick={handleDashboardClick}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gold" />
                        <span>My Dashboard</span>
                      </button>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Single Sign In button — the only auth trigger in the header */
              <button
                onClick={handleSignIn}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark font-medium text-xs uppercase tracking-[0.15em] rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
                style={{ color: '#0B1426' }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: '#FFFFFF' }}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.1]" style={{ backgroundColor: '#0B1426' }}>
          <div className="px-4 py-8 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`block w-full text-left py-3 text-xl tracking-[0.06em] font-light ${
                  currentView === item.view ? 'text-gold' : ''
                }`}
                style={{ 
                  color: currentView === item.view ? undefined : '#FFFFFF',
                  fontFamily: '"Playfair Display", Georgia, serif',
                }}
              >
                {item.label}
              </button>
            ))}
            
            {isAuthenticated ? (
              <div className="border-t border-white/[0.1] pt-4 space-y-2">
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-medium text-sm" style={{ color: '#0B1426' }}>
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm">{user?.name}</p>
                    <p className="text-gold/70 text-xs uppercase tracking-wider">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCurrentView('profile'); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 w-full text-left py-3 text-white/80 text-sm hover:text-gold transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => { 
                    if (user) routeToRoleDashboard(user.role);
                    setMobileMenuOpen(false); 
                  }}
                  className="flex items-center space-x-3 w-full text-left py-3 text-white/80 text-sm hover:text-gold transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>My Dashboard</span>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center space-x-3 w-full text-left py-3 text-red-400 text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-8">
                <button
                  onClick={() => { handleSignIn(); setMobileMenuOpen(false); }}
                  className="w-full py-3.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-xl font-medium text-xs uppercase tracking-[0.15em]"
                  style={{ color: '#0B1426' }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
