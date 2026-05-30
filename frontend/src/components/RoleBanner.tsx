import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { User, Building2, Users, ChevronDown, Check, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface RoleBannerProps {
  showRoleSwitcher?: boolean;
}

const roleConfig = {
  host: {
    label: 'Host',
    description: 'Planning your event',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    icon: User,
  },
  coordinator: {
    label: 'Coordinator',
    description: 'Managing events professionally',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    icon: Users,
  },
  supplier: {
    label: 'Service Provider',
    description: 'Providing services',
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    icon: Building2,
  },
};

const RoleBanner: React.FC<RoleBannerProps> = ({ showRoleSwitcher = true }) => {
  const { user, isAuthenticated, switchRole } = useAppContext();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [confirmRole, setConfirmRole] = useState<'host' | 'supplier' | 'coordinator' | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (showSwitcher) {
      const handler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-role-switcher]')) {
          setShowSwitcher(false);
        }
      };
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showSwitcher]);

  if (!isAuthenticated || !user) return null;

  const currentRole = user.role || 'host';
  const config = roleConfig[currentRole];
  const Icon = config.icon;

  const handleRoleSwitch = (newRole: 'host' | 'supplier' | 'coordinator') => {
    if (newRole === currentRole) {
      setShowSwitcher(false);
      return;
    }
    // Show confirmation dialog
    setConfirmRole(newRole);
    setShowSwitcher(false);
  };

  const confirmSwitch = async () => {
    if (!confirmRole) return;
    setSwitchingRole(true);
    try {
      await switchRole(confirmRole);
    } finally {
      setSwitchingRole(false);
      setConfirmRole(null);
    }
  };

  return (
    <>
      <div className={`${config.bgColor} ${config.borderColor} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-medium ${config.textColor}`}>
                  You are logged in as a <span className="font-bold">{config.label}</span>
                </p>
                <p className="text-xs text-white/50">{config.description}</p>
              </div>
            </div>

            {showRoleSwitcher && (
              <div className="relative" data-role-switcher>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowSwitcher(!showSwitcher); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border ${config.borderColor} hover:bg-white/5 transition-colors`}
                >
                  {switchingRole ? (
                    <RefreshCw className="w-4 h-4 text-white/70 animate-spin" />
                  ) : (
                    <>
                      <span className="text-xs text-white/70">Switch Role</span>
                      <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>

                {showSwitcher && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#0f1d35] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                    <p className="px-4 py-2 text-xs text-white/50 uppercase tracking-wider">Switch Account Role</p>
                    {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                      const roleConf = roleConfig[role];
                      const RoleIcon = roleConf.icon;
                      const isActive = role === currentRole;
                      
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
                            isActive ? 'bg-white/5' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleConf.color} flex items-center justify-center`}>
                            <RoleIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm text-white font-medium">{roleConf.label}</p>
                            <p className="text-xs text-white/50">{roleConf.description}</p>
                          </div>
                          {isActive && (
                            <Check className="w-4 h-4 text-gold" />
                          )}
                        </button>
                      );
                    })}
                    <div className="border-t border-white/10 mt-2 pt-2 px-4">
                      <p className="text-xs text-white/40 py-2">
                        Switch roles to access different features. Your data is preserved across roles.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmRole && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(11, 20, 38, 0.85)' }}
            onClick={() => setConfirmRole(null)}
          />
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Close */}
              <button
                onClick={() => setConfirmRole(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                Switch Role?
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                You are about to switch from{' '}
                <span className="font-medium text-gray-700">{roleConfig[currentRole].label}</span>
                {' '}to{' '}
                <span className="font-medium text-gray-700">{roleConfig[confirmRole].label}</span>.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                You will be redirected to the {roleConfig[confirmRole].label} dashboard. Your current data will be preserved.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRole(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSwitch}
                  disabled={switchingRole}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold-light via-gold to-gold-dark text-sm font-medium hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ color: '#0B1426' }}
                >
                  {switchingRole ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    'Switch Role'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleBanner;
