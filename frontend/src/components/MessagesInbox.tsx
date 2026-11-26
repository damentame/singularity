import React, { useEffect, useState } from 'react';
import { MessageCircle, Loader2, ArrowLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { getMyConversations, ConversationSummary } from '@/lib/rfqMessagesApi';
import RFQMessageThread from '@/components/RFQMessageThread';

const GOLD = '#C9A24A';
const POLL_MS = 30000;

interface MessagesInboxProps {
  role: 'coordinator' | 'supplier';
}

function relativeTime(iso: string): string {
  if (!iso) return '';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** A single, role-agnostic conversation list. The data layer (getMyConversations) already
 *  branches on role for RLS/unread-column reasons; everything from here down just renders
 *  whichever fields make sense per role - which label is "who" (the other supplier, for a
 *  coordinator) vs "what" (the quote/date, for a supplier, since they already know who the
 *  coordinator is). Opening a row goes straight to the thread (RFQMessageThread already
 *  supports both modes) rather than any richer per-batch screen - this is specifically the
 *  "read and reply to messages" entry point; accept/decline/pricing stays in My Invitations. */
const MessagesInbox: React.FC<MessagesInboxProps> = ({ role }) => {
  const { user, setCurrentView } = useAppContext();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBatchId, setOpenBatchId] = useState<string | null>(null);

  const load = () => {
    getMyConversations(role).then(data => {
      setConversations(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const openConversation = conversations.find(c => c.batch.id === openBatchId) || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF7' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => setCurrentView(role === 'supplier' ? 'provider-dashboard' : 'coordinator-dashboard')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <h1 className="text-xl font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
          Messages
        </h1>
        <p className="text-xs text-gray-400 mb-6">
          {role === 'supplier'
            ? 'Every conversation with coordinators who have invited you to quote.'
            : 'Every conversation with your suppliers.'}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
            <p className="text-sm text-gray-400">No conversations yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(c => {
              const ctx = c.batch.eventContext || {};
              const title = role === 'supplier' ? (ctx.quoteNumber || 'Quote Request') : c.batch.supplierName;
              const subtitle = role === 'supplier'
                ? [ctx.city, ctx.country].filter(Boolean).join(', ') || 'Location TBC'
                : (ctx.quoteNumber || 'General enquiry');
              const last = c.lastMessage;
              const prefix = !last ? '' : last.senderType === 'system' ? '' : last.senderType === role ? 'You: ' : '';

              return (
                <button
                  key={c.batch.id}
                  onClick={() => setOpenBatchId(c.batch.id)}
                  className="w-full text-left bg-white rounded-2xl border p-5 transition-all hover:shadow-sm flex items-center gap-4"
                  style={{ borderColor: 'rgba(201,162,74,0.15)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
                    <MessageCircle className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>{title}</span>
                      {c.unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-semibold text-white flex-shrink-0" style={{ backgroundColor: GOLD }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {last ? `${prefix}${last.body}` : 'No messages yet'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-300">{relativeTime(c.lastActivityAt)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1 ml-auto" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openConversation && (
        <RFQMessageThread
          mode={role}
          batchId={openConversation.batch.id}
          supplierName={openConversation.batch.supplierName}
          senderName={user?.name || (role === 'supplier' ? openConversation.batch.supplierName : 'Coordinator')}
          onClose={() => { setOpenBatchId(null); load(); }}
        />
      )}
    </div>
  );
};

export default MessagesInbox;
