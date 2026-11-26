import React, { useEffect, useState } from 'react';
import { Package, ChevronRight, Loader2, Inbox, MessageCircle, Clock } from 'lucide-react';
import { getMyInvitations, SupplierInvitation } from '@/lib/supplierRfqApi';
import { getUnreadCountsForSupplier } from '@/lib/rfqMessagesApi';
import { RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS } from '@/contexts/EventContext';
import { GOLD, MUTED, TEXT, glassCard, glassCardHover } from './supplierUi';
import { COUNTRY_FINANCE_CONFIGS } from '@/data/countryConfig';

const URGENT_DAYS_THRESHOLD = 5;

interface SupplierInvitationsListProps {
  onOpen: (batchId: string) => void;
}

const formatDate = (date: string) =>
  date ? new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC';

// event_context stores the country as an ISO code (e.g. "ZA"), not a display name.
const countryName = (iso: string) => COUNTRY_FINANCE_CONFIGS.find(c => c.countryIso === iso)?.countryName || iso;

/** Whole days from today until dateStr (negative if already past); null if no date is set. */
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function urgencyLabel(days: number): string {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days left`;
}

const SupplierInvitationsList: React.FC<SupplierInvitationsListProps> = ({ onOpen }) => {
  const [invitations, setInvitations] = useState<SupplierInvitation[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyInvitations(), getUnreadCountsForSupplier()]).then(([data, counts]) => {
      if (cancelled) return;
      setInvitations(data);
      setUnreadCounts(counts);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl" style={glassCard}>
        <Inbox className="w-8 h-8 mx-auto mb-3" style={{ color: 'color-mix(in srgb, var(--pt-primary, #C9A24A) 35%, transparent)' }} />
        <p className="text-sm" style={{ color: MUTED }}>No invitations yet.</p>
        <p className="text-xs mt-1" style={{ color: MUTED, opacity: 0.75 }}>
          When a coordinator requests a quote from you, it'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map(({ batch, itemCount }) => {
        const ctx = batch.eventContext || {};
        const needsResponse = !batch.invitationResponse;
        const unread = unreadCounts[batch.id] || 0;
        const hovered = hoveredId === batch.id;
        // Still needs action from the supplier: either they haven't responded yet, or they
        // accepted but haven't submitted a price yet. Once quoted, declined, or withdrawn,
        // the ball is elsewhere and the date no longer needs to nag them.
        const needsAction = needsResponse || (batch.invitationResponse === 'accepted' && batch.currentSubmittedVersion === 0);
        const days = needsAction ? daysUntil(ctx.date) : null;
        const urgent = days !== null && days <= URGENT_DAYS_THRESHOLD;
        const soon = urgent && days !== null && days <= 2;

        return (
          <button
            key={batch.id}
            onClick={() => onOpen(batch.id)}
            onMouseEnter={() => setHoveredId(batch.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="w-full text-left rounded-2xl p-5 transition-all flex items-center gap-4"
            style={hovered ? glassCardHover : glassCard}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--pt-primary, #C9A24A) 12%, transparent)' }}
            >
              <Package className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold truncate" style={{ color: TEXT }}>
                  {ctx.quoteNumber || 'Quote pending'}
                </span>
                <span
                  className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[batch.status] }}
                >
                  {RFQ_BATCH_STATUS_LABELS[batch.status]}
                </span>
                {(batch.invitationResponse === 'declined' || batch.invitationResponse === 'withdrawn') && (
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: '#9CA3AF' }}>
                    {batch.invitationResponse === 'declined' ? 'Declined' : 'Withdrawn'}
                  </span>
                )}
                {needsResponse && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: '#EF4444' }}>
                    Needs response
                  </span>
                )}
                {batch.invitationResponse === 'accepted' && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: '#22C55E' }}>
                    Accepted
                  </span>
                )}
                {unread > 0 && (
                  <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: GOLD }}>
                    <MessageCircle className="w-2.5 h-2.5" /> {unread}
                  </span>
                )}
                {urgent && days !== null && (
                  <span
                    className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                    style={{ backgroundColor: soon ? '#EF4444' : '#F59E0B' }}
                  >
                    <Clock className="w-2.5 h-2.5" /> {urgencyLabel(days)}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                {formatDate(ctx.date)} · {[ctx.city, ctx.country && countryName(ctx.country)].filter(Boolean).join(', ') || 'Location TBC'} · {itemCount} item{itemCount !== 1 ? 's' : ''}
              </p>
              {batch.currentSubmittedVersion > 0 && (
                <p className="text-[10px] mt-1" style={{ color: GOLD }}>
                  Your quote: v{batch.currentSubmittedVersion}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: MUTED, opacity: 0.5 }} />
          </button>
        );
      })}
    </div>
  );
};

export default SupplierInvitationsList;
