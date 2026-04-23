import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Users, Briefcase, Building2, Truck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

const roles = [
  {
    id: 'host' as const,
    label: 'Host',
    sub: 'Planning your event',
    icon: Users,
    active: true,
  },
  {
    id: 'coordinator' as const,
    label: 'Coordinator',
    sub: 'Run proposals, costing, and supplier RFQs',
    icon: Briefcase,
    active: true,
  },
  {
    id: 'venue' as const,
    label: 'Venue',
    sub: 'Manage venue details and enquiries',
    icon: Building2,
    active: false,
  },
  {
    id: 'supplier' as const,
    label: 'Supplier',
    sub: 'Respond to RFQs and availability',
    icon: Truck,
    active: true,
  },
];

const RoleSelector: React.FC = () => {
  const { isAuthenticated, routeToRoleDashboard, setShowAuthModal, setAuthMode, setPreselectedRole } = useAppContext();

  const handleSelect = (roleId: string, active: boolean) => {
    if (!active) {
      toast({
        title: 'Coming Soon',
        description: `The ${roleId.charAt(0).toUpperCase() + roleId.slice(1)} portal is coming soon.`,
      });
      return;
    }

    // If authenticated, route directly to the role dashboard
    if (isAuthenticated) {
      routeToRoleDashboard(roleId);
      return;
    }

    // Not authenticated — open auth modal with role pre-selected
    setPreselectedRole(roleId as 'host' | 'supplier' | 'coordinator');
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#FAFAF7' }}>
      {/* Logo */}
      <div className="mb-8">
        <svg viewBox="0 0 100 100" className="w-14 h-14 mx-auto mb-4">
          <defs>
            <linearGradient id="roleGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4AF5A" />
              <stop offset="50%" stopColor="#C9A24A" />
              <stop offset="100%" stopColor="#A8863A" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#roleGold)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="url(#roleGold)" strokeWidth="1" />
        </svg>
      </div>

      {/* Headline */}
      <h1
        className="text-2xl sm:text-3xl md:text-4xl text-center font-light mb-2 max-w-2xl leading-relaxed"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          color: GOLD,
        }}
      >
        Are you a Host, a Coordinator, a Venue, or a Supplier?
      </h1>
      <p className="text-sm text-gray-400 mb-12 tracking-wide" style={{ fontFamily: '"Inter", sans-serif' }}>
        Select your role to get started
      </p>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => handleSelect(role.id, role.active)}
              className={`group relative flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 border ${
                role.active
                  ? 'border-[#C9A24A]/30 hover:border-[#C9A24A] hover:shadow-lg cursor-pointer bg-white'
                  : 'border-gray-200 bg-gray-50 cursor-default opacity-60'
              }`}
              style={{ minHeight: 200 }}
            >
              {!role.active && (
                <span
                  className="absolute top-3 right-3 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#F0EDE6', color: '#999', fontFamily: '"Inter", sans-serif' }}
                >
                  Coming soon
                </span>
              )}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-colors ${
                  role.active ? 'group-hover:scale-105' : ''
                }`}
                style={{
                  backgroundColor: role.active ? 'rgba(201,162,74,0.1)' : 'rgba(0,0,0,0.04)',
                }}
              >
                <Icon
                  className="w-6 h-6"
                  style={{ color: role.active ? GOLD : '#BBB' }}
                />
              </div>
              <h3
                className="text-lg font-light mb-2"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  color: role.active ? '#1A1A1A' : '#999',
                }}
              >
                {role.label}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  color: role.active ? '#777' : '#BBB',
                }}
              >
                {role.sub}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-16 text-xs text-gray-400 tracking-wide" style={{ fontFamily: '"Inter", sans-serif' }}>
        Powered by <span style={{ color: GOLD }}>The One</span>
      </p>
    </div>
  );
};

export default RoleSelector;
