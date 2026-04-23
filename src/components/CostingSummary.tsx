import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EventSummary, PlannerEvent, useEventContext } from '@/contexts/EventContext';
import { calculateStagedTotals, fmtStaged } from '@/data/stagedTotals';

const GOLD = '#C9A24A';

interface CostingSummaryProps {
  summary: EventSummary;
  itemCount: number;
  guestCount: number;
  event?: PlannerEvent;
}

const CostingSummary: React.FC<CostingSummaryProps> = ({ summary, itemCount, guestCount, event }) => {
  const { calculateLineItem } = useEventContext();

  const staged = useMemo(() => {
    if (!event) return null;
    return calculateStagedTotals(event.lineItems, event, calculateLineItem);
  }, [event, calculateLineItem]);

  const fmt = (n: number) => staged ? fmtStaged(n, staged.currencySymbol) : `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className="rounded-2xl border p-6 space-y-4"
      style={{
        backgroundColor: '#FFF',
        borderColor: summary.marginWarning ? '#EF4444' : 'rgba(201,162,74,0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-medium uppercase tracking-widest"
          style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}
        >
          Live Summary
        </h3>
        <span className="text-xs text-gray-400">{itemCount} items</span>
      </div>

      <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.12)' }} />

      {/* Coordinator-only: Supplier Cost + Margin */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-500">Supplier Cost</span>
          <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
            {fmt(summary.totalSupplierCost)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-500">Gross Margin</span>
          <div className="text-right">
            <span
              className="text-lg font-bold"
              style={{ color: summary.marginWarning ? '#EF4444' : '#22C55E' }}
            >
              {summary.grossMarginPercent.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400 ml-2">
              ({fmt(summary.grossMarginValue)})
            </span>
          </div>
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.12)' }} />

      {/* Staged Totals */}
      {staged ? (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Subtotal 1 (Items)</span>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal1)}</span>
          </div>

          {staged.deliverySetupTotal > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-gray-400 pl-2">Delivery + Set-up / Installation</span>
              <span className="text-xs text-gray-500">{fmt(staged.deliverySetupTotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Subtotal 2</span>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal2)}</span>
          </div>

          {staged.collectionTotal > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-gray-400 pl-2">Collection / After-hours</span>
              <span className="text-xs text-gray-500">{fmt(staged.collectionTotal)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Subtotal 3 (Excl {staged.vatName})</span>
            <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal3)}</span>
          </div>

          {staged.vatRate > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-gray-400 pl-2">{staged.vatName} @ {(staged.vatRate * 100).toFixed(1)}%</span>
              <span className="text-xs text-gray-500">{fmt(staged.vatAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-1 border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>Subtotal 4 (Incl {staged.vatName})</span>
            <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(staged.subtotal4)}</span>
          </div>

          {staged.refundableDeposit > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-gray-400 pl-2">Refundable Deposit (10% Dry-Hire) — No {staged.vatName}</span>
              <span className="text-xs text-gray-500">{fmt(staged.refundableDeposit)}</span>
            </div>
          )}

          <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.15)' }} />

          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Grand Total</span>
            <span className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{fmt(staged.grandTotal)}</span>
          </div>

          <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.08)' }} />

          {/* Per Guest */}
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-gray-400">Per Guest (incl {staged.vatName}, excl deposit)</span>
            <span className="text-xs text-gray-500">{fmt(staged.perGuestInclVat)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] text-gray-400">Per Guest (incl {staged.vatName} + deposit)</span>
            <span className="text-xs text-gray-500">{fmt(staged.perGuestInclVatAndDeposit)}</span>
          </div>

          {/* Dry hire info */}
          {staged.dryHireBase > 0 && (
            <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,74,0.04)' }}>
              <span className="text-[10px] text-gray-400">Dry-hire items base: {fmt(staged.dryHireBase)}</span>
            </div>
          )}
        </div>
      ) : (
        /* Fallback if no event */
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500">Client Price</span>
            <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>
              {fmt(summary.totalClientPrice)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500">Per Guest</span>
            <span className="text-sm" style={{ color: '#777' }}>
              {fmt(guestCount > 0 ? summary.totalClientPrice / guestCount : 0)}
            </span>
          </div>
        </div>
      )}

      {summary.marginWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 leading-relaxed">
            Gross margin is below 25%. Review your markup percentages or supplier costs.
          </p>
        </div>
      )}
    </div>
  );
};

export default CostingSummary;
