import { PlannerEvent, RFQBatch } from '@/contexts/EventContext';
import { createRFQBatch, getItemsForBatch, updateBatchStatus } from '@/data/rfqStore';
import { syncBatchStatus, syncRFQBatch } from '@/lib/rfqSupabaseSync';

export interface CreateSupplierInvitationResult {
  ok: boolean;
  batch?: RFQBatch;
  error?: string;
}

/**
 * Create a local RFQ batch, mark it SENT, and write it through to Supabase so an
 * authenticated supplier (matched by supplier_email === auth.email()) sees it
 * under My Invitations. Email delivery is intentionally separate.
 */
export async function createAndSyncSupplierInvitation(
  userId: string,
  event: PlannerEvent,
  supplierName: string,
  supplierEmail: string,
  lineItemIds: string[],
  messageToSupplier = '',
): Promise<CreateSupplierInvitationResult> {
  const email = supplierEmail.trim();
  if (!userId) return { ok: false, error: 'You must be signed in to send invitations.' };
  if (!supplierName.trim()) return { ok: false, error: 'Supplier name is required.' };
  if (!email) return { ok: false, error: 'Supplier email is required so they can see the invitation.' };
  if (lineItemIds.length === 0) return { ok: false, error: 'Select at least one line item.' };

  try {
    const batch = createRFQBatch(event, supplierName.trim(), email, lineItemIds, messageToSupplier);
    updateBatchStatus(batch.id, 'SENT');
    const sentAt = new Date().toISOString();
    const sentBatch: RFQBatch = { ...batch, status: 'SENT', sentAt };

    await syncRFQBatch(userId, sentBatch, getItemsForBatch(batch.id), event);
    await syncBatchStatus(batch.id, 'SENT', userId);

    return { ok: true, batch: sentBatch };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to create invitation.' };
  }
}
