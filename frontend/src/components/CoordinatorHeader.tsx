import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ArrowLeftRight, Plus, LogOut, User } from 'lucide-react';
import SyncStatusIndicator from './SyncStatusIndicator';
import PriceAlertBell from './PriceAlertBell';

const GOLD = '#C9A24A';

interface CoordinatorHeaderProps {
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  onCreateEvent?: () => void;
  onNavigateToCompare?: (eventId: string) => void;
}

const CoordinatorHeader: React.FC<CoordinatorHeaderProps> = ({ title, onBack, backLabel, onCreateEvent, onNavigateToCompare }) => {
  const { setCurrentView, user, logout, isAuthenticated } = useAppContext();

  const handleSwitchRole = () => {
    setCurrentView('home');
  };

  const handleSignOut = async () => {
    await logout();
  };


  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: '#FAFAF7',
        borderColor: 'rgba(201,162,74,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Back */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => setCurrentView('coordinator-dashboard')}
              className="flex items-center gap-3 group"
            >
              <svg viewBox="0 0 100 100" className="w-8 h-8">
                <defs>
                  <linearGradient id="chGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF5A" />
                    <stop offset="100%" stopColor="#A8863A" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#chGold)" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#chGold)" strokeWidth="1" />
              </svg>
              <span
                className="text-lg tracking-wide font-light hidden sm:inline"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}
              >
                The One
              </span>
            </button>

            {onBack && (
              <>
                <div className="w-px h-6" style={{ backgroundColor: 'rgba(201,162,74,0.2)' }} />
                <button
                  onClick={onBack}
                  className="text-xs uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}
                >
                  {backLabel || 'Back'}
                </button>
              </>
            )}

            {title && (
              <>
                <div className="w-px h-6 hidden sm:block" style={{ backgroundColor: 'rgba(201,162,74,0.2)' }} />
                <span
                  className="text-sm font-medium hidden sm:inline truncate max-w-[200px]"
                  style={{ color: '#1A1A1A', fontFamily: '"Inter", sans-serif' }}
                >
                  {title}
                </span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Sync Status Indicator */}
            <SyncStatusIndicator />

            {/* Price Alert Bell */}
            <PriceAlertBell onNavigateToCompare={onNavigateToCompare} />

            {/* Divider */}
            <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'rgba(201,162,74,0.12)' }} />

            {onCreateEvent && (
              <button
                onClick={onCreateEvent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:shadow-md"
                style={{
                  backgroundColor: GOLD,
                  color: '#FFF',
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Event</span>
              </button>
            )}

            {/* User info */}
            {isAuthenticated && user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold/30 to-gold/60 flex items-center justify-center">
                  <span className="text-[10px] font-semibold" style={{ color: '#1A1A1A' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{user.name}</span>
              </div>
            )}

            <button
              onClick={handleSwitchRole}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide transition-colors hover:bg-black/5"
              style={{ color: '#999', fontFamily: '"Inter", sans-serif' }}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-wide transition-colors hover:bg-red-50 text-gray-400 hover:text-red-500"
                style={{ fontFamily: '"Inter", sans-serif' }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CoordinatorHeader;
