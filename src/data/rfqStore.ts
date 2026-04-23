// ─── RFQ Batch Store (localStorage-first) ────────────────────────────────────
// Standalone store for RFQ batches, items, and supplier quote versions.
// Accessible by both coordinator and supplier portal (via token lookup).

import {
  RFQBatch, RFQBatchItem, SupplierQuoteVersion, SupplierQuoteVersionItem,
  RFQBatchStatus, generatePortalToken, PlannerEvent, CostLineItem,
  CATEGORY_LABELS, ItemCategory,
} from '@/contexts/EventContext';
import { calculateVatBreakdown } from '@/data/countryConfig';
import { generatePriceAlerts } from '@/data/priceAlertStore';


const RFQ_STORAGE_KEY = 'theone_rfq_store_v1';

export interface RFQStore {
  batches: RFQBatch[];
  batchItems: RFQBatchItem[];
  quoteVersions: SupplierQuoteVersion[];
}

const loadStore = (): RFQStore => {
  try {
    const raw = localStorage.getItem(RFQ_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { batches: [], batchItems: [], quoteVersions: [] };
};

const saveStore = (store: RFQStore) => {
  localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(store));
};

const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
const now = () => new Date().toISOString();

// ─── Read Operations ─────────────────────────────────────────────────────────

export const getRFQStore = (): RFQStore => loadStore();

export const getBatchesForEvent = (eventId: string): RFQBatch[] =>
  loadStore().batches.filter(b => b.eventId === eventId);

export const getBatchById = (batchId: string): RFQBatch | undefined =>
  loadStore().batches.find(b => b.id === batchId);

export const getBatchByToken = (token: string): RFQBatch | undefined =>
  loadStore().batches.find(b => b.portalToken === token);

export const getItemsForBatch = (batchId: string): RFQBatchItem[] =>
  loadStore().batchItems.filter(bi => bi.rfqBatchId === batchId);

export const getQuoteVersionsForBatch = (batchId: string): SupplierQuoteVersion[] =>
  loadStore().quoteVersions.filter(qv => qv.rfqBatchId === batchId).sort((a, b) => b.versionNumber - a.versionNumber);

export const getLatestSubmitted = (batchId: string): SupplierQuoteVersion | undefined =>
  getQuoteVersionsForBatch(batchId).find(qv => qv.type === 'SUBMITTED');

export const getLatestDraft = (batchId: string): SupplierQuoteVersion | undefined =>
  getQuoteVersionsForBatch(batchId).find(qv => qv.type === 'DRAFT_SAVE');

// ─── Batch CRUD ──────────────────────────────────────────────────────────────

export const createRFQBatch = (
  event: PlannerEvent,
  supplierName: string,
  supplierEmail: string,
  lineItemIds: string[],
  messageToSupplier: string = '',
): RFQBatch => {
  const store = loadStore();
  const batchId = `rfq-${uid()}`;
  const token = generatePortalToken();

  const batch: RFQBatch = {
    id: batchId,
    eventId: event.id,
    supplierId: supplierName.toLowerCase().replace(/\s+/g, '-'),
    supplierName,
    supplierEmail,
    status: 'DRAFT',
    createdAt: now(),
    sentAt: '',
    acceptedAt: '',
    lastSupplierSaveAt: '',
    currentSupplierDraftVersion: 0,
    currentSubmittedVersion: 0,
    portalToken: token,
    messageToSupplier,
    includeVatInfo: true,
    includeMomentSpaceContext: true,
  };

  // Create batch items from line items
  const batchItems: RFQBatchItem[] = lineItemIds.map(liId => {
    const li = event.lineItems.find(l => l.id === liId);
    if (!li) return null;
    const moment = (event.moments || []).find(m => m.id === li.momentId);
    const space = (event.venueSpaces || []).find(s => s.id === (moment?.venueSpaceId || ''));
    const spec = (event.specs || []).find(s => s.ownerId === li.id);
    return {
      id: `rbi-${uid()}`,
      rfqBatchId: batchId,
      lineItemId: li.id,
      qtySnapshot: li.quantity,
      unitTypeSnapshot: 'EACH',
      momentIdSnapshot: li.momentId || '',
      spaceIdSnapshot: moment?.venueSpaceId || '',
      installationLabelSnapshot: spec?.placementLabel || '',
      itemNameSnapshot: li.name,
      itemNotesSnapshot: li.notes || li.clientVisibleNotes || '',
      categorySnapshot: CATEGORY_LABELS[li.category as ItemCategory] || li.category,
      createdAt: now(),
    } as RFQBatchItem;
  }).filter(Boolean) as RFQBatchItem[];

  store.batches.push(batch);
  store.batchItems.push(...batchItems);
  saveStore(store);
  return batch;
};

export const updateBatchStatus = (batchId: string, status: RFQBatchStatus) => {
  const store = loadStore();
  store.batches = store.batches.map(b => {
    if (b.id !== batchId) return b;
    const updates: Partial<RFQBatch> = { status };
    if (status === 'SENT') updates.sentAt = now();
    if (status === 'ACCEPTED' || status === 'LOCKED') updates.acceptedAt = now();
    return { ...b, ...updates };
  });
  saveStore(store);
};

export const cancelBatch = (batchId: string) => updateBatchStatus(batchId, 'CANCELLED');

// ─── Quote Version CRUD ──────────────────────────────────────────────────────

export const saveQuoteVersion = (
  batchId: string,
  type: 'DRAFT_SAVE' | 'SUBMITTED',
  items: SupplierQuoteVersionItem[],
  supplierNotes: string,
  eventVatRate: number,
  eventDefaultIncVat: boolean,
): SupplierQuoteVersion => {
  const store = loadStore();
  const batch = store.batches.find(b => b.id === batchId);
  if (!batch) throw new Error('Batch not found');

  // Calculate totals
  let totalNet = 0, totalVat = 0, totalGross = 0;
  const batchItems = store.batchItems.filter(bi => bi.rfqBatchId === batchId);
  items.forEach(item => {
    const bi = batchItems.find(b => b.id === item.rfqBatchItemId);
    const qty = bi?.qtySnapshot || 1;
    const totalInput = qty * item.supplierUnitPriceInput;
    const vat = calculateVatBreakdown(totalInput, item.supplierPriceIncludesVat, item.vatRateUsed);
    totalNet += vat.supplierNet;
    totalVat += vat.vatValue;
    totalGross += vat.supplierGross;
  });

  // Determine version number
  const existingVersions = store.quoteVersions.filter(qv => qv.rfqBatchId === batchId && qv.type === type);
  const versionNumber = type === 'SUBMITTED'
    ? (batch.currentSubmittedVersion + 1)
    : (batch.currentSupplierDraftVersion + 1);

  const qv: SupplierQuoteVersion = {
    id: `sqv-${uid()}`,
    rfqBatchId: batchId,
    versionNumber,
    type,
    createdAt: now(),
    submittedAt: type === 'SUBMITTED' ? now() : '',
    supplierNotes,
    items,
    totals: { net: totalNet, vat: totalVat, gross: totalGross },
  };

  store.quoteVersions.push(qv);

  // Update batch
  store.batches = store.batches.map(b => {
    if (b.id !== batchId) return b;
    if (type === 'SUBMITTED') {
      return {
        ...b,
        currentSubmittedVersion: versionNumber,
        status: (versionNumber > 1 ? 'REVISED' : 'QUOTED') as RFQBatchStatus,
        lastSupplierSaveAt: now(),
      };
    } else {
      return {
        ...b,
        currentSupplierDraftVersion: versionNumber,
        lastSupplierSaveAt: now(),
      };
    }
  });


  saveStore(store);

  // ─── Generate Price Alerts on Submission ────────────────────────────────
  // When a supplier submits a quote, check if any items beat the current best price
  if (type === 'SUBMITTED') {
    try {
      generatePriceAlerts(batchId, qv.id, batch.eventId);
    } catch (e) {
      // Don't let alert generation failures break the quote submission
      console.warn('Price alert generation failed:', e);
    }
  }

  return qv;
};



// ─── Accept Quote Version ────────────────────────────────────────────────────

export const acceptQuoteVersion = (batchId: string, quoteVersionId: string) => {
  const store = loadStore();
  store.batches = store.batches.map(b =>
    b.id === batchId ? { ...b, status: 'ACCEPTED' as RFQBatchStatus, acceptedAt: now() } : b
  );
  saveStore(store);
  return store.quoteVersions.find(qv => qv.id === quoteVersionId);
};

// ─── Check if line item is in active batch ───────────────────────────────────

export const isLineItemInActiveBatch = (lineItemId: string, excludeBatchId?: string): boolean => {
  const store = loadStore();
  const activeStatuses: RFQBatchStatus[] = ['DRAFT', 'SENT', 'QUOTED', 'REVISED'];
  return store.batchItems.some(bi => {
    if (bi.lineItemId !== lineItemId) return false;
    if (excludeBatchId && bi.rfqBatchId === excludeBatchId) return false;
    const batch = store.batches.find(b => b.id === bi.rfqBatchId);
    return batch && activeStatuses.includes(batch.status);
  });
};

export const getRFQStatusForLineItem = (lineItemId: string): { status: RFQBatchStatus | null; batchId: string | null } => {
  const store = loadStore();
  const activeStatuses: RFQBatchStatus[] = ['DRAFT', 'SENT', 'QUOTED', 'REVISED', 'ACCEPTED', 'LOCKED'];
  for (const bi of store.batchItems) {
    if (bi.lineItemId !== lineItemId) continue;
    const batch = store.batches.find(b => b.id === bi.rfqBatchId);
    if (batch && activeStatuses.includes(batch.status)) {
      return { status: batch.status, batchId: batch.id };
    }
  }
  return { status: null, batchId: null };
};
// ─── Portal URL Helper ───────────────────────────────────────────────────────

export const getPortalUrl = (token: string): string => {
  return `${window.location.origin}/rfq/${token}`;
};

// ─── Find event for a portal token ───────────────────────────────────────────

export const findEventForToken = (token: string): { event: PlannerEvent | null; batch: RFQBatch | null } => {
  const store = loadStore();
  const batch = store.batches.find(b => b.portalToken === token);
  if (!batch) return { event: null, batch: null };

  // Load events from localStorage
  const STORAGE_KEY = 'theone_events_v6';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const events: PlannerEvent[] = JSON.parse(raw);
      const event = events.find(e => e.id === batch.eventId);
      return { event: event || null, batch };
    }
  } catch {}
  return { event: null, batch };
};

// ─── Apply Supplier Pricing Back to Event Line Items ─────────────────────────
// When a supplier submits a quote, map their pricing back to the planner's
// event line items using the hidden reference IDs (batchItem.lineItemId).

export const applySupplierPricingToEvent = (batchId: string, quoteVersionId: string): boolean => {
  const rfqStore = loadStore();
  const batch = rfqStore.batches.find(b => b.id === batchId);
  if (!batch) return false;

  const qv = rfqStore.quoteVersions.find(v => v.id === quoteVersionId);
  if (!qv) return false;

  const batchItems = rfqStore.batchItems.filter(bi => bi.rfqBatchId === batchId);

  // Load events from localStorage
  const STORAGE_KEY = 'theone_events_v6';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const events: PlannerEvent[] = JSON.parse(raw);
    const eventIdx = events.findIndex(e => e.id === batch.eventId);
    if (eventIdx === -1) return false;

    const event = { ...events[eventIdx] };
    let updated = false;

    // Map each quote item back to the event line item
    qv.items.forEach(qi => {
      const batchItem = batchItems.find(bi => bi.id === qi.rfqBatchItemId);
      if (!batchItem) return;

      const lineItemIdx = event.lineItems.findIndex(li => li.id === batchItem.lineItemId);
      if (lineItemIdx === -1) return;

      // Update the line item's unit cost with the supplier's quoted price
      event.lineItems[lineItemIdx] = {
        ...event.lineItems[lineItemIdx],
        unitCost: qi.supplierUnitPriceInput,
        supplierPriceIncludesVat: qi.supplierPriceIncludesVat,
        vatRateUsed: qi.vatRateUsed,
        // Clear setup/breakdown/delivery since supplier quote is all-in unit price
        // (keep existing values — the supplier is quoting unit price only)
      };
      updated = true;
    });

    if (updated) {
      event.updatedAt = now();
      events[eventIdx] = event;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }

    return updated;
  } catch {
    return false;
  }
};

// ─── Supplier Document Attachments ───────────────────────────────────────────

const DOC_STORAGE_KEY = 'theone_rfq_docs_v1';

export interface SupplierDocument {
  id: string;
  rfqBatchId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export const getDocumentsForBatch = (batchId: string): SupplierDocument[] => {
  try {
    const raw = localStorage.getItem(DOC_STORAGE_KEY);
    if (raw) {
      const docs: SupplierDocument[] = JSON.parse(raw);
      return docs.filter(d => d.rfqBatchId === batchId);
    }
  } catch {}
  return [];
};

export const addDocumentToBatch = (doc: SupplierDocument) => {
  try {
    const raw = localStorage.getItem(DOC_STORAGE_KEY);
    const docs: SupplierDocument[] = raw ? JSON.parse(raw) : [];
    docs.push(doc);
    localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(docs));
  } catch {}
};

export const removeDocumentFromBatch = (docId: string) => {
  try {
    const raw = localStorage.getItem(DOC_STORAGE_KEY);
    if (raw) {
      const docs: SupplierDocument[] = JSON.parse(raw);
      localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(docs.filter(d => d.id !== docId)));
    }
  } catch {}
};
