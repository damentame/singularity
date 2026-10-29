import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, Check, X, Loader2, Send, Package } from 'lucide-react';
import { getPortalDataForBatch, saveQuoteForBatch, PortalData } from '@/lib/rfqPortalApi';
import { respondToInvitation } from '@/lib/supplierRfqApi';
import { sendSystemMessage } from '@/lib/rfqMessagesApi';
import { RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS, SupplierQuoteVersionItem } from '@/contexts/EventContext';
import { getCurrencySymbol, formatCurrency } from '@/data/countryConfig';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import RFQMessageThread from '@/components/RFQMessageThread';

const GOLD = '#C9A24A';

interface SupplierInvitationDetailProps {
  batchId: string;
  onBack: () => void;
}

interface ItemDraft {
  unitPrice: string;
  includesVat: boolean;
  leadTimeDays: string;
  availabilityNotes: string;
}

const emptyDraft = (defaultIncVat: boolean): ItemDraft => ({
  unitPrice: '', includesVat: defaultIncVat, leadTimeDays: '', availabilityNotes: '',
});

const formatDate = (date: string) =>
  date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC';

const SupplierInvitationDetail: React.FC<SupplierInvitationDetailProps> = ({ batchId, onBack }) => {
  const { user } = useAppContext();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [prices, setPrices] = useState<Record<string, ItemDraft>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const load = async () => {
    const result = await getPortalDataForBatch(batchId);
    setData(result);
    setLoading(false);
    if (result) {
      const defaultIncVat = result.batch.eventContext?.defaultPricesIncludeVat ?? true;
      const source = result.latestDraft || result.latestSubmitted;
      const next: Record<string, ItemDraft> = {};
      result.batchItems.forEach(bi => {
        const match = source?.items.find(it => it.rfqBatchItemId === bi.id);
        next[bi.id] = match ? {
          unitPrice: String(match.supplierUnitPriceInput),
          includesVat: match.supplierPriceIncludesVat,
          leadTimeDays: match.leadTimeDays ? String(match.leadTimeDays) : '',
          availabilityNotes: match.availabilityNotes,
        } : emptyDraft(defaultIncVat);
      });
      setPrices(next);
      setNotes(source?.supplierNotes || '');
    }
  };

  useEffect(() => { load(); }, [batchId]);

  const ctx = data?.batch.eventContext || {};
  const currSym = getCurrencySymbol(ctx.currency || 'ZAR');
  const isLocked = data ? ['ACCEPTED', 'LOCKED', 'CANCELLED'].includes(data.batch.status) : false;

  const totals = useMemo(() => {
    if (!data) return { net: 0, vat: 0, gross: 0 };
    let net = 0, vat = 0, gross = 0;
    data.batchItems.forEach(bi => {
      const p = prices[bi.id];
      if (!p || !p.unitPrice) return;
      const price = parseFloat(p.unitPrice) || 0;
      const vatRate = ctx.vatRate ?? 0.15;
      const lineGross = p.includesVat ? price * bi.qtySnapshot : price * bi.qtySnapshot * (1 + vatRate);
      const lineNet = p.includesVat ? lineGross / (1 + vatRate) : price * bi.qtySnapshot;
      net += lineNet; vat += lineGross - lineNet; gross += lineGross;
    });
    return { net, vat, gross };
  }, [data, prices, ctx.vatRate]);

  const handleRespond = async (response: 'accepted' | 'declined') => {
    setResponding(true);
    const ok = await respondToInvitation(batchId, response);
    if (ok) {
      toast({ title: response === 'accepted' ? 'Invitation accepted' : 'Invitation declined' });
      await load();
    } else {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }
    setResponding(false);
  };

  const buildItems = (): SupplierQuoteVersionItem[] =>
    (data?.batchItems || []).map(bi => {
      const p = prices[bi.id] || emptyDraft(true);
      return {
        rfqBatchItemId: bi.id,
        supplierUnitPriceInput: parseFloat(p.unitPrice) || 0,
        supplierPriceIncludesVat: p.includesVat,
        vatRateUsed: ctx.vatRate ?? 0.15,
        currency: ctx.currency || 'ZAR',
        leadTimeDays: parseInt(p.leadTimeDays, 10) || 0,
        availabilityNotes: p.availabilityNotes,
      };
    });

  const handleSave = async (type: 'DRAFT_SAVE' | 'SUBMITTED') => {
    if (!data) return;

    if (type === 'SUBMITTED') {
      const unpriced = data.batchItems.filter(bi => !(parseFloat(prices[bi.id]?.unitPrice || '') > 0));
      if (unpriced.length > 0) {
        toast({
          title: 'Add a price before submitting',
          description: `Please set a unit price for: ${unpriced.map(bi => bi.itemNameSnapshot).join(', ')}.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const result = await saveQuoteForBatch(batchId, type, buildItems(), notes, ctx.vatRate ?? 0.15, ctx.defaultPricesIncludeVat ?? true);
      if (result) {
        toast({ title: type === 'SUBMITTED' ? 'Quote submitted' : 'Draft saved', description: type === 'SUBMITTED' ? 'The coordinator has been notified in your chat thread.' : undefined });
        if (type === 'SUBMITTED') {
          const sym = getCurrencySymbol(ctx.currency || 'ZAR');
          const verb = result.versionNumber > 1 ? `Revised quote submitted (v${result.versionNumber})` : 'Quote submitted';
          const body = `📄 ${verb}: ${formatCurrency(result.totals.gross, sym)} total (net ${formatCurrency(result.totals.net, sym)} + VAT ${formatCurrency(result.totals.vat, sym)}).`;
          sendSystemMessage(batchId, body);
        }
        await load();
      } else {
        toast({ title: 'Could not save', description: 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} /></div>;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-400">This invitation couldn't be loaded.</p>
        <button onClick={onBack} className="mt-3 text-xs" style={{ color: GOLD }}>Back to My Invitations</button>
      </div>
    );
  }

  const { batch, batchItems } = data;

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> My Invitations
      </button>

      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
              {ctx.quoteNumber || 'Quote Request'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {formatDate(ctx.date)} · {[ctx.city, ctx.country].filter(Boolean).join(', ') || 'Location TBC'}
            </p>
          </div>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[batch.status] }}>
            {RFQ_BATCH_STATUS_LABELS[batch.status]}
          </span>
        </div>

        {batch.messageToSupplier && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Note from the coordinator</p>
            <p className="text-xs text-amber-800 mt-1">{batch.messageToSupplier}</p>
          </div>
        )}

        {batch.status === 'CANCELLED' && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
            <p className="text-xs text-gray-600">This request has been cancelled by the coordinator - no further action is needed.</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMessages(true)}
          className="mt-4 w-full flex items-center justify-between p-3.5 rounded-xl border transition-colors hover:bg-gray-50"
          style={{ borderColor: 'rgba(201,162,74,0.15)' }}
        >
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: '#1A1A1A' }}>
            <MessageCircle className="w-4 h-4" style={{ color: GOLD }} /> Message the Coordinator
          </span>
        </button>
      </div>

      {!batch.invitationResponse && batch.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <p className="text-xs text-gray-500 mb-3">Will you quote on this request?</p>
          <div className="flex gap-2">
            <button
              type="button" disabled={responding} onClick={() => handleRespond('accepted')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#22C55E' }}
            >
              <Check className="w-3.5 h-3.5" /> Accept Invitation
            </button>
            <button
              type="button" disabled={responding} onClick={() => handleRespond('declined')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-red-500 border border-red-200 disabled:opacity-50 hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
          </div>
        </div>
      )}

      {batch.invitationResponse === 'declined' ? (
        <div className="bg-white rounded-2xl border p-6 text-center" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <p className="text-xs text-gray-400">You declined this invitation.</p>
          <button
            type="button" disabled={responding} onClick={() => handleRespond('accepted')}
            className="mt-3 text-xs font-medium disabled:opacity-50"
            style={{ color: GOLD }}
          >
            Changed your mind? Accept instead
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
            <Package className="w-3.5 h-3.5 inline mr-1.5" /> Items ({batchItems.length})
          </h3>

          <div className="space-y-3">
            {batchItems.map(bi => {
              const p = prices[bi.id] || emptyDraft(true);
              return (
                <div key={bi.id} className="p-4 rounded-xl border" style={{ borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FAFAF7' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{bi.itemNameSnapshot}</span>
                    <span className="text-[10px] text-gray-400">Qty: {bi.qtySnapshot}</span>
                  </div>
                  {bi.itemNotesSnapshot && <p className="text-[10px] text-gray-400 mb-2">{bi.itemNotesSnapshot}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Unit Price ({currSym})</label>
                      <input
                        type="number" min="0" step="0.01" disabled={isLocked}
                        value={p.unitPrice}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, unitPrice: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white disabled:bg-gray-100"
                        style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                      />
                    </div>
                    {batch.includeVatInfo && (
                      <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <input
                            type="checkbox" disabled={isLocked} checked={p.includesVat}
                            onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, includesVat: e.target.checked } }))}
                          />
                          Price includes VAT
                        </label>
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Lead Time (days)</label>
                      <input
                        type="number" min="0" disabled={isLocked}
                        value={p.leadTimeDays}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, leadTimeDays: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white disabled:bg-gray-100"
                        style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Availability Notes</label>
                      <input
                        type="text" disabled={isLocked}
                        value={p.availabilityNotes}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, availabilityNotes: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white disabled:bg-gray-100"
                        style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="text-[9px] uppercase tracking-wider text-gray-400 block mb-1">Notes for the coordinator (optional)</label>
            <textarea
              disabled={isLocked} value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white resize-none disabled:bg-gray-100"
              style={{ borderColor: 'rgba(201,162,74,0.2)' }}
            />
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            <div className="text-xs">
              <span className="text-gray-400">Total: </span>
              <span className="font-semibold" style={{ color: '#1A1A1A' }}>
                {currSym} {totals.gross.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
              </span>
              {batch.includeVatInfo && <span className="text-gray-400"> (incl. VAT)</span>}
            </div>
            {!isLocked && (
              <div className="flex gap-2">
                <button
                  type="button" disabled={saving} onClick={() => handleSave('DRAFT_SAVE')}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border disabled:opacity-50"
                  style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
                >
                  Save Draft
                </button>
                <button
                  type="button" disabled={saving} onClick={() => handleSave('SUBMITTED')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: GOLD }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {batch.currentSubmittedVersion > 0 ? 'Submit Revised Quote' : 'Submit Quote'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showMessages && (
        <RFQMessageThread
          mode="supplier"
          batchId={batchId}
          supplierName={batch.supplierName}
          senderName={user?.name || batch.supplierName || 'Supplier'}
          onClose={() => setShowMessages(false)}
        />
      )}
    </div>
  );
};

export default SupplierInvitationDetail;
