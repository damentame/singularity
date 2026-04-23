// ─── Staged Totals Calculation Engine ─────────────────────────────────────────
// Implements the locked totals structure:
// Subtotal1 (Items) → Delivery+Setup → Subtotal2 → Collection → Subtotal3 →
// VAT → Subtotal4 → Refundable Deposit → Grand Total

import { CostLineItem, PlannerEvent, CalculatedLineItem } from '@/contexts/EventContext';
import { getCurrencySymbol, formatCurrency } from '@/data/countryConfig';

export interface StagedTotals {
  // Stage 1: Line items (client-facing, after markup, excl delivery/setup/collection)
  subtotal1: number;

  // Stage 2: Delivery + Setup/Installation
  deliverySetupTotal: number;
  subtotal2: number;

  // Stage 3: Collection / Strike / After-hours
  collectionTotal: number;
  subtotal3: number; // Before VAT

  // Stage 4: VAT
  vatName: string;
  vatRate: number;
  vatAmount: number;
  subtotal4: number; // Incl VAT

  // Stage 5: Refundable Deposit (dry-hire items only, no VAT)
  dryHireBase: number;
  refundableDeposit: number;

  // Grand Total
  grandTotal: number;

  // Per Guest calculations
  perGuestInclVat: number;        // Subtotal4 / guestCount
  perGuestInclVatAndDeposit: number; // GrandTotal / guestCount

  // Currency
  currencySymbol: string;
}

/**
 * Calculate staged totals from line items and event settings.
 * 
 * This separates the total into:
 * - Item costs (with markup) 
 * - Delivery + Setup costs (pass-through, no markup)
 * - Collection/Strike costs (pass-through, no markup)
 * - VAT on the total
 * - Refundable deposit on dry-hire items
 */
export function calculateStagedTotals(
  items: CostLineItem[],
  event: PlannerEvent,
  calculateLineItem: (item: CostLineItem) => CalculatedLineItem,
): StagedTotals {
  const vatRate = event.vatRate ?? 0;
  const vatName = event.vatName || 'VAT';
  const currencySymbol = getCurrencySymbol(event.currency || 'ZAR');
  const guestCount = event.guestCount || 1;

  let subtotal1 = 0;
  let deliverySetupTotal = 0;
  let collectionTotal = 0;
  let dryHireBase = 0;

  items.forEach(item => {
    const calc = calculateLineItem(item);

    // Item base cost: qty * unitCost (with time multiplier for labour)
    const baseCost = item.quantity * item.unitCost;
    // Apply markup to base cost only
    const itemClientPrice = baseCost * (1 + item.markupPercent / 100);

    subtotal1 += itemClientPrice;

    // Delivery + Setup (pass-through, no markup applied)
    const setupAdjusted = item.setupCost * calc.timeMultiplier;
    deliverySetupTotal += item.deliveryCost + setupAdjusted;

    // Collection / Strike / After-hours (pass-through)
    const breakdownAdjusted = item.breakdownCost * calc.timeMultiplier;
    collectionTotal += breakdownAdjusted;

    // Dry hire base (for refundable deposit)
    if ((item as any).isDryHire) {
      dryHireBase += itemClientPrice;
    }
  });

  const subtotal2 = subtotal1 + deliverySetupTotal;
  const subtotal3 = subtotal2 + collectionTotal;
  const vatAmount = subtotal3 * vatRate;
  const subtotal4 = subtotal3 + vatAmount;
  const refundableDeposit = dryHireBase * 0.10;
  const grandTotal = subtotal4 + refundableDeposit;

  const perGuestInclVat = guestCount > 0 ? subtotal4 / guestCount : 0;
  const perGuestInclVatAndDeposit = guestCount > 0 ? grandTotal / guestCount : 0;

  return {
    subtotal1,
    deliverySetupTotal,
    subtotal2,
    collectionTotal,
    subtotal3,
    vatName,
    vatRate,
    vatAmount,
    subtotal4,
    dryHireBase,
    refundableDeposit,
    grandTotal,
    perGuestInclVat,
    perGuestInclVatAndDeposit,
    currencySymbol,
  };
}

/**
 * Format a staged totals value using the event currency
 */
export function fmtStaged(amount: number, currencySymbol: string): string {
  return formatCurrency(amount, currencySymbol);
}
