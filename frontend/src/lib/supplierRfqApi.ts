// ─── Authenticated Supplier RFQ API ─────────────────────────────────────────
// Operations that only make sense for a supplier with a real account (as
// opposed to the anonymous portal_token flow in rfqPortalApi.ts). Listing and
// detail-fetching both rely on RLS/RPC authorization keyed off auth.email()
// matching rfq_batches.supplier_email - these functions never filter by email
// themselves, since doing so client-side would be redundant with (and no
// safer than) the server-side check that actually enforces it.

import { supabase } from '@/lib/supabase';
import { RFQBatch } from '@/contexts/EventContext';

export interface SupplierInvitation {
  batch: RFQBatch & { eventContext: Record<string, any> };
  itemCount: number;
}

function rowToBatch(row: any): RFQBatch & { eventContext: Record<string, any> } {
  return {
    id: row.id,
    eventId: row.event_id,
    supplierId: (row.supplier_name as string).toLowerCase().replace(/\s+/g, '-'),
    supplierName: row.supplier_name,
    supplierEmail: row.supplier_email,
    status: row.status,
    portalToken: row.portal_token,
    messageToSupplier: row.message_to_supplier ?? '',
    includeVatInfo: row.include_vat_info ?? true,
    includeMomentSpaceContext: row.include_moment_space_context ?? true,
    currentSupplierDraftVersion: row.current_supplier_draft_version ?? 0,
    currentSubmittedVersion: row.current_submitted_version ?? 0,
    sentAt: row.sent_at ?? '',
    acceptedAt: row.accepted_at ?? '',
    lastSupplierSaveAt: row.last_supplier_save_at ?? '',
    createdAt: row.created_at ?? '',
    invitationResponse: row.invitation_response ?? '',
    invitationRespondedAt: row.invitation_responded_at ?? '',
    eventContext: row.event_context ?? {},
  };
}

/** Every RFQ invitation addressed to the currently-authenticated supplier, newest first. */
export async function getMyInvitations(): Promise<SupplierInvitation[]> {
  const { data: batches, error } = await supabase
    .from('rfq_batches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !batches) { console.error('getMyInvitations error:', error); return []; }
  if (batches.length === 0) return [];

  // Item counts are a nice-to-have for the list view, not security-relevant - best-effort.
  const { data: items } = await supabase
    .from('rfq_batch_items')
    .select('rfq_batch_id')
    .in('rfq_batch_id', batches.map(b => b.id));

  const counts: Record<string, number> = {};
  for (const row of items || []) counts[row.rfq_batch_id] = (counts[row.rfq_batch_id] || 0) + 1;

  return batches.map(row => ({ batch: rowToBatch(row), itemCount: counts[row.id] || 0 }));
}

/** Accept or decline an invitation to quote. Only ever touches invitation_response/
 *  invitation_responded_at (enforced server-side by the RPC, not just by convention). */
export async function respondToInvitation(batchId: string, response: 'accepted' | 'declined'): Promise<boolean> {
  const { error } = await supabase.rpc('supplier_respond_to_invitation', {
    p_batch_id: batchId,
    p_response: response,
  });
  if (error) { console.error('respondToInvitation error:', error); return false; }
  return true;
}
