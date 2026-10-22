// ─── RFQ Portal Supabase API ──────────────────────────────────────────────────
// All functions call security-definer RPC endpoints so unauthenticated
// suppliers can access and update their quote via the portal token.

import { supabase } from '@/lib/supabase';
import {
  RFQBatch, RFQBatchItem, SupplierQuoteVersionItem,
} from '@/contexts/EventContext';
import { SupplierDocument } from '@/data/rfqStore';

// ─── Types returned by portal_get_data ───────────────────────────────────────

export interface PortalQuoteVersion {
  id: string;
  type: 'DRAFT_SAVE' | 'SUBMITTED';
  versionNumber: number;
  supplierNotes: string;
  totals?: { net: number; vat: number; gross: number };
  items: SupplierQuoteVersionItem[];
}

export interface PortalData {
  batch: RFQBatch & { eventContext: Record<string, any> };
  batchItems: RFQBatchItem[];
  latestDraft: PortalQuoteVersion | null;
  latestSubmitted: PortalQuoteVersion | null;
  documents: SupplierDocument[];
}

// ─── Load ─────────────────────────────────────────────────────────────────────

function mapPortalData(raw: any): PortalData {
  const batch: RFQBatch & { eventContext: Record<string, any> } = {
    id: raw.batch.id,
    eventId: raw.batch.eventId,
    supplierId: (raw.batch.supplierName as string).toLowerCase().replace(/\s+/g, '-'),
    supplierName: raw.batch.supplierName,
    supplierEmail: raw.batch.supplierEmail,
    status: raw.batch.status,
    portalToken: raw.batch.portalToken,
    messageToSupplier: raw.batch.messageToSupplier ?? '',
    includeVatInfo: raw.batch.includeVatInfo ?? true,
    includeMomentSpaceContext: raw.batch.includeMomentSpaceContext ?? true,
    currentSupplierDraftVersion: raw.batch.currentSupplierDraftVersion ?? 0,
    currentSubmittedVersion: raw.batch.currentSubmittedVersion ?? 0,
    sentAt: raw.batch.sentAt ?? '',
    acceptedAt: raw.batch.acceptedAt ?? '',
    lastSupplierSaveAt: raw.batch.lastSupplierSaveAt ?? '',
    createdAt: raw.batch.createdAt ?? '',
    invitationResponse: raw.batch.invitationResponse ?? '',
    invitationRespondedAt: raw.batch.invitationRespondedAt ?? '',
    eventContext: raw.batch.eventContext ?? {},
  };

  return {
    batch,
    batchItems: (raw.batchItems ?? []) as RFQBatchItem[],
    latestDraft: raw.latestDraft ?? null,
    latestSubmitted: raw.latestSubmitted ?? null,
    documents: (raw.documents ?? []) as SupplierDocument[],
  };
}

export async function getPortalData(token: string): Promise<PortalData | null> {
  try {
    const { data, error } = await supabase.rpc('portal_get_data', { p_token: token });
    if (error || !data) return null;
    return mapPortalData(data);
  } catch {
    return null;
  }
}

/** Authenticated-supplier equivalent of getPortalData - same RPC, authorized by
 *  auth.email() matching the batch's supplier_email instead of a portal token. */
export async function getPortalDataForBatch(batchId: string): Promise<PortalData | null> {
  try {
    const { data, error } = await supabase.rpc('portal_get_data', { p_batch_id: batchId });
    if (error || !data) return null;
    return mapPortalData(data);
  } catch {
    return null;
  }
}

// ─── Save / Submit ────────────────────────────────────────────────────────────

export interface SaveQuoteResult {
  quoteVersionId: string;
  versionNumber: number;
  type: string;
  totals: { net: number; vat: number; gross: number };
}

export async function savePortalQuote(
  token: string,
  type: 'DRAFT_SAVE' | 'SUBMITTED',
  items: SupplierQuoteVersionItem[],
  notes: string,
  vatRate: number,
  defaultIncVat: boolean,
): Promise<SaveQuoteResult | null> {
  try {
    const { data, error } = await supabase.rpc('portal_save_quote', {
      p_token:           token,
      p_type:            type,
      p_items:           items,
      p_notes:           notes,
      p_vat_rate:        vatRate,
      p_default_inc_vat: defaultIncVat,
    });
    if (error) { console.error('portal_save_quote error:', error); return null; }
    return data as SaveQuoteResult;
  } catch {
    return null;
  }
}

/** Authenticated-supplier equivalent of savePortalQuote - same RPC, same version-numbering
 *  and VAT-total logic, authorized by auth.email() instead of a portal token. Calling this
 *  again (type='SUBMITTED') is how an existing quote gets edited - it produces the next version. */
export async function saveQuoteForBatch(
  batchId: string,
  type: 'DRAFT_SAVE' | 'SUBMITTED',
  items: SupplierQuoteVersionItem[],
  notes: string,
  vatRate: number,
  defaultIncVat: boolean,
): Promise<SaveQuoteResult | null> {
  try {
    const { data, error } = await supabase.rpc('portal_save_quote', {
      p_batch_id:        batchId,
      p_type:            type,
      p_items:           items,
      p_notes:           notes,
      p_vat_rate:        vatRate,
      p_default_inc_vat: defaultIncVat,
    });
    if (error) { console.error('portal_save_quote (authenticated) error:', error); return null; }
    return data as SaveQuoteResult;
  } catch {
    return null;
  }
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function savePortalDocument(
  token: string,
  doc: SupplierDocument,
): Promise<void> {
  try {
    await supabase.rpc('portal_save_document', {
      p_token:     token,
      p_doc_id:    doc.id,
      p_file_name: doc.fileName,
      p_file_url:  doc.fileUrl,
      p_file_size: doc.fileSize,
      p_mime_type: doc.mimeType,
    });
  } catch (err) {
    console.warn('portal_save_document failed:', err);
  }
}

export async function removePortalDocument(token: string, docId: string): Promise<void> {
  try {
    await supabase.rpc('portal_remove_document', { p_token: token, p_doc_id: docId });
  } catch (err) {
    console.warn('portal_remove_document failed:', err);
  }
}
