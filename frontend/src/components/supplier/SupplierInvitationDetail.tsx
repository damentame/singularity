import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, Check, X, Loader2, Send, Package, CalendarDays } from 'lucide-react';
import { getPortalDataForBatch, saveQuoteForBatch, PortalData } from '@/lib/rfqPortalApi';
import { respondToInvitation } from '@/lib/supplierRfqApi';
import { sendSystemMessage } from '@/lib/rfqMessagesApi';
import { RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS, SupplierQuoteVersionItem } from '@/contexts/EventContext';
import { getCurrencySymbol, formatCurrency, COUNTRY_FINANCE_CONFIGS } from '@/data/countryConfig';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';
import RFQMessageThread from '@/components/RFQMessageThread';
import { GOLD, MUTED, TEXT, glassCard } from './supplierUi';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

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

// event_context stores the country as an ISO code (e.g. "ZA"), not a display name.
const countryName = (iso: string) => COUNTRY_FINANCE_CONFIGS.find(c => c.countryIso === iso)?.countryName || iso;

const SupplierInvitationDetail: React.FC<SupplierInvitationDetailProps> = ({ batchId, onBack }) => {
  const { user } = useAppContext();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [prices, setPrices] = useState<Record<string, ItemDraft>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

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

  // Distinct from decline/undo above: withdrawing means the supplier already said yes (and may
  // have already quoted), so unlike a plain accept/decline, the coordinator may be counting on
  // this - worth an explicit chat notice, same as the coordinator-cancels-a-request notice.
  const handleWithdraw = async () => {
    setConfirmWithdraw(false);
    setResponding(true);
    const ok = await respondToInvitation(batchId, 'withdrawn');
    if (ok) {
      sendSystemMessage(batchId, '⚠️ The supplier has withdrawn from this request.');
      toast({ title: 'Withdrawn', description: 'The coordinator has been notified in your chat thread.' });
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

  // Older batches carry a snapshot from before these fields existed - each row only renders
  // when its field is present, so they degrade to whatever the snapshot has.
  const dateRange = ctx.endDate && ctx.endDate !== ctx.date ? `${formatDate(ctx.date)} – ${formatDate(ctx.endDate)}` : formatDate(ctx.date);
  const fullLocation = [ctx.venue, ctx.city, ctx.region, ctx.country && countryName(ctx.country)].filter(Boolean).join(', ');
  const scheduledMoments = batch.includeMomentSpaceContext
    ? (ctx.moments || []).filter((m: any) => m.date || m.startTime)
    : [];
  const eventDetailRows: Array<[string, string]> = [
    ['Event type', ctx.eventType || ''],
    ['Date', ctx.date ? dateRange : ''],
    ['Venue', fullLocation],
    ['Guests', ctx.guestCount ? String(ctx.guestCount) : ''],
    ['Setup', ctx.setupDays ? `${ctx.setupDays} day${ctx.setupDays !== 1 ? 's' : ''} before` : ''],
    ['Breakdown', ctx.strikeDays ? `${ctx.strikeDays} day${ctx.strikeDays !== 1 ? 's' : ''} after` : ''],
  ].filter(([, v]) => v) as Array<[string, string]>;

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
              {formatDate(ctx.date)} · {[ctx.city, ctx.country && countryName(ctx.country)].filter(Boolean).join(', ') || 'Location TBC'}
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

      {/* Event logistics - shown in every response state, and kept current by the coordinator's
          autosave (refreshEventContextForEvent), so later edits to the event reach the supplier.
          General enquiries have no items and show their own Enquiry Details card below instead. */}
      {batchItems.length > 0 && (eventDetailRows.length > 0 || scheduledMoments.length > 0) && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>
            <CalendarDays className="w-3.5 h-3.5 inline mr-1.5" /> Event Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {eventDetailRows.map(([label, value]) => (
              <div key={label}><span className="text-gray-400">{label}: </span><span style={{ color: TEXT }}>{value}</span></div>
            ))}
          </div>
          {scheduledMoments.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Schedule</p>
              {scheduledMoments.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                  <span style={{ color: TEXT }}>{m.name}</span>
                  <span className="text-gray-400 flex-shrink-0">
                    {[m.date && formatDate(m.date), [m.startTime, m.endTime].filter(Boolean).join('–')].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* What's actually being requested - shown regardless of response status, so the supplier
          can see what they'd be quoting on before deciding, not just an Accept/Decline prompt
          with no context behind it. The post-accept pricing form below repeats item names/qty
          next to their price fields, so this is skipped once accepted to avoid showing it twice. */}
      {batchItems.length > 0 && batch.invitationResponse !== 'accepted' && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
            <Package className="w-3.5 h-3.5 inline mr-1.5" /> Items Requested ({batchItems.length})
          </h3>
          <div className="space-y-2">
            {batchItems.map(bi => {
              const moment = batch.includeMomentSpaceContext ? (ctx.moments || []).find((m: any) => m.id === bi.momentIdSnapshot) : null;
              const space = batch.includeMomentSpaceContext ? (ctx.venueSpaces || []).find((s: any) => s.id === bi.spaceIdSnapshot) : null;
              const locationLabel = [moment?.name, space?.name].filter(Boolean).join(' · ');
              return (
                <div key={bi.id} className="p-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--pt-surface, #FFFCF7) 70%, transparent)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{bi.itemNameSnapshot}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">Qty: {bi.qtySnapshot}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {bi.categorySnapshot && <span className="text-[9px] text-gray-400">{bi.categorySnapshot}</span>}
                    {locationLabel && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{locationLabel}</span>}
                  </div>
                  {bi.itemNotesSnapshot && <p className="text-[10px] text-gray-400 mt-1.5">{bi.itemNotesSnapshot}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {batchItems.length === 0 && (ctx.eventType || ctx.guestCount || ctx.budgetRange || (ctx.servicesRequested || []).length > 0) && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3" style={{ color: GOLD }}>Enquiry Details</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {ctx.eventType && (
              <div><span className="text-gray-400">Event type: </span><span style={{ color: TEXT }}>{ctx.eventType}</span></div>
            )}
            {!!ctx.guestCount && (
              <div><span className="text-gray-400">Guests: </span><span style={{ color: TEXT }}>{ctx.guestCount}</span></div>
            )}
            {ctx.budgetRange && (
              <div><span className="text-gray-400">Budget: </span><span style={{ color: TEXT }}>{ctx.budgetRange}</span></div>
            )}
            {(ctx.servicesRequested || []).length > 0 && (
              <div className="col-span-2"><span className="text-gray-400">Services requested: </span><span style={{ color: TEXT }}>{(ctx.servicesRequested || []).join(', ')}</span></div>
            )}
          </div>
        </div>
      )}

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

      {batch.invitationResponse === 'declined' && (
        <div className="rounded-2xl p-6 text-center" style={glassCard}>
          <p className="text-xs text-gray-400">You declined this invitation.</p>
          <button
            type="button" disabled={responding} onClick={() => handleRespond('accepted')}
            className="mt-3 text-xs font-medium disabled:opacity-50"
            style={{ color: GOLD }}
          >
            Changed your mind? Accept instead
          </button>
        </div>
      )}

      {batch.invitationResponse === 'withdrawn' && (
        <div className="rounded-2xl p-6 text-center" style={glassCard}>
          <p className="text-xs text-gray-400">You withdrew from this request.</p>
          {!isLocked && (
            <button
              type="button" disabled={responding} onClick={() => handleRespond('accepted')}
              className="mt-3 text-xs font-medium disabled:opacity-50"
              style={{ color: GOLD }}
            >
              Changed your mind? Resume quoting
            </button>
          )}
        </div>
      )}

      {batch.invitationResponse === 'accepted' && batchItems.length === 0 && (
        <div className="rounded-2xl p-6 text-center" style={glassCard}>
          <p className="text-xs text-gray-400">
            Reply via the message thread above to discuss pricing, scope and availability.
          </p>
          {!isLocked && (
            <button
              type="button" disabled={responding} onClick={() => setConfirmWithdraw(true)}
              className="mt-3 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Withdraw from this request
            </button>
          )}
        </div>
      )}

      {batch.invitationResponse === 'accepted' && batchItems.length > 0 && (
        <div className="rounded-2xl p-6" style={glassCard}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
            <Package className="w-3.5 h-3.5 inline mr-1.5" /> Items ({batchItems.length})
          </h3>

          <div className="space-y-3">
            {batchItems.map(bi => {
              const p = prices[bi.id] || emptyDraft(true);
              const moment = batch.includeMomentSpaceContext ? (ctx.moments || []).find((m: any) => m.id === bi.momentIdSnapshot) : null;
              const space = batch.includeMomentSpaceContext ? (ctx.venueSpaces || []).find((s: any) => s.id === bi.spaceIdSnapshot) : null;
              const locationLabel = [moment?.name, space?.name].filter(Boolean).join(' · ');
              return (
                <div key={bi.id} className="p-4 rounded-xl" style={{ border: '1px solid var(--pt-border, #D4CFC6)', backgroundColor: 'color-mix(in srgb, var(--pt-surface, #FFFCF7) 75%, transparent)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium" style={{ color: TEXT }}>{bi.itemNameSnapshot}</span>
                    <span className="text-[10px]" style={{ color: MUTED }}>Qty: {bi.qtySnapshot}</span>
                  </div>
                  {(bi.categorySnapshot || locationLabel) && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {bi.categorySnapshot && <span className="text-[9px] text-gray-400">{bi.categorySnapshot}</span>}
                      {locationLabel && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{locationLabel}</span>}
                    </div>
                  )}
                  {bi.itemNotesSnapshot && <p className="text-[10px] text-gray-400 mb-2">{bi.itemNotesSnapshot}</p>}
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

          {!isLocked && (
            <div className="mt-3 text-center">
              <button
                type="button" disabled={responding} onClick={() => setConfirmWithdraw(true)}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Withdraw from this request
              </button>
            </div>
          )}
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

      <AlertDialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw from this request?</AlertDialogTitle>
            <AlertDialogDescription>
              The coordinator will be notified in your chat thread. You can resume quoting later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="bg-red-500 hover:bg-red-600">Withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierInvitationDetail;
