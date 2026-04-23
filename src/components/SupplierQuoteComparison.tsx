import React, { useState, useMemo } from 'react';
import {
  BarChart3, Filter, ChevronDown, ChevronRight, CheckCircle2, XCircle,
  TrendingDown, Award, Package, Layers, Tag, Users, ArrowUpDown,
  DollarSign, Percent, Eye, Download, AlertCircle, Clock, Star,
  ArrowDown, ArrowUp, Minus, Check, X, RefreshCw,
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  CostLineItem,
  CATEGORY_LABELS,
  ItemCategory,
  RFQBatchStatus,
  RFQ_BATCH_STATUS_LABELS,
  RFQ_BATCH_STATUS_COLORS,
} from '@/contexts/EventContext';
import {
  getBatchesForEvent,
  getItemsForBatch,
  getLatestSubmitted,
  acceptQuoteVersion,
  applySupplierPricingToEvent,
} from '@/data/rfqStore';

import { getCurrencySymbol, formatCurrency } from '@/data/countryConfig';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplierQuoteData {
  batchId: string;
  supplierName: string;
  supplierEmail: string;
  batchStatus: RFQBatchStatus;
  quoteVersionId: string | null;
  versionNumber: number;
  unitPrice: number | null;
  totalPrice: number | null;
  priceIncludesVat: boolean;
  vatRate: number;
  leadTimeDays: number;
  availabilityNotes: string;
  submittedAt: string;
}

interface LineItemComparison {
  lineItem: CostLineItem;
  momentName: string;
  momentId: string;
  category: string;
  categoryKey: ItemCategory;
  supplierQuotes: SupplierQuoteData[];
  bestPrice: number | null;
  worstPrice: number | null;
  currentUnitCost: number;
  selectedSupplierBatchId: string | null;
}

interface SupplierSummary {
  supplierName: string;
  supplierEmail: string;
  batchId: string;
  batchStatus: RFQBatchStatus;
  itemsQuoted: number;
  totalQuoted: number;
  bestPriceCount: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface SupplierQuoteComparisonProps {
  event: PlannerEvent;
}

const SupplierQuoteComparison: React.FC<SupplierQuoteComparisonProps> = ({ event }) => {
  const { updateEvent } = useEventContext();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterMoment, setFilterMoment] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'savings' | 'category' | 'moment'>('moment');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [acceptedSelections, setAcceptedSelections] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(true);

  const currSym = getCurrencySymbol(event.billingCurrency || event.currency || 'ZAR');
  const fmt = (n: number) => formatCurrency(n, currSym);
  const fmtShort = (n: number) => `${currSym} ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // ─── Build comparison data ─────────────────────────────────────────────────

  const { comparisons, suppliers, allSupplierNames, allMoments, allCategories } = useMemo(() => {
    const batches = getBatchesForEvent(event.id);
    const quotableStatuses: RFQBatchStatus[] = ['QUOTED', 'REVISED', 'ACCEPTED', 'LOCKED', 'SENT'];
    const activeBatches = batches.filter(b => quotableStatuses.includes(b.status));

    // Build supplier list
    const supplierMap: Record<string, SupplierSummary> = {};
    const lineItemQuoteMap: Record<string, SupplierQuoteData[]> = {};

    activeBatches.forEach(batch => {
      const batchItems = getItemsForBatch(batch.id);
      const latestSubmitted = getLatestSubmitted(batch.id);

      const supplierKey = batch.supplierName.toLowerCase();
      if (!supplierMap[supplierKey]) {
        supplierMap[supplierKey] = {
          supplierName: batch.supplierName,
          supplierEmail: batch.supplierEmail,
          batchId: batch.id,
          batchStatus: batch.status,
          itemsQuoted: 0,
          totalQuoted: 0,
          bestPriceCount: 0,
        };
      }

      batchItems.forEach(bi => {
        if (!lineItemQuoteMap[bi.lineItemId]) {
          lineItemQuoteMap[bi.lineItemId] = [];
        }

        let unitPrice: number | null = null;
        let totalPrice: number | null = null;
        let priceIncludesVat = true;
        let vatRate = 0;
        let leadTimeDays = 0;
        let availabilityNotes = '';
        let submittedAt = '';
        let quoteVersionId: string | null = null;
        let versionNumber = 0;

        if (latestSubmitted) {
          const quoteItem = latestSubmitted.items.find(qi => qi.rfqBatchItemId === bi.id);
          if (quoteItem) {
            unitPrice = quoteItem.supplierUnitPriceInput;
            totalPrice = unitPrice * bi.qtySnapshot;
            priceIncludesVat = quoteItem.supplierPriceIncludesVat;
            vatRate = quoteItem.vatRateUsed;
            leadTimeDays = quoteItem.leadTimeDays;
            availabilityNotes = quoteItem.availabilityNotes;
            submittedAt = latestSubmitted.submittedAt;
            quoteVersionId = latestSubmitted.id;
            versionNumber = latestSubmitted.versionNumber;

            supplierMap[supplierKey].itemsQuoted++;
            supplierMap[supplierKey].totalQuoted += totalPrice;
          }
        }

        lineItemQuoteMap[bi.lineItemId].push({
          batchId: batch.id,
          supplierName: batch.supplierName,
          supplierEmail: batch.supplierEmail,
          batchStatus: batch.status,
          quoteVersionId,
          versionNumber,
          unitPrice,
          totalPrice,
          priceIncludesVat,
          vatRate,
          leadTimeDays,
          availabilityNotes,
          submittedAt,
        });
      });
    });

    // Build comparisons
    const comparisons: LineItemComparison[] = [];
    const momentSet = new Set<string>();
    const categorySet = new Set<string>();
    const supplierNameSet = new Set<string>();

    Object.entries(lineItemQuoteMap).forEach(([lineItemId, quotes]) => {
      const lineItem = event.lineItems.find(li => li.id === lineItemId);
      if (!lineItem) return;

      const moment = (event.moments || []).find(m => m.id === lineItem.momentId);
      const momentName = moment?.name || 'General';
      const momentId = lineItem.momentId || '__general__';
      const categoryLabel = CATEGORY_LABELS[lineItem.category as ItemCategory] || lineItem.category;

      momentSet.add(momentId);
      categorySet.add(lineItem.category);
      quotes.forEach(q => supplierNameSet.add(q.supplierName));

      const quotedPrices = quotes.filter(q => q.unitPrice !== null).map(q => q.unitPrice!);
      const bestPrice = quotedPrices.length > 0 ? Math.min(...quotedPrices) : null;
      const worstPrice = quotedPrices.length > 0 ? Math.max(...quotedPrices) : null;

      // Check if this item already has an accepted batch
      const acceptedBatch = batches.find(b => 
        b.status === 'ACCEPTED' && 
        getItemsForBatch(b.id).some(bi => bi.lineItemId === lineItemId)
      );

      comparisons.push({
        lineItem,
        momentName,
        momentId,
        category: categoryLabel,
        categoryKey: lineItem.category as ItemCategory,
        supplierQuotes: quotes,
        bestPrice,
        worstPrice,
        currentUnitCost: lineItem.unitCost,
        selectedSupplierBatchId: acceptedBatch?.id || null,
      });
    });

    // Count best prices per supplier
    comparisons.forEach(comp => {
      if (comp.bestPrice === null) return;
      comp.supplierQuotes.forEach(q => {
        if (q.unitPrice === comp.bestPrice) {
          const key = q.supplierName.toLowerCase();
          if (supplierMap[key]) supplierMap[key].bestPriceCount++;
        }
      });
    });

    const allMoments = Array.from(momentSet).map(id => {
      const m = (event.moments || []).find(m => m.id === id);
      return { id, name: m?.name || 'General' };
    });

    const allCategories = Array.from(categorySet).map(key => ({
      key,
      label: CATEGORY_LABELS[key as ItemCategory] || key,
    }));

    return {
      comparisons,
      suppliers: Object.values(supplierMap),
      allSupplierNames: Array.from(supplierNameSet),
      allMoments,
      allCategories,
    };
  }, [event, refreshKey]);

  // ─── Filtered & sorted comparisons ─────────────────────────────────────────

  const filteredComparisons = useMemo(() => {
    let result = [...comparisons];

    if (filterMoment !== 'all') {
      result = result.filter(c => c.momentId === filterMoment);
    }
    if (filterCategory !== 'all') {
      result = result.filter(c => c.categoryKey === filterCategory);
    }
    if (filterSupplier !== 'all') {
      result = result.filter(c => c.supplierQuotes.some(q => q.supplierName === filterSupplier));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.lineItem.name.localeCompare(b.lineItem.name);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
        case 'moment':
          cmp = a.momentName.localeCompare(b.momentName);
          break;
        case 'savings': {
          const savA = a.bestPrice !== null ? a.currentUnitCost - a.bestPrice : 0;
          const savB = b.bestPrice !== null ? b.currentUnitCost - b.bestPrice : 0;
          cmp = savB - savA;
          break;
        }
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [comparisons, filterMoment, filterCategory, filterSupplier, sortBy, sortDir]);

  // ─── Savings summary ───────────────────────────────────────────────────────

  const savingsSummary = useMemo(() => {
    let currentTotal = 0;
    let bestPriceTotal = 0;
    let itemsWithQuotes = 0;
    let itemsWithMultipleQuotes = 0;

    comparisons.forEach(comp => {
      const quotedPrices = comp.supplierQuotes.filter(q => q.totalPrice !== null);
      if (quotedPrices.length === 0) return;

      itemsWithQuotes++;
      if (quotedPrices.length > 1) itemsWithMultipleQuotes++;

      const currentItemTotal = comp.lineItem.quantity * comp.currentUnitCost;
      currentTotal += currentItemTotal;

      const bestTotal = Math.min(...quotedPrices.map(q => q.totalPrice!));
      bestPriceTotal += bestTotal;
    });

    const potentialSavings = currentTotal - bestPriceTotal;
    const savingsPercent = currentTotal > 0 ? (potentialSavings / currentTotal) * 100 : 0;

    return {
      currentTotal,
      bestPriceTotal,
      potentialSavings,
      savingsPercent,
      itemsWithQuotes,
      itemsWithMultipleQuotes,
      totalSuppliers: suppliers.length,
    };
  }, [comparisons, suppliers]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleAcceptQuote = (lineItemId: string, batchId: string) => {
    const latestSubmitted = getLatestSubmitted(batchId);
    if (!latestSubmitted) {
      toast({ title: 'No Quote Found', description: 'This supplier has not submitted a quote yet.' });
      return;
    }

    // Accept the quote version
    acceptQuoteVersion(batchId, latestSubmitted.id);

    // Apply pricing back to event
    const applied = applySupplierPricingToEvent(batchId, latestSubmitted.id);

    if (applied) {
      // Reload event from localStorage to get updated line items
      const STORAGE_KEY = 'theone_events_v6';
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const events: PlannerEvent[] = JSON.parse(raw);
          const updatedEvent = events.find(e => e.id === event.id);
          if (updatedEvent) {
            updateEvent(event.id, { lineItems: updatedEvent.lineItems });
          }
        }
      } catch {}
    }

    setAcceptedSelections(prev => ({ ...prev, [lineItemId]: batchId }));
    setRefreshKey(k => k + 1);

    const batch = getBatchesForEvent(event.id).find(b => b.id === batchId);
    toast({
      title: 'Quote Accepted',
      description: `${batch?.supplierName}'s pricing applied to the line item.`,
    });
  };

  const handleAcceptAllBestPrices = () => {
    let accepted = 0;
    comparisons.forEach(comp => {
      if (comp.bestPrice === null) return;
      const bestQuote = comp.supplierQuotes.find(q => q.unitPrice === comp.bestPrice && q.quoteVersionId);
      if (bestQuote) {
        handleAcceptQuote(comp.lineItem.id, bestQuote.batchId);
        accepted++;
      }
    });
    toast({
      title: 'Best Prices Applied',
      description: `${accepted} item${accepted !== 1 ? 's' : ''} updated with best supplier prices.`,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Line Item', 'Moment', 'Category', 'Qty', 'Current Unit Cost'];
    const supplierNames = allSupplierNames;
    supplierNames.forEach(s => headers.push(`${s} (Unit)`, `${s} (Total)`));
    headers.push('Best Price', 'Savings');

    const rows = filteredComparisons.map(comp => {
      const row: string[] = [
        comp.lineItem.name,
        comp.momentName,
        comp.category,
        String(comp.lineItem.quantity),
        String(comp.currentUnitCost),
      ];
      supplierNames.forEach(name => {
        const q = comp.supplierQuotes.find(sq => sq.supplierName === name);
        row.push(q?.unitPrice !== null && q?.unitPrice !== undefined ? String(q.unitPrice) : '-');
        row.push(q?.totalPrice !== null && q?.totalPrice !== undefined ? String(q.totalPrice) : '-');
      });
      row.push(comp.bestPrice !== null ? String(comp.bestPrice) : '-');
      const savings = comp.bestPrice !== null ? comp.currentUnitCost - comp.bestPrice : 0;
      row.push(String(savings));
      return row;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quote-comparison-${event.jobCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV Exported', description: 'Quote comparison data downloaded.' });
  };

  // ─── Empty state ───────────────────────────────────────────────────────────

  if (comparisons.length === 0) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />Quote Comparison
          </h2>
        </div>
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(201,162,74,0.2)' }} />
          <h3 className="text-lg font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
            No Quotes to Compare Yet
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            Send RFQ batches to suppliers and wait for their quotes to come in. Once multiple suppliers have quoted on the same items, you'll see a side-by-side comparison here.
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <span className="font-bold" style={{ color: GOLD }}>1</span>
              </div>
              Assign suppliers
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <span className="font-bold" style={{ color: GOLD }}>2</span>
              </div>
              Send RFQs
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
                <span className="font-bold" style={{ color: GOLD }}>3</span>
              </div>
              Compare quotes
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />Quote Comparison Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors hover:bg-black/5"
            style={{ color: '#999' }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors hover:shadow-sm"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
        </div>
      </div>

      {/* ─── Savings Summary Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: '#FAFAF7' }}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Current Total</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{fmtShort(savingsSummary.currentTotal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{savingsSummary.itemsWithQuotes} items quoted</p>
        </div>

        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(34,197,94,0.15)', backgroundColor: 'rgba(34,197,94,0.02)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Best Price Total</span>
          </div>
          <p className="text-lg font-semibold text-green-600">{fmtShort(savingsSummary.bestPriceTotal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">If all best prices selected</p>
        </div>

        <div className="rounded-xl p-4 border" style={{ borderColor: savingsSummary.potentialSavings > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.06)', backgroundColor: savingsSummary.potentialSavings > 0 ? 'rgba(59,130,246,0.02)' : '#FAFAF7' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-3.5 h-3.5" style={{ color: savingsSummary.potentialSavings > 0 ? '#3B82F6' : '#999' }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Potential Savings</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: savingsSummary.potentialSavings > 0 ? '#3B82F6' : '#999' }}>
            {fmtShort(savingsSummary.potentialSavings)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {savingsSummary.savingsPercent > 0 ? `${savingsSummary.savingsPercent.toFixed(1)}% saving` : 'No savings available'}
          </p>
        </div>

        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: '#FAFAF7' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Suppliers</span>
          </div>
          <p className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{savingsSummary.totalSuppliers}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{savingsSummary.itemsWithMultipleQuotes} items with 2+ quotes</p>
        </div>
      </div>

      {/* ─── Accept All Best Prices ───────────────────────────────────────── */}
      {savingsSummary.potentialSavings > 0 && (
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50">
              <TrendingDown className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-700">
                Save {fmtShort(savingsSummary.potentialSavings)} by selecting best prices
              </h3>
              <p className="text-[10px] text-green-600/70 mt-0.5">
                Apply the lowest quoted price for each line item across all suppliers
              </p>
            </div>
          </div>
          <button
            onClick={handleAcceptAllBestPrices}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white transition-all hover:shadow-md"
            style={{ backgroundColor: '#22C55E' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Accept All Best Prices
          </button>
        </div>
      )}

      {/* ─── Supplier Scoreboard ──────────────────────────────────────────── */}
      {suppliers.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid rgba(201,162,74,0.08)' }}>
            <Star className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>Supplier Scoreboard</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
            {suppliers.sort((a, b) => b.bestPriceCount - a.bestPriceCount).map(s => (
              <div key={s.batchId} className="bg-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                  <span className="text-sm font-bold" style={{ color: GOLD }}>{s.supplierName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{s.supplierName}</span>
                    <span
                      className="text-[8px] font-medium px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[s.batchStatus] }}
                    >
                      {RFQ_BATCH_STATUS_LABELS[s.batchStatus]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span>{s.itemsQuoted} items</span>
                    <span>{fmtShort(s.totalQuoted)}</span>
                    {s.bestPriceCount > 0 && (
                      <span className="text-green-500 font-medium flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" /> {s.bestPriceCount} best
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-gray-50/50"
          style={{ backgroundColor: '#FAFAF7', borderBottom: showFilters ? '1px solid rgba(201,162,74,0.08)' : 'none' }}
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" style={{ color: GOLD }} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
              Filters & Sort
            </span>
            {(filterMoment !== 'all' || filterCategory !== 'all' || filterSupplier !== 'all') && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">Active</span>
            )}
          </div>
          {showFilters ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </button>

        {showFilters && (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Moment Filter */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                  <Layers className="w-3 h-3 inline mr-1" />Moment
                </label>
                <select
                  value={filterMoment}
                  onChange={e => setFilterMoment(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-white"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  <option value="all">All Moments</option>
                  {allMoments.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                  <Tag className="w-3 h-3 inline mr-1" />Category
                </label>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-white"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Filter */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                  <Users className="w-3 h-3 inline mr-1" />Supplier
                </label>
                <select
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-white"
                  style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
                >
                  <option value="all">All Suppliers</option>
                  {allSupplierNames.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                  <ArrowUpDown className="w-3 h-3 inline mr-1" />Sort By
                </label>
                <div className="flex gap-1">
                  {[
                    { key: 'moment' as const, label: 'Moment' },
                    { key: 'category' as const, label: 'Category' },
                    { key: 'name' as const, label: 'Name' },
                    { key: 'savings' as const, label: 'Savings' },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => toggleSort(s.key)}
                      className="flex-1 px-1.5 py-1.5 rounded-md text-[9px] font-medium transition-colors"
                      style={{
                        backgroundColor: sortBy === s.key ? 'rgba(201,162,74,0.1)' : 'transparent',
                        color: sortBy === s.key ? GOLD : '#999',
                        border: `1px solid ${sortBy === s.key ? 'rgba(201,162,74,0.2)' : 'transparent'}`,
                      }}
                    >
                      {s.label}
                      {sortBy === s.key && (
                        sortDir === 'asc' ? <ArrowUp className="w-2 h-2 inline ml-0.5" /> : <ArrowDown className="w-2 h-2 inline ml-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear filters */}
            {(filterMoment !== 'all' || filterCategory !== 'all' || filterSupplier !== 'all') && (
              <button
                onClick={() => { setFilterMoment('all'); setFilterCategory('all'); setFilterSupplier('all'); }}
                className="mt-2 text-[10px] font-medium flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ color: GOLD }}
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Comparison Table ─────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid rgba(201,162,74,0.08)' }}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
            Line Item Comparison ({filteredComparisons.length} items)
          </span>
          <span className="text-[10px] text-gray-400">
            {allSupplierNames.length} supplier{allSupplierNames.length !== 1 ? 's' : ''} quoting
          </span>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgba(201,162,74,0.06)' }}>
          {filteredComparisons.map(comp => {
            const isExpanded = expandedItems.has(comp.lineItem.id);
            const savings = comp.bestPrice !== null ? (comp.currentUnitCost - comp.bestPrice) * comp.lineItem.quantity : 0;
            const isAccepted = acceptedSelections[comp.lineItem.id] || comp.selectedSupplierBatchId;
            const quotedSuppliers = comp.supplierQuotes.filter(q => q.unitPrice !== null);

            return (
              <div key={comp.lineItem.id} className="bg-white">
                {/* Row Header */}
                <button
                  onClick={() => toggleExpand(comp.lineItem.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-gray-50/50"
                >
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                  }

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{comp.lineItem.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
                        {comp.category}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {comp.momentName}
                      </span>
                      <span className="text-[9px] text-gray-400">Qty: {comp.lineItem.quantity}</span>
                      {isAccepted && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Accepted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick price comparison */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-gray-400 block">Current</span>
                      <span className="text-xs text-gray-500">{fmtShort(comp.currentUnitCost)}</span>
                    </div>
                    {comp.bestPrice !== null && (
                      <div className="text-right">
                        <span className="text-[9px] text-green-500 block">Best</span>
                        <span className="text-xs font-semibold text-green-600">{fmtShort(comp.bestPrice)}</span>
                      </div>
                    )}
                    {savings > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] text-blue-400 block">Saving</span>
                        <span className="text-xs font-semibold text-blue-500">{fmtShort(savings)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {quotedSuppliers.map((q, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{
                            backgroundColor: q.unitPrice === comp.bestPrice ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.04)',
                            color: q.unitPrice === comp.bestPrice ? '#22C55E' : '#999',
                            border: q.unitPrice === comp.bestPrice ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                          }}
                          title={`${q.supplierName}: ${fmtShort(q.unitPrice!)}`}
                        >
                          {q.supplierName.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Expanded Comparison */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1">
                    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                      {/* Table Header */}
                      <div className="grid gap-px" style={{ backgroundColor: 'rgba(201,162,74,0.06)', gridTemplateColumns: '1fr repeat(auto-fill, minmax(160px, 1fr))' }}>
                        <div className="bg-gray-50 px-3 py-2">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Supplier</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 text-right">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Unit Price</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 text-right">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Total ({comp.lineItem.quantity} units)</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 text-right">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Lead Time</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 text-center">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">Action</span>
                        </div>
                      </div>

                      {/* Current Cost Row */}
                      <div className="grid gap-px" style={{ backgroundColor: 'rgba(201,162,74,0.06)', gridTemplateColumns: '1fr repeat(auto-fill, minmax(160px, 1fr))' }}>
                        <div className="bg-white px-3 py-2.5 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
                            <Minus className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-[10px] text-gray-500 italic">Current estimate</span>
                        </div>
                        <div className="bg-white px-3 py-2.5 text-right">
                          <span className="text-xs text-gray-400">{fmtShort(comp.currentUnitCost)}</span>
                        </div>
                        <div className="bg-white px-3 py-2.5 text-right">
                          <span className="text-xs text-gray-400">{fmtShort(comp.currentUnitCost * comp.lineItem.quantity)}</span>
                        </div>
                        <div className="bg-white px-3 py-2.5 text-right">
                          <span className="text-[10px] text-gray-300">—</span>
                        </div>
                        <div className="bg-white px-3 py-2.5" />
                      </div>

                      {/* Supplier Quote Rows */}
                      {comp.supplierQuotes.map((q, idx) => {
                        const isBest = q.unitPrice !== null && q.unitPrice === comp.bestPrice;
                        const isWorst = q.unitPrice !== null && q.unitPrice === comp.worstPrice && comp.bestPrice !== comp.worstPrice;
                        const isThisAccepted = (acceptedSelections[comp.lineItem.id] === q.batchId) || (comp.selectedSupplierBatchId === q.batchId);
                        const diff = q.unitPrice !== null ? q.unitPrice - comp.currentUnitCost : 0;

                        return (
                          <div
                            key={idx}
                            className="grid gap-px"
                            style={{
                              backgroundColor: 'rgba(201,162,74,0.06)',
                              gridTemplateColumns: '1fr repeat(auto-fill, minmax(160px, 1fr))',
                            }}
                          >
                            <div className={`px-3 py-2.5 flex items-center gap-2 ${isThisAccepted ? 'bg-green-50' : isBest ? 'bg-green-50/50' : 'bg-white'}`}>
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                                style={{
                                  backgroundColor: isBest ? 'rgba(34,197,94,0.15)' : 'rgba(201,162,74,0.08)',
                                  color: isBest ? '#22C55E' : GOLD,
                                }}
                              >
                                {q.supplierName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-medium truncate block" style={{ color: '#1A1A1A' }}>{q.supplierName}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="text-[8px] font-medium px-1 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: RFQ_BATCH_STATUS_COLORS[q.batchStatus] }}
                                  >
                                    {RFQ_BATCH_STATUS_LABELS[q.batchStatus]}
                                  </span>
                                  {q.versionNumber > 0 && (
                                    <span className="text-[9px] text-gray-400">v{q.versionNumber}</span>
                                  )}
                                  {isBest && (
                                    <span className="text-[8px] px-1 py-0.5 rounded-full bg-green-100 text-green-600 font-semibold flex items-center gap-0.5">
                                      <Award className="w-2 h-2" /> BEST
                                    </span>
                                  )}
                                  {isThisAccepted && (
                                    <span className="text-[8px] px-1 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-0.5">
                                      <Check className="w-2 h-2" /> ACCEPTED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className={`px-3 py-2.5 text-right ${isThisAccepted ? 'bg-green-50' : isBest ? 'bg-green-50/50' : 'bg-white'}`}>
                              {q.unitPrice !== null ? (
                                <div>
                                  <span className={`text-xs font-semibold ${isBest ? 'text-green-600' : isWorst ? 'text-red-500' : ''}`} style={{ color: !isBest && !isWorst ? '#1A1A1A' : undefined }}>
                                    {fmtShort(q.unitPrice)}
                                  </span>
                                  {diff !== 0 && (
                                    <span className={`text-[9px] ml-1 ${diff < 0 ? 'text-green-500' : 'text-red-400'}`}>
                                      ({diff < 0 ? '' : '+'}{fmtShort(diff)})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-300 italic">Awaiting quote</span>
                              )}
                            </div>

                            <div className={`px-3 py-2.5 text-right ${isThisAccepted ? 'bg-green-50' : isBest ? 'bg-green-50/50' : 'bg-white'}`}>
                              {q.totalPrice !== null ? (
                                <span className={`text-xs font-medium ${isBest ? 'text-green-600' : ''}`} style={{ color: !isBest ? '#1A1A1A' : undefined }}>
                                  {fmtShort(q.totalPrice)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-300">—</span>
                              )}
                            </div>

                            <div className={`px-3 py-2.5 text-right ${isThisAccepted ? 'bg-green-50' : isBest ? 'bg-green-50/50' : 'bg-white'}`}>
                              {q.leadTimeDays > 0 ? (
                                <span className="text-[10px] text-gray-500">{q.leadTimeDays} days</span>
                              ) : (
                                <span className="text-[10px] text-gray-300">—</span>
                              )}
                            </div>

                            <div className={`px-3 py-2.5 flex items-center justify-center gap-1 ${isThisAccepted ? 'bg-green-50' : isBest ? 'bg-green-50/50' : 'bg-white'}`}>
                              {q.unitPrice !== null && !isThisAccepted && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAcceptQuote(comp.lineItem.id, q.batchId); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium text-white transition-all hover:shadow-sm"
                                  style={{ backgroundColor: '#22C55E' }}
                                  title="Accept this quote"
                                >
                                  <Check className="w-2.5 h-2.5" /> Accept
                                </button>
                              )}
                              {isThisAccepted && (
                                <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" /> Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Availability Notes */}
                    {comp.supplierQuotes.some(q => q.availabilityNotes) && (
                      <div className="mt-3 space-y-1">
                        {comp.supplierQuotes.filter(q => q.availabilityNotes).map((q, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span><strong>{q.supplierName}:</strong> {q.availabilityNotes}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredComparisons.length === 0 && (
          <div className="bg-white text-center py-10">
            <Filter className="w-8 h-8 mx-auto mb-2" style={{ color: '#DDD' }} />
            <p className="text-xs text-gray-400">No items match the current filters.</p>
            <button
              onClick={() => { setFilterMoment('all'); setFilterCategory('all'); setFilterSupplier('all'); }}
              className="mt-2 text-[10px] font-medium" style={{ color: GOLD }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierQuoteComparison;
