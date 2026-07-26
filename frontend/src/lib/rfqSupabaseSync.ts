// ─── RFQ Supabase Write-Through ───────────────────────────────────────────────
// Called by the coordinator after creating/updating an RFQ batch in localStorage
// so the supplier can access the data cross-device via their portal link.

import { supabase } from '@/lib/supabase';
import { RFQBatch, RFQBatchItem, RFQBatchStatus, PlannerEvent, SupplierQuoteVersion } from '@/contexts/EventContext';
import { upsertQuoteVersionFromSupabase } from '@/data/rfqStore';

// Build the minimal event context that the supplier portal needs.
export function buildEventContext(event: PlannerEvent): Record<string, any> {
  return {
    name: event.name || event.companyName || '',
    currency: event.currency || 'ZAR',
    vatRate: event.vatRate ?? 0.15,
    defaultPricesIncludeVat: event.defaultPricesIncludeVat ?? true,
    moments: (event.moments || []).map(m => ({
      id: m.id,
      name: m.name,
      venueSpaceId: m.venueSpaceId || '',
    })),
    venueSpaces: (event.venueSpaces || []).map(s => ({
      id: s.id,
      name: s.name,
    })),
    city: event.city || event.location || '',
    country: event.country || '',
    date: event.date || '',
    jobCode: event.jobCode || '',
  };
}

// Upsert the batch and its items to Supabase.
// Fire-and-forget: errors are logged but don't break the coordinator's flow.
export async function syncRFQBatch(
  userId: string,
  batch: RFQBatch,
  batchItems: RFQBatchItem[],
  event: PlannerEvent,
): Promise<void> {
  try {
    const { error: batchError } = await supabase.from('rfq_batches').upsert({
      id:                             batch.id,
      event_id:                       batch.eventId,
      user_id:                        userId,
      supplier_name:                  batch.supplierName,
      supplier_email:                 batch.supplierEmail,
      status:                         batch.status,
      portal_token:                   batch.portalToken,
      message_to_supplier:            batch.messageToSupplier,
      include_vat_info:               batch.includeVatInfo,
      include_moment_space_context:   batch.includeMomentSpaceContext,
      current_supplier_draft_version: batch.currentSupplierDraftVersion,
      current_submitted_version:      batch.currentSubmittedVersion,
      event_context:                  buildEventContext(event),
      sent_at:                        batch.sentAt || null,
      accepted_at:                    batch.acceptedAt || null,
      created_at:                     batch.createdAt,
    }, { onConflict: 'id' });

    if (batchError) {
      console.warn('syncRFQBatch: batch upsert failed', batchError.message);
      return;
    }

    if (batchItems.length === 0) return;

    const rows = batchItems.map(bi => ({
      id:                           bi.id,
      rfq_batch_id:                 bi.rfqBatchId,
      line_item_id:                 bi.lineItemId,
      item_name_snapshot:           bi.itemNameSnapshot,
      qty_snapshot:                 bi.qtySnapshot,
      unit_type_snapshot:           bi.unitTypeSnapshot,
      moment_id_snapshot:           bi.momentIdSnapshot,
      space_id_snapshot:            bi.spaceIdSnapshot,
      installation_label_snapshot:  bi.installationLabelSnapshot,
      item_notes_snapshot:          bi.itemNotesSnapshot,
      category_snapshot:            bi.categorySnapshot,
      created_at:                   bi.createdAt,
    }));

    const { error: itemsError } = await supabase
      .from('rfq_batch_items')
      .upsert(rows, { onConflict: 'id' });

    if (itemsError) {
      console.warn('syncRFQBatch: items upsert failed', itemsError.message);
    }
  } catch (err: any) {
    console.warn('syncRFQBatch error:', err.message);
  }
}

// Update the batch status in Supabase (SENT, ACCEPTED, etc.)
export async function syncBatchStatus(
  batchId: string,
  status: RFQBatchStatus,
  userId: string,
): Promise<void> {
  try {
    const updates: Record<string, any> = { status };
    if (status === 'SENT') updates.sent_at = new Date().toISOString();
    if (status === 'ACCEPTED' || status === 'LOCKED') updates.accepted_at = new Date().toISOString();

    const { error } = await supabase
      .from('rfq_batches')
      .update(updates)
      .eq('id', batchId)
      .eq('user_id', userId);

    if (error) console.warn('syncBatchStatus failed:', error.message);
  } catch (err: any) {
    console.warn('syncBatchStatus error:', err.message);
  }
}

// ─── Pull Submitted Quotes from Supabase ─────────────────────────────────────
// Called by the coordinator when they open the quote comparison view.
// Fetches all SUBMITTED quote versions for the event from Supabase and writes
// any new ones into the local rfqStore so applySupplierPricingToEvent can run.
// Returns the count of new quote versions pulled in.
export async function pullQuotesFromSupabase(eventId: string): Promise<number> {
  try {
    // Fetch all batch IDs for this event (coordinator owns them — RLS applies)
    const { data: batches, error: batchErr } = await supabase
      .from('rfq_batches')
      .select('id')
      .eq('event_id', eventId);

    if (batchErr || !batches || batches.length === 0) return 0;

    const batchIds = batches.map((b: any) => b.id);

    // Fetch SUBMITTED quote versions with their items in one query
    const { data: versions, error: vErr } = await supabase
      .from('supplier_quote_versions')
      .select(`
        id, rfq_batch_id, version_number, type, supplier_notes,
        total_net, total_vat, total_gross, submitted_at,
        supplier_quote_items (
          rfq_batch_item_id, supplier_unit_price_input,
          supplier_price_includes_vat, vat_rate_used, currency,
          lead_time_days, availability_notes
        )
      `)
      .in('rfq_batch_id', batchIds)
      .eq('type', 'SUBMITTED')
      .order('version_number', { ascending: false });

    if (vErr || !versions) return 0;

    let newCount = 0;
    for (const v of versions as any[]) {
      const qv: SupplierQuoteVersion = {
        id: v.id,
        rfqBatchId: v.rfq_batch_id,
        versionNumber: v.version_number,
        type: 'SUBMITTED',
        createdAt: v.submitted_at || new Date().toISOString(),
        submittedAt: v.submitted_at || '',
        supplierNotes: v.supplier_notes || '',
        items: (v.supplier_quote_items || []).map((item: any) => ({
          rfqBatchItemId: item.rfq_batch_item_id,
          supplierUnitPriceInput: Number(item.supplier_unit_price_input),
          supplierPriceIncludesVat: item.supplier_price_includes_vat,
          vatRateUsed: Number(item.vat_rate_used),
          currency: item.currency || 'ZAR',
          leadTimeDays: item.lead_time_days || 0,
          availabilityNotes: item.availability_notes || '',
        })),
        totals: {
          net: Number(v.total_net || 0),
          vat: Number(v.total_vat || 0),
          gross: Number(v.total_gross || 0),
        },
      };

      const isNew = upsertQuoteVersionFromSupabase(qv);
      if (isNew) newCount++;
    }

    return newCount;
  } catch (err: any) {
    console.warn('pullQuotesFromSupabase error:', err.message);
    return 0;
  }
}
