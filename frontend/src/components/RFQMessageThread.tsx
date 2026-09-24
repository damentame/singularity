import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import {
  RFQThreadMessage,
  getMessagesForBatch, sendCoordinatorMessage, markMessagesReadByCoordinator,
  getPortalMessages, postPortalMessage, markPortalMessagesRead,
} from '@/lib/rfqMessagesApi';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const POLL_INTERVAL_MS = 5000;

interface RFQMessageThreadProps {
  mode: 'coordinator' | 'supplier';
  batchId?: string;      // required in coordinator mode
  portalToken?: string;  // required in supplier mode
  senderName: string;    // display name attached to messages this viewer sends
  supplierName: string;  // header label (coordinator mode)
  onClose: () => void;
}

const RFQMessageThread: React.FC<RFQMessageThreadProps> = ({
  mode, batchId, portalToken, senderName, supplierName, onClose,
}) => {
  const [messages, setMessages] = useState<RFQThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (markRead: boolean) => {
      const msgs = mode === 'coordinator'
        ? (batchId ? await getMessagesForBatch(batchId) : [])
        : (portalToken ? await getPortalMessages(portalToken) : []);
      if (cancelled) return;
      setMessages(msgs);
      setLoading(false);
      if (markRead) {
        if (mode === 'coordinator' && batchId) markMessagesReadByCoordinator(batchId);
        if (mode === 'supplier' && portalToken) markPortalMessagesRead(portalToken);
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
        : (portalToken ? await postPortalMessage(portalToken, body) : null);
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

        {/* Composer */}
        <div className="flex items-end gap-2 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <textarea
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
