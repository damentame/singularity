import React, { useMemo, useState, useRef } from 'react';
import {
  ChevronDown, ChevronRight, TrendingUp, Layers, BarChart3,
  DollarSign, Users, Percent, ArrowUpRight, ArrowDownRight,
  Eye, EyeOff, Monitor, Globe, CalendarDays, Lock, ExternalLink,
  FileText, Printer, ArrowRight, Info, X,
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  CostLineItem,
  ItemCategory,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  MOMENT_TYPE_LABELS,
  CalculatedLineItem,
} from '@/contexts/EventContext';
import { getCurrencySymbol } from '@/data/countryConfig';
import { getCountryByCode } from '@/data/countries';


const GOLD = '#C9A24A';

interface FullCostingViewProps {
  event: PlannerEvent;
  onNavigateToMoment?: (momentId: string) => void;
  onGenerateProposal?: () => void;
}

const FullCostingView: React.FC<FullCostingViewProps> = ({ event, onNavigateToMoment, onGenerateProposal }) => {
  const { calculateLineItem, calculateSummary, updateEvent } = useEventContext();
  const [expandedMoments, setExpandedMoments] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'by-moment' | 'by-category'>('by-moment');
  const [presentationMode, setPresentationMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const showPricing = event.showPricing !== false;
  const vatEnabled = event.vatEnabled !== false && event.vatRate > 0;
  const vatName = event.vatName || 'VAT';
  const vatPct = event.vatRate || 0;
  const currSym = getCurrencySymbol(event.billingCurrency || event.currency || 'ZAR');
  const billingCountryObj = getCountryByCode(event.billingCountry || event.country || '');
  const eventCountryObj = getCountryByCode(event.country || '');

  const fmt = (n: number) => `${currSym} ${n.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtDec = (n: number) => `${currSym} ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const moments = event.moments || [];
  const allItems = event.lineItems;
  const overallSummary = calculateSummary(allItems);

  // VAT on client price
  const clientVat = overallSummary.totalClientPrice * vatPct;
  const clientInclVat = overallSummary.totalClientPrice + (vatEnabled ? clientVat : 0);

  const togglePricing = () => {
    updateEvent(event.id, { showPricing: !showPricing });
  };

  const toggleVat = () => {
    updateEvent(event.id, { vatEnabled: !vatEnabled });
  };

  const MOMENT_COLORS: Record<string, string> = {
    welcome_drinks: '#D4AF5A', ceremony: '#8B5CF6', cocktail_hour: '#3B82F6',
    reception: '#C9A24A', dinner: '#059669', after_party: '#EC4899',
    breakfast: '#F59E0B', other: '#6B7280',
  };

  // Aggregate by moment
  interface MomentCostData {
    momentId: string; momentName: string; momentType: string;
    supplierTotal: number; clientTotal: number; margin: number; itemCount: number;
    categories: Record<string, { supplierTotal: number; clientTotal: number; itemCount: number; items: CalculatedLineItem[] }>;
  }

  const momentData = useMemo((): MomentCostData[] => {
    const data: MomentCostData[] = [];
    moments.forEach(m => {
      const items = allItems.filter(li => li.momentId === m.id);
      if (items.length === 0) return;
      const categories: MomentCostData['categories'] = {};
      let supplierTotal = 0, clientTotal = 0;
      items.forEach(li => {
        const calc = calculateLineItem(li);
        supplierTotal += calc.totalSupplierCost;
        clientTotal += calc.clientPrice;
        if (!categories[li.category]) categories[li.category] = { supplierTotal: 0, clientTotal: 0, itemCount: 0, items: [] };
        categories[li.category].supplierTotal += calc.totalSupplierCost;
        categories[li.category].clientTotal += calc.clientPrice;
        categories[li.category].itemCount += 1;
        categories[li.category].items.push(calc);
      });
      data.push({ momentId: m.id, momentName: m.name, momentType: m.momentType, supplierTotal, clientTotal,
        margin: clientTotal > 0 ? ((clientTotal - supplierTotal) / clientTotal) * 100 : 0, itemCount: items.length, categories });
    });
    const unassigned = allItems.filter(li => !li.momentId);
    if (unassigned.length > 0) {
      const categories: MomentCostData['categories'] = {};
      let supplierTotal = 0, clientTotal = 0;
      unassigned.forEach(li => {
        const calc = calculateLineItem(li);
        supplierTotal += calc.totalSupplierCost;
        clientTotal += calc.clientPrice;
        if (!categories[li.category]) categories[li.category] = { supplierTotal: 0, clientTotal: 0, itemCount: 0, items: [] };
        categories[li.category].supplierTotal += calc.totalSupplierCost;
        categories[li.category].clientTotal += calc.clientPrice;
        categories[li.category].itemCount += 1;
        categories[li.category].items.push(calc);
      });
      data.push({ momentId: '__overall__', momentName: 'Unassigned Items', momentType: 'other', supplierTotal, clientTotal,
        margin: clientTotal > 0 ? ((clientTotal - supplierTotal) / clientTotal) * 100 : 0, itemCount: unassigned.length, categories });
    }
    return data;
  }, [moments, allItems, calculateLineItem]);

  // Aggregate by category
  interface CategoryAggregation {
    category: ItemCategory; supplierTotal: number; clientTotal: number; itemCount: number;
    momentBreakdown: { momentId: string; momentName: string; supplierTotal: number; clientTotal: number; itemCount: number }[];
  }

  const categoryData = useMemo((): CategoryAggregation[] => {
    const catMap: Record<string, CategoryAggregation> = {};
    allItems.forEach(li => {
      const calc = calculateLineItem(li);
      const cat = li.category;
      if (!catMap[cat]) catMap[cat] = { category: cat, supplierTotal: 0, clientTotal: 0, itemCount: 0, momentBreakdown: [] };
      catMap[cat].supplierTotal += calc.totalSupplierCost;
      catMap[cat].clientTotal += calc.clientPrice;
      catMap[cat].itemCount += 1;
    });
    Object.keys(catMap).forEach(cat => {
      const momentMap: Record<string, { momentId: string; momentName: string; supplierTotal: number; clientTotal: number; itemCount: number }> = {};
      allItems.filter(li => li.category === cat).forEach(li => {
        const calc = calculateLineItem(li);
        const mId = li.momentId || '__overall__';
        const mName = moments.find(m => m.id === mId)?.name || 'Unassigned';
        if (!momentMap[mId]) momentMap[mId] = { momentId: mId, momentName: mName, supplierTotal: 0, clientTotal: 0, itemCount: 0 };
        momentMap[mId].supplierTotal += calc.totalSupplierCost;
        momentMap[mId].clientTotal += calc.clientPrice;
        momentMap[mId].itemCount += 1;
      });
      catMap[cat].momentBreakdown = Object.values(momentMap);
    });
    return CATEGORY_ORDER.filter(cat => catMap[cat]).map(cat => catMap[cat]);
  }, [allItems, moments, calculateLineItem]);

  const toggleMoment = (id: string) => setExpandedMoments(p => ({ ...p, [id]: !p[id] }));
  const toggleCategory = (cat: string) => setExpandedCategories(p => ({ ...p, [cat]: !p[cat] }));
  const maxMomentClient = Math.max(...momentData.map(m => m.clientTotal), 1);

  const handlePrint = () => window.print();

  // ─── PRESENTATION MODE ─────────────────────────────────────────────────────
  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto print:static print:overflow-visible" ref={printRef}>
        {/* Presentation Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-3 flex items-center justify-between print:hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B5CF6' }}>Presentation Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={togglePricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
              style={{
                borderColor: showPricing ? 'rgba(201,162,74,0.2)' : 'rgba(239,68,68,0.2)',
                color: showPricing ? GOLD : '#EF4444',
              }}>
              {showPricing ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {showPricing ? 'Pricing On' : 'Pricing Off'}
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
              style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}>
              <Printer className="w-3 h-3" /> Print / PDF
            </button>
            <button onClick={() => setPresentationMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
              style={{ borderColor: 'rgba(0,0,0,0.1)', color: '#666' }}>
              <X className="w-3 h-3" /> Exit
            </button>
          </div>
        </div>

        {/* Clean Document Layout */}
        <div className="max-w-4xl mx-auto px-8 py-10 print:p-0 print:max-w-none">
          {/* Document Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <svg viewBox="0 0 100 100" className="w-8 h-8">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={GOLD} strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="28" fill="none" stroke={GOLD} strokeWidth="1" />
                </svg>
                <span className="text-lg font-light" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>The One</span>
              </div>
              <h1 className="text-2xl font-light mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
                Event Costing Overview
              </h1>
              <p className="text-xs text-gray-400">Ref: {event.jobCode} · Version {event.currentVersion}</p>
            </div>
            <div className="text-right text-xs text-gray-500 space-y-1">
              <p>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>{event.guestCount} guests</p>
              {event.date && <p>{new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
            </div>
          </div>

          {/* Grand Total */}
          {showPricing && (
            <div className="mb-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Total</span>
                  <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalSupplierCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Client (excl {vatName})</span>
                  <span className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalClientPrice)}</span>
                </div>
                {vatEnabled && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">{vatName} ({(vatPct * 100).toFixed(0)}%)</span>
                    <span className="text-lg font-medium text-gray-500">{fmt(clientVat)}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Grand Total</span>
                  <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(clientInclVat)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Moment Sections */}
          {momentData.map(md => {
            const color = MOMENT_COLORS[md.momentType] || GOLD;
            const sortedCats = CATEGORY_ORDER.filter(cat => md.categories[cat]);
            const momentVat = md.clientTotal * vatPct;

            return (
              <div key={md.momentId} className="mb-6">
                <div className="flex items-center gap-3 mb-3 pb-2 border-b" style={{ borderColor: `${color}30` }}>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{md.momentName}</h2>
                  <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${color}10`, color }}>
                    {MOMENT_TYPE_LABELS[md.momentType as keyof typeof MOMENT_TYPE_LABELS] || md.momentType}
                  </span>
                  {showPricing && (
                    <span className="ml-auto text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(md.clientTotal)}</span>
                  )}
                </div>

                {sortedCats.map(cat => {
                  const catData = md.categories[cat];
                  if (!catData) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <div className="flex items-center gap-2 mb-1.5 px-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{CATEGORY_LABELS[cat as ItemCategory] || cat}</span>
                        <span className="text-[9px] text-gray-400">({catData.itemCount})</span>
                        {showPricing && <span className="ml-auto text-[10px] font-medium" style={{ color: '#1A1A1A' }}>{fmtDec(catData.clientTotal)}</span>}
                      </div>
                      {catData.items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-1.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                          <span className="text-[11px] text-gray-600 flex-1">{item.name}</span>
                          <span className="text-[10px] text-gray-400">x{item.quantity}</span>
                          {showPricing && (
                            <>
                              <span className="text-[10px] text-gray-400 w-[70px] text-right">{fmtDec(item.totalSupplierCost)}</span>
                              <span className="text-[10px] font-medium w-[70px] text-right" style={{ color: '#1A1A1A' }}>{fmtDec(item.clientPrice)}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Moment subtotal */}
                {showPricing && (
                  <div className="flex items-center justify-between px-4 py-2 mt-1 rounded-lg" style={{ backgroundColor: `${color}06` }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{md.momentName} Subtotal</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{fmt(md.supplierTotal)}</span>
                      <span className="text-xs font-bold" style={{ color: '#1A1A1A' }}>{fmt(md.clientTotal)}</span>
                      {vatEnabled && <span className="text-[10px] text-gray-400">+{vatName}: {fmt(momentVat)}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total Footer */}
          {showPricing && (
            <div className="mt-8 p-6 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-gray-600">Client Total (excl {vatName})</span>
                  <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalClientPrice)}</span>
                </div>
                {vatEnabled && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400 pl-2">{vatName} @ {(vatPct * 100).toFixed(1)}%</span>
                    <span className="text-xs text-gray-500">{fmt(clientVat)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: GOLD }}>Grand Total</span>
                  <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(clientInclVat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400">Per Guest</span>
                  <span className="text-xs text-gray-500">{fmt(event.guestCount > 0 ? clientInclVat / event.guestCount : 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STANDARD VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* READ-ONLY Banner */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(201,162,74,0.03)', border: '1px solid rgba(201,162,74,0.12)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}>
          <Lock className="w-4 h-4" style={{ color: GOLD }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>Read-Only Aggregated View</h3>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>
              Auto-Generated
            </span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            This view is automatically generated from all your Moments. To edit costing, go to the <strong>Moments</strong> tab and open any moment.
            All changes made inside Moments are reflected here in real-time.
          </p>
        </div>
        {onNavigateToMoment && (
          <button
            onClick={() => onNavigateToMoment('__back__')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all hover:shadow-sm flex-shrink-0"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            <ArrowRight className="w-3 h-3" /> Go to Moments
          </button>
        )}
      </div>

      {/* Header + Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
            Full Event Costing
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Aggregated from {momentData.length} moment{momentData.length !== 1 ? 's' : ''} · {allItems.length} line items
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pricing Toggle */}
          <button onClick={togglePricing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
            style={{
              borderColor: showPricing ? 'rgba(201,162,74,0.2)' : 'rgba(239,68,68,0.2)',
              color: showPricing ? GOLD : '#EF4444',
              backgroundColor: showPricing ? 'rgba(201,162,74,0.04)' : 'rgba(239,68,68,0.04)',
            }}>
            {showPricing ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showPricing ? 'Show Pricing' : 'Hide Pricing'}
          </button>

          {/* VAT Toggle */}
          <button onClick={toggleVat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
            style={{
              borderColor: vatEnabled ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.08)',
              color: vatEnabled ? '#22C55E' : '#999',
              backgroundColor: vatEnabled ? 'rgba(34,197,94,0.04)' : 'transparent',
            }}>
            {vatName} {vatEnabled ? 'On' : 'Off'}
          </button>

          {/* Presentation Mode */}
          <button onClick={() => setPresentationMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all"
            style={{ borderColor: 'rgba(139,92,246,0.2)', color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.04)' }}>
            <Monitor className="w-3 h-3" /> Presentation Mode
          </button>

          {/* Generate Proposal */}
          {onGenerateProposal && (
            <button onClick={onGenerateProposal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:shadow-sm"
              style={{ backgroundColor: GOLD, color: '#FFF' }}>
              <FileText className="w-3 h-3" /> Generate Proposal
            </button>
          )}

          {/* View Mode */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
            {(['by-moment', 'by-category'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 rounded-md text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: viewMode === mode ? '#FFF' : 'transparent',
                  color: viewMode === mode ? GOLD : '#999',
                  boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}>
                {mode === 'by-moment' ? 'By Moment' : 'By Category'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grand Total Card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201,162,74,0.2)' }}>
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(201,162,74,0.06) 0%, rgba(201,162,74,0.02) 100%)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(201,162,74,0.12)' }}>
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>Total Event</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium ml-2" style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}>
              <Lock className="w-2.5 h-2.5 inline mr-0.5" />Read-Only
            </span>
          </div>

          {showPricing ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Supplier Total</span>
                  <span className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalSupplierCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Client (excl {vatName})</span>
                  <span className="text-lg font-bold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalClientPrice)}</span>
                </div>
                {vatEnabled && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">{vatName} ({(vatPct * 100).toFixed(0)}%)</span>
                    <span className="text-lg font-medium text-gray-500">{fmt(clientVat)}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                    {vatEnabled ? `Client (incl ${vatName})` : 'Client Total'}
                  </span>
                  <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(clientInclVat)}</span>
                </div>
              </div>

              {/* Margin + Per Guest */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t flex-wrap" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Margin:</span>
                  <span className="text-sm font-bold" style={{ color: overallSummary.grossMarginPercent >= 25 ? '#22C55E' : '#EF4444' }}>
                    {overallSummary.grossMarginPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-gray-400">({fmt(overallSummary.grossMarginValue)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] text-gray-400">{event.guestCount} guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Per Guest:</span>
                  <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                    {fmt(event.guestCount > 0 ? clientInclVat / event.guestCount : 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">{event.billingCurrency || event.currency || 'ZAR'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <EyeOff className="w-8 h-8 mx-auto mb-2" style={{ color: '#DDD' }} />
              <p className="text-sm text-gray-400">Pricing hidden</p>
              <p className="text-[10px] text-gray-300 mt-1">Toggle pricing to view financial details</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── BY MOMENT VIEW ─── */}
      {viewMode === 'by-moment' && (
        <div className="space-y-3">
          {momentData.length === 0 && (
            <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
              <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
              <p className="text-sm text-gray-400">No costing data yet</p>
              <p className="text-[10px] text-gray-300 mt-1">Add line items inside each Moment to see the full event costing here.</p>
              {onNavigateToMoment && (
                <button onClick={() => onNavigateToMoment('__back__')}
                  className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-[10px] font-medium transition-all"
                  style={{ backgroundColor: GOLD, color: '#FFF' }}>
                  <ArrowRight className="w-3 h-3" /> Go to Moments
                </button>
              )}
            </div>
          )}

          {momentData.map(md => {
            const isExpanded = expandedMoments[md.momentId];
            const color = MOMENT_COLORS[md.momentType] || GOLD;
            const barWidth = (md.clientTotal / maxMomentClient) * 100;
            const sortedCats = CATEGORY_ORDER.filter(cat => md.categories[cat]);
            const momentVat = md.clientTotal * vatPct;

            return (
              <div key={md.momentId} className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid rgba(201,162,74,0.1)' }}>
                <button onClick={() => toggleMoment(md.momentId)} className="w-full px-5 py-4 flex items-center gap-4 transition-colors hover:bg-gray-50/50">
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color }} /> : <ChevronRight className="w-4 h-4" style={{ color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{md.momentName}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium" style={{ backgroundColor: `${color}10`, color }}>
                        {MOMENT_TYPE_LABELS[md.momentType as keyof typeof MOMENT_TYPE_LABELS] || md.momentType}
                      </span>
                      <span className="text-[10px] text-gray-400">{md.itemCount} items</span>
                      {/* Edit in Moment link */}
                      {onNavigateToMoment && md.momentId !== '__overall__' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToMoment(md.momentId); }}
                          className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md transition-colors hover:bg-gray-100 ml-1"
                          style={{ color: '#3B82F6' }}
                          title="Edit in Moment"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Edit
                        </button>
                      )}
                    </div>
                    {showPricing && (
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.6 }} />
                      </div>
                    )}
                  </div>
                  {showPricing && (
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Supplier</span>
                        <span className="text-xs text-gray-500">{fmt(md.supplierTotal)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Client</span>
                        <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(md.clientTotal)}</span>
                      </div>
                      {vatEnabled && (
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 block">{vatName}</span>
                          <span className="text-xs text-gray-400">{fmt(momentVat)}</span>
                        </div>
                      )}
                      <div className="text-right min-w-[50px]">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Margin</span>
                        <span className="text-xs font-semibold" style={{ color: md.margin >= 25 ? '#22C55E' : '#F59E0B' }}>
                          {md.margin.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    {sortedCats.map(cat => {
                      const catData = md.categories[cat];
                      if (!catData) return null;
                      const catMargin = catData.clientTotal > 0 ? ((catData.clientTotal - catData.supplierTotal) / catData.clientTotal) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center gap-4 px-5 py-2.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.03)', backgroundColor: '#FAFAF7' }}>
                            <div className="w-4" />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{CATEGORY_LABELS[cat as ItemCategory] || cat}</span>
                              <span className="text-[9px] text-gray-400">({catData.itemCount})</span>
                            </div>
                            {showPricing && (
                              <div className="flex items-center gap-6 flex-shrink-0">
                                <span className="text-[10px] text-gray-400 w-[80px] text-right">{fmtDec(catData.supplierTotal)}</span>
                                <span className="text-[10px] font-medium w-[80px] text-right" style={{ color: '#1A1A1A' }}>{fmtDec(catData.clientTotal)}</span>
                                <span className="text-[10px] font-medium w-[50px] text-right" style={{ color: catMargin >= 25 ? '#22C55E' : '#F59E0B' }}>{catMargin.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                          {catData.items.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.02)' }}>
                              <div className="w-4" />
                              <div className="flex-1 flex items-center gap-2 pl-4">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" style={{ border: '1px solid rgba(201,162,74,0.1)' }} />
                                ) : (
                                  <div className="w-6 h-6 rounded flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.04)' }} />
                                )}
                                <span className="text-[11px] text-gray-600 truncate">{item.name}</span>
                                {item.isGuestDependent && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-400 flex-shrink-0">auto</span>}
                                <span className="text-[10px] text-gray-400 flex-shrink-0">x{item.quantity}</span>
                              </div>
                              {showPricing && (
                                <div className="flex items-center gap-6 flex-shrink-0">
                                  <span className="text-[10px] text-gray-400 w-[80px] text-right">{fmtDec(item.totalSupplierCost)}</span>
                                  <span className="text-[10px] font-medium w-[80px] text-right" style={{ color: '#1A1A1A' }}>{fmtDec(item.clientPrice)}</span>
                                  <span className="text-[10px] w-[50px] text-right" style={{ color: item.marginPercent >= 25 ? '#22C55E' : '#F59E0B' }}>{item.marginPercent.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {/* Moment footer */}
                    {showPricing && (
                      <div className="flex items-center gap-4 px-5 py-3" style={{ backgroundColor: `${color}06` }}>
                        <div className="w-4" />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{md.momentName} Total</span>
                          {vatEnabled && (
                            <span className="text-[9px] text-gray-400">
                              +{vatName}: {fmt(momentVat)} = {fmt(md.clientTotal + momentVat)} incl
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <span className="text-xs text-gray-500 w-[80px] text-right font-medium">{fmt(md.supplierTotal)}</span>
                          <span className="text-xs font-bold w-[80px] text-right" style={{ color: '#1A1A1A' }}>{fmt(md.clientTotal)}</span>
                          <span className="text-xs font-bold w-[50px] text-right" style={{ color: md.margin >= 25 ? '#22C55E' : '#F59E0B' }}>{md.margin.toFixed(0)}%</span>
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

      {/* ─── BY CATEGORY VIEW ─── */}
      {viewMode === 'by-category' && (
        <div className="space-y-3">
          {categoryData.length === 0 && (
            <div className="text-center py-12 rounded-xl border" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
              <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: '#DDD' }} />
              <p className="text-sm text-gray-400">No costing data yet</p>
            </div>
          )}

          {showPricing && categoryData.length > 0 && (
            <div className="flex items-center gap-4 px-5 py-2">
              <div className="w-4" />
              <div className="flex-1"><span className="text-[9px] uppercase tracking-wider text-gray-400">Category</span></div>
              <div className="flex items-center gap-6 flex-shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 w-[80px] text-right">Supplier</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 w-[80px] text-right">Client</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 w-[50px] text-right">Margin</span>
              </div>
            </div>
          )}

          {categoryData.map(cd => {
            const isExpanded = expandedCategories[cd.category];
            const catMargin = cd.clientTotal > 0 ? ((cd.clientTotal - cd.supplierTotal) / cd.clientTotal) * 100 : 0;
            const maxCatClient = Math.max(...categoryData.map(c => c.clientTotal), 1);
            const barWidth = (cd.clientTotal / maxCatClient) * 100;
            return (
              <div key={cd.category} className="rounded-xl overflow-hidden bg-white" style={{ border: '1px solid rgba(201,162,74,0.1)' }}>
                <button onClick={() => toggleCategory(cd.category)} className="w-full px-5 py-3.5 flex items-center gap-4 transition-colors hover:bg-gray-50/50">
                  <div className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: GOLD }} /> : <ChevronRight className="w-4 h-4" style={{ color: GOLD }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>{CATEGORY_LABELS[cd.category] || cd.category}</span>
                      <span className="text-[10px] text-gray-400">({cd.itemCount} items)</span>
                    </div>
                    {showPricing && (
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: GOLD, opacity: 0.4 }} />
                      </div>
                    )}
                  </div>
                  {showPricing && (
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className="text-xs text-gray-500 w-[80px] text-right">{fmt(cd.supplierTotal)}</span>
                      <span className="text-sm font-semibold w-[80px] text-right" style={{ color: '#1A1A1A' }}>{fmt(cd.clientTotal)}</span>
                      <span className="text-xs font-semibold w-[50px] text-right" style={{ color: catMargin >= 25 ? '#22C55E' : '#F59E0B' }}>{catMargin.toFixed(0)}%</span>
                    </div>
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    {cd.momentBreakdown.map((mb, idx) => (
                      <div key={idx} className="flex items-center gap-4 px-5 py-2.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                        <div className="w-4" />
                        <div className="flex-1 flex items-center gap-2 pl-2">
                          <Layers className="w-3 h-3 text-gray-300" />
                          <span className="text-[11px] text-gray-600">{mb.momentName}</span>
                          <span className="text-[9px] text-gray-400">({mb.itemCount} items)</span>
                          {onNavigateToMoment && mb.momentId !== '__overall__' && (
                            <button
                              onClick={() => onNavigateToMoment(mb.momentId)}
                              className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md transition-colors hover:bg-gray-100 ml-1"
                              style={{ color: '#3B82F6' }}
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Edit
                            </button>
                          )}
                        </div>
                        {showPricing && (
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <span className="text-[10px] text-gray-400 w-[80px] text-right">{fmtDec(mb.supplierTotal)}</span>
                            <span className="text-[10px] font-medium w-[80px] text-right" style={{ color: '#1A1A1A' }}>{fmtDec(mb.clientTotal)}</span>
                            <span className="w-[50px]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cost Distribution Chart */}
      {showPricing && momentData.length > 1 && (
        <div className="rounded-xl bg-white p-5" style={{ border: '1px solid rgba(201,162,74,0.1)' }}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
            <Percent className="w-3 h-3 inline mr-1" /> Cost Distribution by Moment
          </h3>
          <div className="flex items-end gap-1 h-32">
            {momentData.map(md => {
              const pct = overallSummary.totalClientPrice > 0 ? (md.clientTotal / overallSummary.totalClientPrice) * 100 : 0;
              const color = MOMENT_COLORS[md.momentType] || GOLD;
              return (
                <div key={md.momentId} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: color, opacity: 0.7, minHeight: '4px' }} />
                  <span className="text-[8px] text-gray-400 truncate w-full text-center mt-1">{md.momentName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Total Footer with VAT */}
      {showPricing && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,162,74,0.2)' }}>
          <div className="px-6 py-4 space-y-2" style={{ background: 'linear-gradient(135deg, rgba(201,162,74,0.08) 0%, rgba(201,162,74,0.03) 100%)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                Client Total (excl {vatName})
              </span>
              <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(overallSummary.totalClientPrice)}</span>
            </div>

            {vatEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 pl-2">{vatName} @ {(vatPct * 100).toFixed(1)}%</span>
                <span className="text-xs text-gray-500">{fmt(clientVat)}</span>
              </div>
            )}

            {vatEnabled && (
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                  Client Total (incl {vatName})
                </span>
                <span className="text-base font-bold" style={{ color: '#1A1A1A' }}>{fmt(clientInclVat)}</span>
              </div>
            )}

            <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.15)' }} />

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Event Grand Total</span>
              <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(clientInclVat)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{allItems.length} items across {momentData.length} moment{momentData.length !== 1 ? 's' : ''}</span>
              <span className="text-xs font-bold" style={{ color: overallSummary.grossMarginPercent >= 25 ? '#22C55E' : '#EF4444' }}>
                Margin: {overallSummary.grossMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Data Flow Reminder */}
      <div className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: 'rgba(201,162,74,0.02)', border: '1px solid rgba(201,162,74,0.08)' }}>
        <Info className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
        <p className="text-[10px] text-gray-500">
          <strong>Data flow:</strong> Moment → Line Items → Totals → Full Costing → Proposal. 
          All financial data originates from Moments. No duplicate data entry needed.
        </p>
      </div>
    </div>
  );
};

export default FullCostingView;
