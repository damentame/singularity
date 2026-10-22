import React, { useEffect, useState } from 'react';
import { Inbox, Store, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import SupplierInvitationsList from './SupplierInvitationsList';
import SupplierInvitationDetail from './SupplierInvitationDetail';
import SupplierCatalogPanel from './SupplierCatalogPanel';

const GOLD = '#C9A24A';

type Tab = 'invitations' | 'catalog';

const SupplierShell: React.FC = () => {
  const { user, setCurrentView } = useAppContext();
  const [tab, setTab] = useState<Tab>('invitations');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('service_providers').select('business_name').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setHasProfile(!!data);
        setBusinessName(data?.business_name || '');
        setCheckingProfile(false);
      });
  }, [user?.id]);

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFAF7' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#FAFAF7' }}>
        <div className="max-w-sm text-center">
          <Store className="w-8 h-8 mx-auto mb-4" style={{ color: GOLD }} />
          <h2 className="text-lg font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
            Complete Your Registration
          </h2>
          <p className="text-xs text-gray-400 mb-5">
            Set up your supplier profile to start receiving and responding to quote requests.
          </p>
          <button
            onClick={() => setCurrentView('service-provider-registration')}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: GOLD }}
          >
            Complete Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
            {businessName || 'Supplier Dashboard'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
        </div>

        <div className="flex items-center gap-2 mb-6 border-b" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          {([
            { key: 'invitations' as Tab, label: 'My Invitations', icon: Inbox },
            { key: 'catalog' as Tab, label: 'Profile & Catalog', icon: Store },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedBatchId(null); }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: tab === t.key ? GOLD : 'transparent',
                color: tab === t.key ? GOLD : '#999',
              }}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
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
