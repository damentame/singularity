import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, MessageCircle, Check } from 'lucide-react';
import {
  RFQThreadMessage,
  getMessagesForBatch, sendCoordinatorMessage, markMessagesReadByCoordinator,
  getPortalMessages, postPortalMessage, markPortalMessagesRead,
  sendSupplierMessage, markMessagesReadBySupplier,
  sendSystemMessage,
} from '@/lib/rfqMessagesApi';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const POLL_INTERVAL_MS = 5000;

export interface PendingQuoteSummary {
  versionNumber: number;
  totals: { net: number; vat: number; gross: number };
}

interface RFQMessageThreadProps {
  mode: 'coordinator' | 'supplier';
  batchId?: string;      // required in coordinator mode, or in supplier mode for an authenticated supplier
  portalToken?: string;  // supplier mode, anonymous (no account) path - omit when using batchId instead
  senderName: string;    // display name attached to messages this viewer sends
  supplierName: string;  // header label (coordinator mode)
  onClose: () => void;
  // v17: coordinator-only - lets a submitted quote be approved (or adjustments requested)
  // directly from the thread, instead of only from the Sourcing tab's batch list.
  pendingQuote?: PendingQuoteSummary | null;
  currencySymbol?: string;
  onApproveQuote?: () => void;
}

const RFQMessageThread: React.FC<RFQMessageThreadProps> = ({
  mode, batchId, portalToken, senderName, supplierName, onClose,
  pendingQuote, currencySymbol = '', onApproveQuote,
}) => {
  const [messages, setMessages] = useState<RFQThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (markRead: boolean) => {
      const msgs = mode === 'coordinator'
        ? (batchId ? await getMessagesForBatch(batchId) : [])
        : portalToken
          ? await getPortalMessages(portalToken)
          : (batchId ? await getMessagesForBatch(batchId) : []); // authenticated supplier - RLS scopes this, not this call
      if (cancelled) return;
      setMessages(msgs);
      setLoading(false);
      if (markRead) {
        if (mode === 'coordinator' && batchId) markMessagesReadByCoordinator(batchId);
        if (mode === 'supplier' && portalToken) markPortalMessagesRead(portalToken);
        if (mode === 'supplier' && !portalToken && batchId) markMessagesReadBySupplier(batchId);
      }
    };

    load(true);
    const interval = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [mode, batchId, portalToken]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const sent = mode === 'coordinator'
        ? (batchId ? await sendCoordinatorMessage(batchId, body, senderName) : null)
        : portalToken
          ? await postPortalMessage(portalToken, body)
          : (batchId ? await sendSupplierMessage(batchId, body, senderName) : null);
      if (sent) {
        setMessages(prev => [...prev, sent]);
        setDraft('');
      } else {
        toast({ title: 'Message not sent', description: 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async () => {
    if (!pendingQuote || !batchId || approving) return;
    setApproving(true);
    try {
      onApproveQuote?.();
      const amount = pendingQuote.totals.gross.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
      const sent = await sendSystemMessage(batchId, `✅ Quote v${pendingQuote.versionNumber} approved — ${currencySymbol} ${amount} locked in.`);
      if (sent) setMessages(prev => [...prev, sent]);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestAdjustments = () => {
    setDraft(prev => prev || 'Could you please adjust: ');
    textareaRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        style={{ border: '1px solid rgba(201,162,74,0.15)', height: '560px', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
            <div className="min-w-0">
              <h3 className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>
                {mode === 'coordinator' ? supplierName : 'Coordinator'}
              </h3>
              <p className="text-[10px] text-gray-400">RFQ conversation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-10">No messages yet — say hello.</p>
          ) : (
            messages.map((m) => {
              if (m.senderType === 'system') {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div
                      className="max-w-[90%] rounded-full px-3.5 py-2 text-center"
                      style={{ backgroundColor: 'rgba(201,162,74,0.08)', border: '1px solid rgba(201,162,74,0.2)' }}
                    >
                      <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: '#8A7238' }}>{m.body}</p>
                      <p className="text-[9px] mt-0.5 text-gray-300">
                        {new Date(m.createdAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              }
              const isMine = m.senderType === mode;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[75%] rounded-2xl px-3.5 py-2.5"
                    style={{ backgroundColor: isMine ? GOLD : '#F5F4F0', color: isMine ? '#FFF' : '#1A1A1A' }}
                  >
                    {!isMine && (
                      <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#999' }}>
                        {m.senderName}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    <p className="text-[9px] mt-1" style={{ color: isMine ? 'rgba(255,255,255,0.7)' : '#AAA' }}>
                      {new Date(m.createdAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pending Quote Approval (coordinator only) */}
        {mode === 'coordinator' && pendingQuote && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: 'rgba(201,162,74,0.05)' }}>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: GOLD }}>Awaiting Your Approval</p>
              <p className="text-xs font-medium truncate" style={{ color: '#1A1A1A' }}>
                v{pendingQuote.versionNumber} · {currencySymbol} {pendingQuote.totals.gross.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleRequestAdjustments}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors hover:shadow-sm"
                style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}
              >
                Request Adjustments
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#22C55E' }}
              >
                {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
              </button>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="flex items-end gap-2 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none text-xs rounded-lg border px-3 py-2.5 outline-none max-h-24"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="p-2.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RFQMessageThread;
