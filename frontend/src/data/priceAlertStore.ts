// ─── Price Alert Store (localStorage-first) ─────────────────────────────────
// Monitors RFQ batch quote submissions and automatically generates alerts
// when a new quote beats the current best price for any line item.

import {
  PlannerEvent,
  RFQBatchStatus,
  CATEGORY_LABELS,
  ItemCategory,
} from '@/contexts/EventContext';
import {
  getRFQStore,
  getItemsForBatch,
  getLatestSubmitted,
  getBatchesForEvent,
} from '@/data/rfqStore';

const ALERT_STORAGE_KEY = 'theone_price_alerts_v1';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PriceAlert {
  id: string;
  eventId: string;
  eventName: string;
  batchId: string;
  quoteVersionId: string;
  supplierName: string;
  lineItemId: string;
  lineItemName: string;
  category: string;
  momentName: string;
  quantity: number;
  /** The new unit price from this supplier */
  newUnitPrice: number;
  /** The previous best unit price across all suppliers */
  previousBestPrice: number;
  /** The supplier who previously held the best price */
  previousBestSupplier: string;
  /** Savings per unit */
  savingsPerUnit: number;
  /** Total savings (savingsPerUnit * quantity) */
  totalSavings: number;
  /** Currency symbol */
  currency: string;
  /** ISO timestamp */
  createdAt: string;
  /** Whether the alert has been read */
  isRead: boolean;
  /** Whether the alert has been dismissed */
  isDismissed: boolean;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const loadAlerts = (): PriceAlert[] => {
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveAlerts = (alerts: PriceAlert[]) => {
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
};

const uid = () => `pa-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

// ─── Read Operations ─────────────────────────────────────────────────────────

export const getAllAlerts = (): PriceAlert[] => {
  return loadAlerts()
    .filter(a => !a.isDismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAlertsForEvent = (eventId: string): PriceAlert[] => {
  return getAllAlerts().filter(a => a.eventId === eventId);
};

export const getUnreadCount = (): number => {
  return loadAlerts().filter(a => !a.isRead && !a.isDismissed).length;
};

export const getUnreadAlerts = (): PriceAlert[] => {
  return getAllAlerts().filter(a => !a.isRead);
};

// ─── Write Operations ────────────────────────────────────────────────────────

export const markAlertAsRead = (alertId: string) => {
  const alerts = loadAlerts();
  const updated = alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a);
  saveAlerts(updated);
};

export const markAllAlertsAsRead = () => {
  const alerts = loadAlerts();
  const updated = alerts.map(a => ({ ...a, isRead: true }));
  saveAlerts(updated);
};

export const dismissAlert = (alertId: string) => {
  const alerts = loadAlerts();
  const updated = alerts.map(a => a.id === alertId ? { ...a, isDismissed: true, isRead: true } : a);
  saveAlerts(updated);
};

export const clearAllAlerts = () => {
  saveAlerts([]);
};

export const clearReadAlerts = () => {
  const alerts = loadAlerts();
  saveAlerts(alerts.filter(a => !a.isRead));
};

// ─── Alert Generation ────────────────────────────────────────────────────────
// Called after a supplier submits a quote. Compares each quoted item against
// the current best price from all other suppliers for the same line item.

export const generatePriceAlerts = (
  batchId: string,
  quoteVersionId: string,
  eventId: string,
): PriceAlert[] => {
  const rfqStore = getRFQStore();
  const newAlerts: PriceAlert[] = [];

  // Find the batch and quote version
  const batch = rfqStore.batches.find(b => b.id === batchId);
  if (!batch) return [];

  const quoteVersion = rfqStore.quoteVersions.find(qv => qv.id === quoteVersionId);
  if (!quoteVersion || quoteVersion.type !== 'SUBMITTED') return [];

  const batchItems = rfqStore.batchItems.filter(bi => bi.rfqBatchId === batchId);

  // Load event for context
  const STORAGE_KEY = 'theone_events_v6';
  let event: PlannerEvent | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const events: PlannerEvent[] = JSON.parse(raw);
      event = events.find(e => e.id === eventId) || null;
    }
  } catch {}

  if (!event) return [];

  const currencySymbol = event.currency || 'ZAR';

  // For each item in this quote, find the best price from OTHER suppliers
  quoteVersion.items.forEach(qi => {
    const batchItem = batchItems.find(bi => bi.id === qi.rfqBatchItemId);
    if (!batchItem) return;

    const lineItemId = batchItem.lineItemId;
    const lineItem = event!.lineItems.find(li => li.id === lineItemId);
    if (!lineItem) return;

    const newUnitPrice = qi.supplierUnitPriceInput;

    // Find all other batches for this event that have quotes for this line item
    const allBatches = rfqStore.batches.filter(
      b => b.eventId === eventId && b.id !== batchId
    );

    let previousBestPrice: number | null = null;
    let previousBestSupplier = '';

    // Also consider the current estimate as a baseline
    const currentEstimate = lineItem.unitCost;

    allBatches.forEach(otherBatch => {
      const quotableStatuses: RFQBatchStatus[] = ['QUOTED', 'REVISED', 'ACCEPTED', 'LOCKED'];
      if (!quotableStatuses.includes(otherBatch.status)) return;

      const otherBatchItems = rfqStore.batchItems.filter(bi => bi.rfqBatchId === otherBatch.id);
      const otherBatchItem = otherBatchItems.find(bi => bi.lineItemId === lineItemId);
      if (!otherBatchItem) return;

      const otherLatest = rfqStore.quoteVersions
        .filter(qv => qv.rfqBatchId === otherBatch.id && qv.type === 'SUBMITTED')
        .sort((a, b) => b.versionNumber - a.versionNumber)[0];
      if (!otherLatest) return;

      const otherQuoteItem = otherLatest.items.find(i => i.rfqBatchItemId === otherBatchItem.id);
      if (!otherQuoteItem) return;

      const otherPrice = otherQuoteItem.supplierUnitPriceInput;
      if (previousBestPrice === null || otherPrice < previousBestPrice) {
        previousBestPrice = otherPrice;
        previousBestSupplier = otherBatch.supplierName;
      }
    });

    // If no other supplier has quoted, use the current estimate as baseline
    if (previousBestPrice === null) {
      previousBestPrice = currentEstimate;
      previousBestSupplier = 'Current Estimate';
    }

    // Only generate an alert if the new price BEATS the previous best
    if (newUnitPrice < previousBestPrice) {
      const savingsPerUnit = previousBestPrice - newUnitPrice;
      const quantity = lineItem.quantity;
      const totalSavings = savingsPerUnit * quantity;

      // Get moment name
      const moment = (event!.moments || []).find(m => m.id === lineItem.momentId);
      const momentName = moment?.name || 'General';

      const categoryLabel = CATEGORY_LABELS[lineItem.category as ItemCategory] || lineItem.category;

      newAlerts.push({
        id: uid(),
        eventId,
        eventName: event!.name || event!.companyName || 'Event',
        batchId,
        quoteVersionId,
        supplierName: batch.supplierName,
        lineItemId,
        lineItemName: lineItem.name,
        category: categoryLabel,
        momentName,
        quantity,
        newUnitPrice,
        previousBestPrice,
        previousBestSupplier,
        savingsPerUnit,
        totalSavings,
        currency: currencySymbol,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
      });
    }
  });

  // Persist new alerts
  if (newAlerts.length > 0) {
    const existing = loadAlerts();
    // Keep max 200 alerts to prevent localStorage bloat
    const combined = [...newAlerts, ...existing].slice(0, 200);
    saveAlerts(combined);
  }

  return newAlerts;
};

// ─── Relative Time Helper ────────────────────────────────────────────────────

export const getRelativeTime = (isoDate: string): string => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ─── Seed Demo Alerts (for testing) ──────────────────────────────────────────

export const seedDemoAlerts = (eventId: string, eventName: string) => {
  const existing = loadAlerts();
  if (existing.length > 0) return; // Don't seed if alerts already exist

  const now = new Date();
  const demoAlerts: PriceAlert[] = [
    {
      id: uid(),
      eventId,
      eventName,
      batchId: 'demo-batch-1',
      quoteVersionId: 'demo-qv-1',
      supplierName: 'Elite Rentals',
      lineItemId: 'demo-li-1',
      lineItemName: 'Tiffany Chairs',
      category: 'Furniture',
      momentName: 'Reception',
      quantity: 100,
      newUnitPrice: 42,
      previousBestPrice: 55,
      previousBestSupplier: 'Premium Décor',
      savingsPerUnit: 13,
      totalSavings: 1300,
      currency: 'ZAR',
      createdAt: new Date(now.getTime() - 15 * 60000).toISOString(),
      isRead: false,
      isDismissed: false,
    },
    {
      id: uid(),
      eventId,
      eventName,
      batchId: 'demo-batch-2',
      quoteVersionId: 'demo-qv-2',
      supplierName: 'Bloom & Petal',
      lineItemId: 'demo-li-2',
      lineItemName: 'Centrepieces',
      category: 'Florals',
      momentName: 'Reception',
      quantity: 10,
      newUnitPrice: 380,
      previousBestPrice: 450,
      previousBestSupplier: 'Garden Glory',
      savingsPerUnit: 70,
      totalSavings: 700,
      currency: 'ZAR',
      createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
      isRead: false,
      isDismissed: false,
    },
    {
      id: uid(),
      eventId,
      eventName,
      batchId: 'demo-batch-3',
      quoteVersionId: 'demo-qv-3',
      supplierName: 'LightWorks SA',
      lineItemId: 'demo-li-3',
      lineItemName: 'Fairy Light Canopy',
      category: 'Lighting',
      momentName: 'Ceremony',
      quantity: 1,
      newUnitPrice: 2200,
      previousBestPrice: 2800,
      previousBestSupplier: 'Current Estimate',
      savingsPerUnit: 600,
      totalSavings: 600,
      currency: 'ZAR',
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      isRead: false,
      isDismissed: false,
    },
    {
      id: uid(),
      eventId,
      eventName,
      batchId: 'demo-batch-1',
      quoteVersionId: 'demo-qv-4',
      supplierName: 'Elite Rentals',
      lineItemId: 'demo-li-4',
      lineItemName: 'Round Tables (10-seater)',
      category: 'Furniture',
      momentName: 'Reception',
      quantity: 10,
      newUnitPrice: 200,
      previousBestPrice: 250,
      previousBestSupplier: 'Current Estimate',
      savingsPerUnit: 50,
      totalSavings: 500,
      currency: 'ZAR',
      createdAt: new Date(now.getTime() - 3 * 3600000).toISOString(),
      isRead: true,
      isDismissed: false,
    },
    {
      id: uid(),
      eventId,
      eventName,
      batchId: 'demo-batch-4',
      quoteVersionId: 'demo-qv-5',
      supplierName: 'Linen & Co',
      lineItemId: 'demo-li-5',
      lineItemName: 'Table Linen',
      category: 'Linen',
      momentName: 'Reception',
      quantity: 10,
      newUnitPrice: 95,
      previousBestPrice: 120,
      previousBestSupplier: 'Current Estimate',
      savingsPerUnit: 25,
      totalSavings: 250,
      currency: 'ZAR',
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      isRead: true,
      isDismissed: false,
    },
  ];

  saveAlerts(demoAlerts);
};
