import React, { useEffect, useState } from 'react';
import { Inbox, Store, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { getMyInvitations } from '@/lib/supplierRfqApi';
import { getUnreadCountsForSupplier } from '@/lib/rfqMessagesApi';
import { themeStyle, usePageTheme } from '@/theme/pageTheme';
import { GOLD, MUTED, TEXT, glassCard } from './supplierUi';
import SupplierInvitationsList from './SupplierInvitationsList';
import SupplierInvitationDetail from './SupplierInvitationDetail';
import SupplierCatalogPanel from './SupplierCatalogPanel';

const BADGE_POLL_MS = 30000;

type Tab = 'invitations' | 'catalog';

const SupplierShell: React.FC = () => {
  const { user, setCurrentView } = useAppContext();
  const pageTheme = usePageTheme('supplier-dashboard');
  const [tab, setTab] = useState<Tab>('invitations');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [attentionCount, setAttentionCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('service_providers').select('business_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
        setBusinessName(data?.business_name || '');
        setCheckingProfile(false);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!hasProfile) return;
    const load = () => {
      Promise.all([getMyInvitations(), getUnreadCountsForSupplier()]).then(([invitations, counts]) => {
        const needsResponse = invitations.filter(i => !i.batch.invitationResponse).length;
        const totalUnread = Object.values(counts).reduce((a, b) => a + b, 0);
        setAttentionCount(needsResponse + totalUnread);
      });
    };
    load();
    const interval = setInterval(load, BADGE_POLL_MS);
    return () => clearInterval(interval);
  }, [hasProfile, selectedBatchId]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={themeStyle(pageTheme)}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={themeStyle(pageTheme)}>
        <div className="max-w-sm text-center rounded-2xl p-8" style={glassCard}>
          <Store className="w-8 h-8 mx-auto mb-4" style={{ color: GOLD }} />
          <h2 className="text-lg font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}>
            Complete Your Registration
          </h2>
          <p className="text-xs mb-5" style={{ color: MUTED }}>
            Set up your supplier profile to start receiving and responding to quote requests.
          </p>
          <button
            onClick={() => setCurrentView('service-provider-registration')}
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #FFF)' }}
          >
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={themeStyle(pageTheme)}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.55]"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 15% -10%, color-mix(in srgb, var(--pt-primary, #C9A24A) 18%, transparent), transparent 60%), radial-gradient(ellipse 55% 40% at 95% 5%, color-mix(in srgb, var(--pt-border, #D4CFC6) 55%, transparent), transparent 55%)',
        }}
      />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 rounded-2xl px-5 py-4" style={glassCard}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: GOLD }}>
            Supplier
          </p>
          <h1 className="text-2xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}>
            {businessName || 'Supplier Dashboard'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>{user?.email}</p>
        </div>

        <div
          className="flex items-center gap-1 mb-6 p-1 rounded-2xl"
          style={{ ...glassCard, padding: 4 }}
        >
          {([
            { key: 'invitations' as Tab, label: 'My Invitations', icon: Inbox },
            { key: 'catalog' as Tab, label: 'Profile & Catalog', icon: Store },
          ]).map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelectedBatchId(null); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl transition-all"
                style={{
                  backgroundColor: active ? 'color-mix(in srgb, var(--pt-primary, #C9A24A) 14%, transparent)' : 'transparent',
                  color: active ? GOLD : MUTED,
                  boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.7)' : 'none',
                }}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
                {t.key === 'invitations' && attentionCount > 0 && (
                  <span
                    className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-semibold text-white"
                    style={{ backgroundColor: '#EF4444' }}
                  >
                    {attentionCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === 'invitations' && (
          selectedBatchId
            ? <SupplierInvitationDetail batchId={selectedBatchId} onBack={() => setSelectedBatchId(null)} />
            : <SupplierInvitationsList onOpen={setSelectedBatchId} />
        )}
        {tab === 'catalog' && <SupplierCatalogPanel />}
      </div>
    </div>
  );
};

export default SupplierShell;
