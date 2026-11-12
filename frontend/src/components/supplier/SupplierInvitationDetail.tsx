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
import { GOLD, MUTED, TEXT, glassCard } from './supplierUi';

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
      const supplierLabel = data?.batch.supplierName || user?.name || 'Supplier';
      const notice = response === 'accepted'
        ? `✅ ${supplierLabel} accepted this invitation and will prepare a quote.`
        : `❌ ${supplierLabel} declined this invitation.`;
      await sendSystemMessage(batchId, notice);
      toast({
        title: response === 'accepted' ? 'Invitation accepted' : 'Invitation declined',
        description: 'The coordinator has been notified.',
      });
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
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: MUTED }}>
        <ArrowLeft className="w-3.5 h-3.5" /> My Invitations
      </button>

      <div className="rounded-2xl p-6" style={glassCard}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}>
              {ctx.quoteNumber || 'Quote Request'}
            </h2>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              {formatDate(ctx.date)} · {[ctx.city, ctx.country].filter(Boolean).join(', ') || 'Location TBC'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[batch.status] }}>
              {RFQ_BATCH_STATUS_LABELS[batch.status]}
            </span>
            {batch.invitationResponse === 'accepted' && (
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#22C55E' }}>
                Invite accepted
              </span>
            )}
          </div>
        </div>

        {batch.messageToSupplier && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--pt-primary, #C9A24A) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--pt-primary, #C9A24A) 28%, transparent)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Note from the coordinator</p>
            <p className="text-xs mt-1" style={{ color: TEXT }}>{batch.messageToSupplier}</p>
          </div>
        )}

        {batch.status === 'CANCELLED' && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--pt-border, #D4CFC6)' }}>
            <p className="text-xs" style={{ color: MUTED }}>This request has been cancelled by the coordinator - no further action is needed.</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMessages(true)}
          className="mt-4 w-full flex items-center justify-between p-3.5 rounded-xl transition-colors"
          style={{ border: '1px solid var(--pt-border, #D4CFC6)', backgroundColor: 'color-mix(in srgb, var(--pt-surface, #FFFCF7) 70%, transparent)' }}
        >
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: TEXT }}>
            <MessageCircle className="w-4 h-4" style={{ color: GOLD }} /> Message the Coordinator
          </span>
        </button>
      </div>

      {!batch.invitationResponse && batch.status !== 'CANCELLED' && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <p className="text-xs mb-3" style={{ color: MUTED }}>Will you quote on this request?</p>
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
        <div className="rounded-2xl p-6 text-center" style={glassCard}>
          <p className="text-xs" style={{ color: MUTED }}>You declined this invitation.</p>
          <button
            type="button" disabled={responding} onClick={() => handleRespond('accepted')}
            className="mt-3 text-xs font-medium disabled:opacity-50"
            style={{ color: GOLD }}
          >
            Changed your mind? Accept instead
          </button>
        </div>
      ) : (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
            <Package className="w-3.5 h-3.5 inline mr-1.5" /> Items ({batchItems.length})
          </h3>

          <div className="space-y-3">
            {batchItems.map(bi => {
              const p = prices[bi.id] || emptyDraft(true);
              return (
                <div key={bi.id} className="p-4 rounded-xl" style={{ border: '1px solid var(--pt-border, #D4CFC6)', backgroundColor: 'color-mix(in srgb, var(--pt-surface, #FFFCF7) 75%, transparent)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{bi.itemNameSnapshot}</span>
                    <span className="text-[10px]" style={{ color: MUTED }}>Qty: {bi.qtySnapshot}</span>
                  </div>
                  {bi.itemNotesSnapshot && <p className="text-[10px] mb-2" style={{ color: MUTED }}>{bi.itemNotesSnapshot}</p>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Unit Price ({currSym})</label>
                      <input
                        type="number" min="0" step="0.01" disabled={isLocked}
                        value={p.unitPrice}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, unitPrice: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-60"
                        style={{ borderColor: 'var(--pt-border, #D4CFC6)', backgroundColor: 'var(--pt-surface, #FFFCF7)' }}
                      />
                    </div>
                    {batch.includeVatInfo && (
                      <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-1.5 text-[10px]" style={{ color: MUTED }}>
                          <input
                            type="checkbox" disabled={isLocked} checked={p.includesVat}
                            onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, includesVat: e.target.checked } }))}
                          />
                          Price includes VAT
                        </label>
                      </div>
                    )}
                    <div>
                      <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Lead Time (days)</label>
                      <input
                        type="number" min="0" disabled={isLocked}
                        value={p.leadTimeDays}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, leadTimeDays: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-60"
                        style={{ borderColor: 'var(--pt-border, #D4CFC6)', backgroundColor: 'var(--pt-surface, #FFFCF7)' }}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Availability Notes</label>
                      <input
                        type="text" disabled={isLocked}
                        value={p.availabilityNotes}
                        onChange={e => setPrices(prev => ({ ...prev, [bi.id]: { ...p, availabilityNotes: e.target.value } }))}
                        className="w-full px-2.5 py-1.5 text-xs border rounded-lg disabled:opacity-60"
                        style={{ borderColor: 'var(--pt-border, #D4CFC6)', backgroundColor: 'var(--pt-surface, #FFFCF7)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="text-[9px] uppercase tracking-wider block mb-1" style={{ color: MUTED }}>Notes for the coordinator (optional)</label>
            <textarea
              disabled={isLocked} value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-xs border rounded-lg resize-none disabled:opacity-60"
              style={{ borderColor: 'var(--pt-border, #D4CFC6)', backgroundColor: 'var(--pt-surface, #FFFCF7)' }}
            />
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t" style={{ borderColor: 'var(--pt-border, #D4CFC6)' }}>
            <div className="text-xs">
              <span style={{ color: MUTED }}>Total: </span>
              <span className="font-semibold" style={{ color: TEXT }}>
                {currSym} {totals.gross.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
              </span>
              {batch.includeVatInfo && <span style={{ color: MUTED }}> (incl. VAT)</span>}
            </div>
            {!isLocked && (
              <div className="flex gap-2">
                <button
                  type="button" disabled={saving} onClick={() => handleSave('DRAFT_SAVE')}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border disabled:opacity-50"
                  style={{ borderColor: 'color-mix(in srgb, var(--pt-primary, #C9A24A) 35%, transparent)', color: GOLD }}
                >
                  Save Draft
                </button>
                <button
                  type="button" disabled={saving} onClick={() => handleSave('SUBMITTED')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{ backgroundColor: GOLD, color: 'var(--pt-on-primary, #FFF)' }}
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
