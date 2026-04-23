import React, { useState, useMemo } from 'react';
import {
  Send, Plus, ExternalLink, Copy, CheckCircle2, X, ChevronDown, ChevronRight,
  Package, Clock, AlertCircle, Lock, XCircle, FileText
} from 'lucide-react';
import {
  useEventContext, PlannerEvent, CATEGORY_LABELS, ItemCategory,
  RFQ_BATCH_STATUS_LABELS, RFQ_BATCH_STATUS_COLORS, RFQBatch, RFQBatchStatus,
  getEventDisplayName,
} from '@/contexts/EventContext';
import {
  getBatchesForEvent, getItemsForBatch, getQuoteVersionsForBatch,
  createRFQBatch, updateBatchStatus, cancelBatch, acceptQuoteVersion,
  getPortalUrl, isLineItemInActiveBatch, getLatestSubmitted,
} from '@/data/rfqStore';
import { getCurrencySymbol, formatCurrency } from '@/data/countryConfig';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface RFQSourcingPanelProps {
  event: PlannerEvent;
}

const RFQSourcingPanel: React.FC<RFQSourcingPanelProps> = ({ event }) => {
  const { updateEvent } = useEventContext();
  const [showCreate, setShowCreate] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const batches = useMemo(() => getBatchesForEvent(event.id), [event.id, refreshKey]);
  const currSym = getCurrencySymbol(event.currency || 'ZAR');
  const fmt = (n: number) => formatCurrency(n, currSym);

  const availableItems = event.lineItems.filter(li => !isLineItemInActiveBatch(li.id));

  const toggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = () => {
    if (!supplierName.trim() || selectedItems.length === 0) return;
    const batch = createRFQBatch(event, supplierName.trim(), supplierEmail.trim(), selectedItems, message.trim());
    setSupplierName(''); setSupplierEmail(''); setMessage(''); setSelectedItems([]);
    setShowCreate(false);
    setRefreshKey(k => k + 1);

    // Log activity
    const logEntry = {
      id: `log-${Date.now()}`, eventId: event.id, action: 'RFQ_BATCH_CREATED',
      details: `RFQ batch created for ${supplierName.trim()} with ${selectedItems.length} items`,
      actor: 'Coordinator', timestamp: new Date().toISOString(),
    };
    updateEvent(event.id, { activityLog: [...(event.activityLog || []), logEntry] });
    toast({ title: 'RFQ Batch Created', description: `${selectedItems.length} items for ${supplierName.trim()}` });
  };

  const handleSend = (batchId: string) => {
    updateBatchStatus(batchId, 'SENT');
    setRefreshKey(k => k + 1);
    setShowEmailModal(batchId);
    toast({ title: 'RFQ Marked as Sent' });
  };

  const handleAccept = (batchId: string) => {
    const latest = getLatestSubmitted(batchId);
    if (!latest) return;
    acceptQuoteVersion(batchId, latest.id);

    // Lock line items: write accepted prices back
    const items = getItemsForBatch(batchId);
    const updatedLineItems = [...event.lineItems];
    latest.items.forEach(qi => {
      const bi = items.find(b => b.id === qi.rfqBatchItemId);
      if (!bi) return;
      const idx = updatedLineItems.findIndex(li => li.id === bi.lineItemId);
      if (idx >= 0) {
        updatedLineItems[idx] = {
          ...updatedLineItems[idx],
          unitCost: qi.supplierUnitPriceInput,
          supplierPriceIncludesVat: qi.supplierPriceIncludesVat,
          vatRateUsed: qi.vatRateUsed,
        };
      }
    });

    const logEntry = {
      id: `log-${Date.now()}`, eventId: event.id, action: 'RFQ_ACCEPTED',
      details: `Accepted quote v${latest.versionNumber} from batch — ${fmt(latest.totals.gross)}`,
      actor: 'Coordinator', timestamp: new Date().toISOString(),
    };
    updateEvent(event.id, { lineItems: updatedLineItems, activityLog: [...(event.activityLog || []), logEntry] });
    setRefreshKey(k => k + 1);
    toast({ title: 'Quote Accepted', description: `Prices locked into line items.` });
  };

  const handleCancel = (batchId: string) => {
    cancelBatch(batchId);
    setRefreshKey(k => k + 1);
    toast({ title: 'RFQ Cancelled' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <Package className="w-3.5 h-3.5 inline mr-1.5" />Sourcing / RFQ Batches
        </h2>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1 text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}>
          <Plus className="w-3 h-3" /> Create RFQ Batch
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-50 rounded-xl p-5 space-y-4 border" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Name</label>
              <input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Supplier name" className="w-full px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Email</label>
              <input value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} placeholder="supplier@example.com" className="w-full px-3 py-2 text-xs border rounded-lg bg-white" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Message to Supplier (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Any notes for the supplier..." className="w-full px-3 py-2 text-xs border rounded-lg bg-white resize-none" style={{ borderColor: 'rgba(201,162,74,0.2)' }} />
          </div>

          {/* Item Selection */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-2">Select Line Items ({selectedItems.length} selected)</label>
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2 bg-white" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
              {availableItems.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-4">All items are already in active RFQ batches.</p>
              ) : (
                availableItems.map(li => (
                  <label key={li.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedItems.includes(li.id)} onChange={() => toggleItem(li.id)} className="rounded" style={{ accentColor: GOLD }} />
                    <span className="text-xs flex-1">{li.name}</span>
                    <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[li.category as ItemCategory]}</span>
                    <span className="text-[10px] text-gray-400">Qty: {li.quantity}</span>
                  </label>
                ))
              )}
            </div>
            {availableItems.length > 0 && (
              <div className="flex gap-2 mt-1">
                <button onClick={() => setSelectedItems(availableItems.map(li => li.id))} className="text-[10px] font-medium" style={{ color: GOLD }}>Select All</button>
                <button onClick={() => setSelectedItems([])} className="text-[10px] text-gray-400">Clear</button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!supplierName.trim() || selectedItems.length === 0} className="flex-1 py-2 text-xs font-medium text-white rounded-lg disabled:opacity-40" style={{ backgroundColor: GOLD }}>
              Create Batch ({selectedItems.length} items)
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs text-gray-400">Cancel</button>
          </div>
        </div>
      )}

      {/* Batches List */}
      {batches.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.3)' }} />
          <p className="text-xs text-gray-400">No RFQ batches yet. Create one to start sourcing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(batch => {
            const items = getItemsForBatch(batch.id);
            const versions = getQuoteVersionsForBatch(batch.id);
            const latestSubmitted = versions.find(v => v.type === 'SUBMITTED');
            const isExpanded = expandedBatch === batch.id;
            const isActive = !['CANCELLED', 'ACCEPTED', 'LOCKED'].includes(batch.status);

            return (
              <div key={batch.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                <button onClick={() => setExpandedBatch(isExpanded ? null : batch.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} /> : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{batch.supplierName}</span>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[batch.status] }}>
                          {RFQ_BATCH_STATUS_LABELS[batch.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                        <span>{items.length} items</span>
                        {batch.sentAt && <span>Sent: {new Date(batch.sentAt).toLocaleDateString()}</span>}
                        {latestSubmitted && <span>Quoted: v{latestSubmitted.versionNumber} — {fmt(latestSubmitted.totals.gross)}</span>}
                        {batch.lastSupplierSaveAt && <span><Clock className="w-2.5 h-2.5 inline" /> Last save: {new Date(batch.lastSupplierSaveAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {batch.status === 'DRAFT' && (
                        <button onClick={() => handleSend(batch.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-white rounded-lg" style={{ backgroundColor: '#3B82F6' }}>
                          <Send className="w-3 h-3" /> Mark as Sent
                        </button>
                      )}
                      {(batch.status === 'SENT' || batch.status === 'DRAFT') && (
                        <button onClick={() => setShowEmailModal(batch.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg border" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}>
                          <Copy className="w-3 h-3" /> Copy Email Template
                        </button>
                      )}
                      <button onClick={() => window.open(getPortalUrl(batch.portalToken), '_blank')} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg border" style={{ borderColor: 'rgba(201,162,74,0.3)', color: GOLD }}>
                        <ExternalLink className="w-3 h-3" /> Open Portal
                      </button>
                      {(batch.status === 'QUOTED' || batch.status === 'REVISED') && latestSubmitted && (
                        <button onClick={() => handleAccept(batch.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-white rounded-lg" style={{ backgroundColor: '#22C55E' }}>
                          <CheckCircle2 className="w-3 h-3" /> Accept v{latestSubmitted.versionNumber}
                        </button>
                      )}
                      {isActive && (
                        <button onClick={() => handleCancel(batch.id)} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium text-red-500 rounded-lg border border-red-200 hover:bg-red-50">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </div>

                    {/* Portal Link */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
                      <span className="text-[10px] text-gray-400 flex-shrink-0">Portal Link:</span>
                      <code className="text-[10px] font-mono text-gray-600 truncate flex-1">{getPortalUrl(batch.portalToken)}</code>
                      <button onClick={() => copyToClipboard(getPortalUrl(batch.portalToken))} className="p-1 rounded hover:bg-gray-200"><Copy className="w-3 h-3 text-gray-400" /></button>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>Items ({items.length})</h4>
                      <div className="space-y-1">
                        {items.map(bi => {
                          const rfqStatus = batch.status;
                          return (
                            <div key={bi.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: '#FAFAF7' }}>
                              <div className="min-w-0">
                                <span className="text-xs">{bi.itemNameSnapshot}</span>
                                <span className="text-[10px] text-gray-400 ml-2">{bi.categorySnapshot}</span>
                              </div>
                              <span className="text-[10px] text-gray-500">Qty: {bi.qtySnapshot}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quote Versions */}
                    {versions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: GOLD }}>Quote Versions ({versions.filter(v => v.type === 'SUBMITTED').length} submitted)</h4>
                        <div className="space-y-1.5">
                          {versions.filter(v => v.type === 'SUBMITTED').map(qv => (
                            <div key={qv.id} className="flex items-center justify-between p-2.5 rounded-lg border" style={{ borderColor: batch.status === 'ACCEPTED' && qv.versionNumber === batch.currentSubmittedVersion ? '#22C55E' : 'rgba(201,162,74,0.12)', backgroundColor: batch.status === 'ACCEPTED' && qv.versionNumber === batch.currentSubmittedVersion ? '#F0FDF4' : 'white' }}>
                              <div>
                                <span className="text-xs font-medium">v{qv.versionNumber}</span>
                                <span className="text-xs ml-2 font-semibold">{fmt(qv.totals.gross)}</span>
                                <span className="text-[10px] text-gray-400 ml-2">Net: {fmt(qv.totals.net)} + {event.vatName}: {fmt(qv.totals.vat)}</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {qv.submittedAt && new Date(qv.submittedAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Email Template Modal */}
      {showEmailModal && (() => {
        const batch = batches.find(b => b.id === showEmailModal);
        if (!batch) return null;
        const portalUrl = getPortalUrl(batch.portalToken);
        const emailBody = `Dear ${batch.supplierName},\n\nWe would like to request a quotation for an upcoming event.\n\nEvent: ${getEventDisplayName(event)}\nDate: ${event.date || 'TBC'}\nLocation: ${event.city || ''}, ${event.country || ''}\nItems: ${getItemsForBatch(batch.id).length} items\n\nPlease use the secure portal link below to view items and submit your quote:\n${portalUrl}\n\nThis link is long-lived — you can return at any time to update your prices.\n\n${batch.messageToSupplier ? `Note: ${batch.messageToSupplier}\n\n` : ''}Thank you.`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailModal(null)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(201,162,74,0.15)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Email Template</h3>
                <button onClick={() => setShowEmailModal(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">To</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={batch.supplierEmail} className="flex-1 px-3 py-2 text-xs border rounded-lg bg-gray-50" style={{ borderColor: '#EFEFEF' }} />
                  <button onClick={() => copyToClipboard(batch.supplierEmail)} className="p-2 rounded-lg hover:bg-gray-100"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Portal Link</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={portalUrl} className="flex-1 px-3 py-2 text-xs font-mono border rounded-lg bg-gray-50" style={{ borderColor: '#EFEFEF' }} />
                  <button onClick={() => copyToClipboard(portalUrl)} className="p-2 rounded-lg hover:bg-gray-100"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Email Body</label>
                <textarea readOnly value={emailBody} rows={10} className="w-full px-3 py-2 text-xs border rounded-lg bg-gray-50 resize-none" style={{ borderColor: '#EFEFEF' }} />
                <button onClick={() => copyToClipboard(emailBody)} className="mt-2 flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg" style={{ backgroundColor: GOLD, color: '#FFF' }}>
                  <Copy className="w-3 h-3" /> Copy Email Body
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RFQSourcingPanel;
