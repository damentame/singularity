import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, AlertCircle, Clock, MapPin, MessageSquare
} from 'lucide-react';
import { RFQBatchItem, EventMoment, VenueSpace, MOMENT_TYPE_LABELS } from '@/contexts/EventContext';
import { calculateVatBreakdown, formatCurrency } from '@/data/countryConfig';


const GOLD = '#C9A24A';

export interface ItemPriceEntry {
  rfqBatchItemId: string;
  unitPrice: number;
  includesVat: boolean;
  availabilityNotes: string;
  leadTimeDays: number;
}

interface MomentSectionProps {
  momentKey: string;
  moment?: EventMoment;
  space?: VenueSpace;
  categoryGroups: Record<string, RFQBatchItem[]>;
  prices: Record<string, ItemPriceEntry>;
  onUpdatePrice: (biId: string, unitPrice: number) => void;
  onToggleVat: (biId: string) => void;
  onUpdateAvailability: (biId: string, notes: string) => void;
  onUpdateLeadTime: (biId: string, days: number) => void;
  currencySymbol: string;
  vatName: string;
  vatRate: number;
  defaultIncVat: boolean;
  isLocked: boolean;
  expandedItemId: string | null;
  onToggleItemExpand: (biId: string) => void;
}

const SupplierPortalMomentSection: React.FC<MomentSectionProps> = ({
  momentKey, moment, space, categoryGroups, prices,
  onUpdatePrice, onToggleVat, onUpdateAvailability, onUpdateLeadTime,
  currencySymbol, vatName, vatRate, defaultIncVat, isLocked,
  expandedItemId, onToggleItemExpand,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  // Calculate moment subtotals
  const allItems = Object.values(categoryGroups).flat();
  let momentNet = 0, momentVat = 0, momentGross = 0;
  let pricedCount = 0;
  allItems.forEach(bi => {
    const p = prices[bi.id];
    if (!p || p.unitPrice <= 0) return;
    pricedCount++;
    const total = bi.qtySnapshot * p.unitPrice;
    const vb = calculateVatBreakdown(total, p.includesVat, vatRate);
    momentNet += vb.supplierNet;
    momentVat += vb.vatValue;
    momentGross += vb.supplierGross;
  });

  const sortedCategories = Object.entries(categoryGroups).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      {/* Moment Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
        style={{ backgroundColor: '#FAFAF7' }}
      >
        <div className="flex items-center gap-3">
          {collapsed
            ? <ChevronRight className="w-4 h-4" style={{ color: GOLD }} />
            : <ChevronDown className="w-4 h-4" style={{ color: GOLD }} />
          }
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{momentKey}</span>
              {moment?.momentType && moment.momentType !== 'other' && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'rgba(201,162,74,0.1)', color: GOLD }}>
                  {MOMENT_TYPE_LABELS[moment.momentType]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {moment?.startTime && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {moment.startTime}{moment.endTime ? ` – ${moment.endTime}` : ''}
                </span>
              )}
              {space?.name && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {space.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Items</span>
            <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{pricedCount}/{allItems.length}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Subtotal</span>
            <span className="text-xs font-semibold" style={{ color: GOLD }}>{fmt(momentGross)}</span>
          </div>
        </div>
      </button>

      {!collapsed && sortedCategories.map(([catKey, items]) => {
        const catCollapsed = collapsedCats[catKey];
        const catItemCount = items.length;
        const catPriced = items.filter(bi => (prices[bi.id]?.unitPrice || 0) > 0).length;

        return (
          <div key={catKey}>
            {/* Category Sub-header */}
            <button
              onClick={() => setCollapsedCats(p => ({ ...p, [catKey]: !p[catKey] }))}
              className="w-full flex items-center justify-between px-5 py-2.5 border-t hover:bg-gray-50/30 transition-colors"
              style={{ borderColor: 'rgba(201,162,74,0.08)' }}
            >
              <div className="flex items-center gap-2">
                {catCollapsed
                  ? <ChevronRight className="w-3 h-3 text-gray-400" />
                  : <ChevronDown className="w-3 h-3 text-gray-400" />
                }
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{catKey}</span>
                <span className="text-[9px] text-gray-400">({catPriced}/{catItemCount})</span>
              </div>
            </button>

            {!catCollapsed && (
              <div>
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-5 py-1.5 text-[9px] uppercase tracking-wider text-gray-400 border-t" style={{ borderColor: 'rgba(201,162,74,0.06)' }}>
                  <div className="col-span-4">Item</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Unit Price ({currencySymbol})</div>
                  <div className="col-span-1 text-center">Incl {vatName}?</div>
                  <div className="col-span-1 text-right">Net</div>
                  <div className="col-span-1 text-right">{vatName}</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {items.map(bi => {
                  const p = prices[bi.id] || { unitPrice: 0, includesVat: defaultIncVat, availabilityNotes: '', leadTimeDays: 0 };
                  const total = bi.qtySnapshot * p.unitPrice;
                  const breakdown = calculateVatBreakdown(total, p.includesVat, vatRate);
                  const hasMissing = p.unitPrice <= 0;
                  const isExpanded = expandedItemId === bi.id;

                  return (
                    <div key={bi.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      {/* Main Row */}
                      <div className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-gray-50/30 transition-colors">
                        <div className="col-span-4 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {hasMissing && <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            <button
                              onClick={() => onToggleItemExpand(bi.id)}
                              className="text-xs font-medium text-left truncate hover:underline"
                              style={{ color: '#1A1A1A' }}
                            >
                              {bi.itemNameSnapshot}
                            </button>
                          </div>
                          {bi.itemNotesSnapshot && (
                            <p className="text-[9px] text-gray-400 mt-0.5 truncate">{bi.itemNotesSnapshot}</p>
                          )}
                          {bi.installationLabelSnapshot && (
                            <span className="text-[9px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="w-2.5 h-2.5" /> {bi.installationLabelSnapshot}
                            </span>
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{bi.qtySnapshot}</span>
                          <span className="text-[9px] text-gray-400 block">{bi.unitTypeSnapshot || 'each'}</span>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.unitPrice || ''}
                            onChange={e => onUpdatePrice(bi.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            disabled={isLocked}
                            className="w-full h-8 text-right text-xs rounded-lg border px-2.5 outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-400 focus:ring-1"
                            style={{
                              borderColor: hasMissing ? '#F59E0B' : '#E5E7EB',
                              backgroundColor: hasMissing ? '#FFFBEB' : '#FAFAF7',
                              color: '#1A1A1A',
                            }}
                            onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}40`; }}
                            onBlur={e => { e.target.style.borderColor = hasMissing ? '#F59E0B' : '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => !isLocked && onToggleVat(bi.id)}
                            disabled={isLocked}
                            className="text-[9px] px-2.5 py-1 rounded-md border font-medium transition-all"
                            style={{
                              backgroundColor: p.includesVat ? 'rgba(201,162,74,0.1)' : 'transparent',
                              borderColor: p.includesVat ? GOLD : '#E5E7EB',
                              color: p.includesVat ? GOLD : '#9CA3AF',
                            }}
                          >
                            {p.includesVat ? 'Yes' : 'No'}
                          </button>
                        </div>
                        <div className="col-span-1 text-right text-[10px] text-gray-500">
                          {p.unitPrice > 0 ? fmt(breakdown.supplierNet) : '—'}
                        </div>
                        <div className="col-span-1 text-right text-[10px] text-gray-400">
                          {p.unitPrice > 0 ? fmt(breakdown.vatValue) : '—'}
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-xs font-semibold" style={{ color: p.unitPrice > 0 ? '#1A1A1A' : '#D1D5DB' }}>
                            {p.unitPrice > 0 ? fmt(breakdown.supplierGross) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Detail Row */}
                      {isExpanded && (
                        <div className="px-5 pb-3 pt-0 grid grid-cols-2 gap-3" style={{ backgroundColor: '#FAFAF7' }}>
                          <div>
                            <label className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                              <MessageSquare className="w-3 h-3 inline mr-1" />Availability Notes
                            </label>
                            <textarea
                              value={p.availabilityNotes || ''}
                              onChange={e => onUpdateAvailability(bi.id, e.target.value)}
                              disabled={isLocked}
                              rows={2}
                              placeholder="Stock availability, color options, substitutions..."
                              className="w-full px-3 py-2 text-xs border rounded-lg resize-none disabled:bg-gray-100 focus:outline-none focus:ring-1"
                              style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}40`; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(201,162,74,0.2)'; e.target.style.boxShadow = 'none'; }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                              <Clock className="w-3 h-3 inline mr-1" />Lead Time (Days)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={p.leadTimeDays || ''}
                              onChange={e => onUpdateLeadTime(bi.id, parseInt(e.target.value) || 0)}
                              disabled={isLocked}
                              placeholder="e.g. 14"
                              className="w-full h-8 px-3 text-xs border rounded-lg disabled:bg-gray-100 focus:outline-none focus:ring-1"
                              style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                              onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = `0 0 0 1px ${GOLD}40`; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(201,162,74,0.2)'; e.target.style.boxShadow = 'none'; }}
                            />
                            {bi.itemNotesSnapshot && (
                              <div className="mt-2 p-2 rounded-md bg-amber-50 border border-amber-100">
                                <span className="text-[9px] font-semibold text-amber-600 block mb-0.5">Specifications</span>
                                <p className="text-[10px] text-amber-800">{bi.itemNotesSnapshot}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Moment Subtotal Footer */}
      {!collapsed && allItems.length > 0 && (
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(201,162,74,0.12)', backgroundColor: '#FAFAF7' }}>
          <span className="text-[10px] font-medium text-gray-500">{momentKey} Subtotal</span>
          <div className="flex items-center gap-5 text-right">
            <div>
              <span className="text-[9px] text-gray-400 block">Net</span>
              <span className="text-[10px] font-medium text-gray-600">{fmt(momentNet)}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 block">{vatName}</span>
              <span className="text-[10px] font-medium text-gray-400">{fmt(momentVat)}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 block">Total</span>
              <span className="text-xs font-bold" style={{ color: GOLD }}>{fmt(momentGross)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPortalMomentSection;
