import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Clock, Trophy, XCircle } from 'lucide-react';
import { getMyInvitations } from '@/lib/supplierRfqApi';
import { getPortalDataForBatch } from '@/lib/rfqPortalApi';
import { getCurrencySymbol, formatCurrency, COUNTRY_FINANCE_CONFIGS } from '@/data/countryConfig';
import { RFQBatchStatus, RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS } from '@/contexts/EventContext';

const GOLD = '#C9A24A';

interface QuoteRow {
  batchId: string;
  quoteNumber: string;
  date: string;
  location: string;
  status: RFQBatchStatus;
  versionNumber: number;
  totalGross: number;
  currencySymbol: string;
  lastSavedAt: string;
}

// event_context stores the country as an ISO code (e.g. "ZA"), not a display name.
const countryName = (iso: string) => COUNTRY_FINANCE_CONFIGS.find(c => c.countryIso === iso)?.countryName || iso;

const formatDate = (date: string) =>
  date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC';

interface SupplierQuotesPanelProps {
  onOpen: (batchId: string) => void;
}

/** Every invitation this supplier has actually submitted a priced quote on, grouped by where
 *  it stands - pending a coordinator decision, won, or closed out. Invitations that were never
 *  quoted (declined, or still sitting unanswered) belong in My Invitations instead; this is
 *  specifically a record of quotes sent, not every request received. */
const SupplierQuotesPanel: React.FC<SupplierQuotesPanelProps> = ({ onOpen }) => {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const invitations = await getMyInvitations();
      const quoted = invitations.filter(i => i.batch.currentSubmittedVersion > 0);
      const rows = await Promise.all(quoted.map(async (inv) => {
        const data = await getPortalDataForBatch(inv.batch.id);
        if (!data?.latestSubmitted?.totals) return null;
        const ctx = inv.batch.eventContext || {};
        return {
          batchId: inv.batch.id,
          quoteNumber: ctx.quoteNumber || 'Quote Request',
          date: ctx.date || '',
          location: [ctx.city, ctx.country && countryName(ctx.country)].filter(Boolean).join(', '),
          status: inv.batch.status,
          versionNumber: data.latestSubmitted.versionNumber,
          totalGross: data.latestSubmitted.totals.gross,
          currencySymbol: getCurrencySymbol(ctx.currency || 'ZAR'),
          lastSavedAt: inv.batch.lastSupplierSaveAt || '',
        } as QuoteRow;
      }));
      if (!cancelled) {
        setQuotes(
          rows
            .filter((r): r is QuoteRow => !!r)
            .sort((a, b) => (b.lastSavedAt || '').localeCompare(a.lastSavedAt || ''))
        );
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} /></div>;
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
        <p className="text-sm text-gray-400">No quotes submitted yet.</p>
        <p className="text-xs text-gray-400 mt-1">Quotes you submit on invitations will show up here.</p>
      </div>
    );
  }

  const groups = [
    { label: 'Pending Decision', icon: Clock, rows: quotes.filter(q => q.status === 'QUOTED' || q.status === 'REVISED') },
    { label: 'Won', icon: Trophy, rows: quotes.filter(q => q.status === 'ACCEPTED' || q.status === 'LOCKED') },
    { label: 'Closed', icon: XCircle, rows: quotes.filter(q => q.status === 'CANCELLED') },
  ].filter(g => g.rows.length > 0);

  return (
    <div className="space-y-6">
      {groups.map(g => (
        <div key={g.label}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5" style={{ color: GOLD }}>
            <g.icon className="w-3.5 h-3.5" /> {g.label} ({g.rows.length})
          </h3>
          <div className="space-y-2">
            {g.rows.map(q => (
              <button
                key={q.batchId}
                type="button"
                onClick={() => onOpen(q.batchId)}
                className="w-full text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-sm flex items-center justify-between gap-3"
                style={{ borderColor: 'rgba(201,162,74,0.15)' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{q.quoteNumber}</span>
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[q.status] }}>
                      {RFQ_BATCH_STATUS_LABELS[q.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {formatDate(q.date)}{q.location ? ` · ${q.location}` : ''} · v{q.versionNumber}
                  </p>
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#1A1A1A' }}>
                  {formatCurrency(q.totalGross, q.currencySymbol)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SupplierQuotesPanel;
