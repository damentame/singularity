import React, { useState, useMemo } from 'react';
import {
  Send, X, ChevronDown, ChevronRight, Trash2, Package, Users,
  Shield, FileText, Loader2, CheckCircle2, AlertCircle, Mail,
  Eye, EyeOff, Edit3, Globe, CalendarDays, Hash,
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  CostLineItem,
  SupplierAssignment,
  CATEGORY_LABELS,
  ItemCategory,
  EVENT_TYPE_LABELS,
  getEventDisplayName,
} from '@/contexts/EventContext';
import { createRFQBatch, updateBatchStatus, getPortalUrl } from '@/data/rfqStore';
import { getCurrencySymbol } from '@/data/countryConfig';
import { getCountryByCode } from '@/data/countries';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

interface SupplierBundle {
  supplierKey: string;
  supplierName: string;
  supplierEmail: string;
  assignments: SupplierAssignment[];
  lineItems: CostLineItem[];
  momentGroups: Record<string, { momentName: string; items: CostLineItem[] }>;
}

// Generate item reference code: JOB-XXXXX-ITEM-XX
const generateItemRefCode = (jobCode: string, index: number): string => {
  const padded = String(index + 1).padStart(2, '0');
  return `${jobCode}-ITEM-${padded}`;
};

interface SupplierQuoteReviewProps {
  event: PlannerEvent;
  onClose: () => void;
}

const SupplierQuoteReview: React.FC<SupplierQuoteReviewProps> = ({ event, onClose }) => {
  const { updateEvent, calculateLineItem } = useEventContext();
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [supplierMessages, setSupplierMessages] = useState<Record<string, string>>({});
  const [sentSuppliers, setSentSuppliers] = useState<Set<string>>(new Set());

  const currSym = getCurrencySymbol(event.billingCurrency || event.currency || 'ZAR');
  const fmt = (n: number) => `${currSym} ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const eventCountryObj = getCountryByCode(event.country || '');
  const locationParts = [event.city, event.region, eventCountryObj?.name].filter(Boolean);
  const locationStr = locationParts.join(', ') || 'TBC';

  // Group pending assignments by supplier
  const bundles = useMemo((): SupplierBundle[] => {
    const pendingAssignments = (event.supplierAssignments || []).filter(
      a => a.status === 'PENDING'
    );

    const supplierMap: Record<string, SupplierBundle> = {};

    pendingAssignments.forEach(assignment => {
      const key = `${assignment.supplierName}|||${assignment.supplierEmail}`.toLowerCase();
      if (!supplierMap[key]) {
        supplierMap[key] = {
          supplierKey: key,
          supplierName: assignment.supplierName,
          supplierEmail: assignment.supplierEmail,
          assignments: [],
          lineItems: [],
          momentGroups: {},
        };
      }
      supplierMap[key].assignments.push(assignment);

      const lineItem = event.lineItems.find(li => li.id === assignment.lineItemId);
      if (lineItem) {
        supplierMap[key].lineItems.push(lineItem);

        // Group by moment
        const momentId = lineItem.momentId || '__overall__';
        const moment = (event.moments || []).find(m => m.id === lineItem.momentId);
        const momentName = moment?.name || 'General';

        if (!supplierMap[key].momentGroups[momentId]) {
          supplierMap[key].momentGroups[momentId] = { momentName, items: [] };
        }
        supplierMap[key].momentGroups[momentId].items.push(lineItem);
      }
    });

    return Object.values(supplierMap).sort((a, b) => b.lineItems.length - a.lineItems.length);
  }, [event.supplierAssignments, event.lineItems, event.moments]);

  const totalItems = bundles.reduce((s, b) => s + b.lineItems.length, 0);

  const toggleSupplier = (key: string) => {
    setExpandedSuppliers(p => ({ ...p, [key]: !p[key] }));
  };

  const removeItemFromBundle = (assignmentId: string) => {
    const updatedAssignments = (event.supplierAssignments || []).filter(a => a.id !== assignmentId);
    updateEvent(event.id, { supplierAssignments: updatedAssignments });
  };

  const removeEntireBundle = (supplierKey: string) => {
    const bundle = bundles.find(b => b.supplierKey === supplierKey);
    if (!bundle) return;
    const assignmentIds = new Set(bundle.assignments.map(a => a.id));
    const updatedAssignments = (event.supplierAssignments || []).filter(a => !assignmentIds.has(a.id));
    updateEvent(event.id, { supplierAssignments: updatedAssignments });
  };

  const sendBundledRFQ = async (bundle: SupplierBundle) => {
    setSending(bundle.supplierKey);

    try {
      // Generate item reference codes
      let globalIdx = 0;
      const bundledItems = bundle.lineItems.map(li => {
        const moment = (event.moments || []).find(m => m.id === li.momentId);
        const refCode = generateItemRefCode(event.jobCode, globalIdx++);
        return {
          refCode,
          name: li.name,
          quantity: li.quantity,
          category: CATEGORY_LABELS[li.category as ItemCategory] || li.category,
          moment: moment?.name || 'General',
          notes: li.notes || li.clientVisibleNotes || '',
        };
      });

      // Create RFQ batch in local store
      const lineItemIds = bundle.lineItems.map(li => li.id);
      const batch = createRFQBatch(
        event,
        bundle.supplierName,
        bundle.supplierEmail,
        lineItemIds,
        supplierMessages[bundle.supplierKey] || ''
      );
      updateBatchStatus(batch.id, 'SENT');

      // Send bundled email via edge function
      try {
        await supabase.functions.invoke('send-rfq-email', {
          body: {
            supplierName: bundle.supplierName,
            supplierEmail: bundle.supplierEmail,
            eventReference: event.jobCode,
            eventType: EVENT_TYPE_LABELS[event.eventType] || event.eventType,
            eventDate: event.date || '',
            eventLocation: locationStr,
            items: bundledItems,
            itemCount: bundledItems.length,
            deadline: '',
            portalUrl: getPortalUrl(batch.portalToken),
            messageToSupplier: supplierMessages[bundle.supplierKey] || '',
            currency: event.billingCurrency || event.currency || 'ZAR',
            vatName: event.vatName || 'VAT',
            vatRate: event.vatRate || 0,
            coordinatorEmail: '',
            coordinatorPhone: '',
          },
        });
        toast({
          title: 'Quote Request Sent',
          description: `Bundled RFQ with ${bundledItems.length} items sent to ${bundle.supplierName}`,
        });
      } catch (emailErr) {
        console.warn('Email send failed:', emailErr);
        toast({
          title: 'RFQ Batch Created',
          description: `Batch saved locally. Email delivery may have failed.`,
        });
      }

      // Update assignments status
      const assignmentIds = new Set(bundle.assignments.map(a => a.id));
      const updatedAssignments = (event.supplierAssignments || []).map(a =>
        assignmentIds.has(a.id) ? { ...a, status: 'QUOTE_RECEIVED' as const, updatedAt: new Date().toISOString() } : a
      );

      // Mark line items as RFQ sent
      const updatedLineItems = event.lineItems.map(li =>
        lineItemIds.includes(li.id) ? { ...li, rfqSent: true, rfqJobCode: event.jobCode } : li
      );

      // Log activity
      const logEntry = {
        id: `log-${Date.now()}`,
        eventId: event.id,
        action: 'BUNDLED_RFQ_SENT',
        details: `Bundled RFQ sent to ${bundle.supplierName} (${bundle.supplierEmail}) — ${bundledItems.length} items`,
        actor: 'Coordinator',
        timestamp: new Date().toISOString(),
      };

      updateEvent(event.id, {
        supplierAssignments: updatedAssignments,
        lineItems: updatedLineItems,
        activityLog: [...(event.activityLog || []), logEntry],
      });

      setSentSuppliers(prev => new Set([...prev, bundle.supplierKey]));
    } catch (err) {
      console.error('Failed to send bundled RFQ:', err);
      toast({ title: 'Error', description: 'Failed to send quote request. Please try again.' });
    } finally {
      setSending(null);
    }
  };

  const sendAllBundles = async () => {
    setSendingAll(true);
    for (const bundle of bundles) {
      if (sentSuppliers.has(bundle.supplierKey)) continue;
      await sendBundledRFQ(bundle);
    }
    setSendingAll(false);
  };

  const unsent = bundles.filter(b => !sentSuppliers.has(b.supplierKey));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(201,162,74,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }}>
              <FileText className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                Review Quote Requests
              </h2>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {bundles.length} supplier{bundles.length !== 1 ? 's' : ''} · {totalItems} items total
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Event Reference Bar */}
        <div className="px-6 py-3 flex items-center gap-4 flex-wrap" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid rgba(201,162,74,0.08)' }}>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3" style={{ color: GOLD }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Event Ref:</span>
            <span className="text-xs font-mono font-bold" style={{ color: '#1A1A1A' }}>{event.jobCode}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500">{event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBC'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] text-gray-500">{locationStr}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <Shield className="w-3 h-3 text-green-500" />
            <span className="text-[9px] text-green-600 font-medium">Client identity protected</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {bundles.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
              <p className="text-sm text-gray-400">No pending quote requests</p>
              <p className="text-[10px] text-gray-300 mt-1">
                Click "Hire" on line items to assign suppliers, then review and send here.
              </p>
            </div>
          ) : (
            bundles.map((bundle) => {
              const isExpanded = expandedSuppliers[bundle.supplierKey] !== false; // default expanded
              const isSent = sentSuppliers.has(bundle.supplierKey);
              const isSending = sending === bundle.supplierKey;

              return (
                <div
                  key={bundle.supplierKey}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isSent ? 'rgba(34,197,94,0.2)' : 'rgba(201,162,74,0.15)'}`,
                    backgroundColor: isSent ? 'rgba(34,197,94,0.02)' : '#FFF',
                    opacity: isSent ? 0.7 : 1,
                  }}
                >
                  {/* Supplier Header */}
                  <button
                    onClick={() => toggleSupplier(bundle.supplierKey)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                        : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                      }
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{bundle.supplierName}</span>
                          {isSent && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">{bundle.supplierEmail}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] font-medium" style={{ color: GOLD }}>
                            {bundle.lineItems.length} item{bundle.lineItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isSent && (
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => removeEntireBundle(bundle.supplierKey)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove entire bundle"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                        </button>
                      </div>
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t px-5 pb-4 pt-3 space-y-3" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                      {/* Items grouped by moment */}
                      {Object.entries(bundle.momentGroups).map(([momentId, group]) => (
                        <div key={momentId}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD }} />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                              {group.momentName}
                            </span>
                            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }} />
                          </div>

                          <div className="space-y-1">
                            {group.items.map((item, idx) => {
                              const calc = calculateLineItem(item);
                              const assignment = bundle.assignments.find(a => a.lineItemId === item.id);
                              const refCode = generateItemRefCode(event.jobCode, bundle.lineItems.indexOf(item));

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
                                  style={{ backgroundColor: '#FAFAF7' }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{item.name}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                        {CATEGORY_LABELS[item.category as ItemCategory] || item.category}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                      <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                                      <span className="text-[9px] font-mono text-gray-300">{refCode}</span>
                                    </div>
                                  </div>

                                  {!isSent && assignment && (
                                    <button
                                      onClick={() => removeItemFromBundle(assignment.id)}
                                      className="p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                                      title="Remove from bundle"
                                    >
                                      <X className="w-3 h-3 text-gray-300 hover:text-red-400" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Message to supplier */}
                      {!isSent && (
                        <div className="pt-2">
                          {editingMessage === bundle.supplierKey ? (
                            <div>
                              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Note to Supplier (optional)</label>
                              <textarea
                                value={supplierMessages[bundle.supplierKey] || ''}
                                onChange={(e) => setSupplierMessages(p => ({ ...p, [bundle.supplierKey]: e.target.value }))}
                                rows={3}
                                placeholder="Any specific notes for this supplier..."
                                className="w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none"
                                style={{ borderColor: 'rgba(201,162,74,0.2)', color: '#1A1A1A' }}
                              />
                              <button
                                onClick={() => setEditingMessage(null)}
                                className="text-[10px] font-medium mt-1" style={{ color: GOLD }}
                              >
                                Done
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingMessage(bundle.supplierKey)}
                              className="flex items-center gap-1.5 text-[10px] font-medium transition-colors hover:opacity-70"
                              style={{ color: '#999' }}
                            >
                              <Edit3 className="w-3 h-3" />
                              {supplierMessages[bundle.supplierKey] ? 'Edit note' : 'Add note to supplier'}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Send Button (per supplier) */}
                      {!isSent && (
                        <div className="pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                          <button
                            onClick={() => sendBundledRFQ(bundle)}
                            disabled={isSending || sendingAll}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-50"
                            style={{ backgroundColor: GOLD, color: '#FFF' }}
                          >
                            {isSending ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Send to {bundle.supplierName}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {bundles.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.1)', backgroundColor: '#FAFAF7' }}>
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[10px] text-gray-400">
                Suppliers will see event reference <span className="font-mono font-bold" style={{ color: '#1A1A1A' }}>{event.jobCode}</span> only — no client details
              </span>
            </div>

            {unsent.length > 0 && (
              <button
                onClick={sendAllBundles}
                disabled={sendingAll || !!sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 hover:shadow-md"
                style={{ backgroundColor: GOLD, color: '#FFF' }}
              >
                {sendingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending All...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send All ({unsent.length} supplier{unsent.length !== 1 ? 's' : ''})
                  </>
                )}
              </button>
            )}

            {unsent.length === 0 && bundles.length > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">All quote requests sent</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierQuoteReview;
