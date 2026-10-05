// ─── RFQ Messages API ───────────────────────────────────────────────────────
// Two-way messaging between a coordinator and a supplier, threaded per RFQ
// batch. Supabase-primary on both sides (no localStorage fallback) since a
// conversation is inherently live and cross-device. Coordinators (authenticated)
// use direct table access gated by RLS; suppliers (unauthenticated, portal-token
// only) go through security-definer RPCs, matching rfqPortalApi.ts's pattern.

import { supabase } from '@/lib/supabase';

export interface RFQThreadMessage {
  id: string;
  rfqBatchId: string;
  senderType: 'coordinator' | 'supplier' | 'system';
  senderName: string;
  body: string;
  createdAt: string;
}

// ─── Coordinator side (direct table access, RLS-gated) ─────────────────────

export async function getMessagesForBatch(batchId: string): Promise<RFQThreadMessage[]> {
  const { data, error } = await supabase
    .from('rfq_messages')
    .select('*')
    .eq('rfq_batch_id', batchId)
    .order('created_at', { ascending: true });

  if (error) { console.error('getMessagesForBatch error:', error); return []; }
  return (data || []).map(rowToMessage);
}

export async function sendCoordinatorMessage(
  batchId: string,
  body: string,
  senderName: string,
): Promise<RFQThreadMessage | null> {
  const { data, error } = await supabase
    .from('rfq_messages')
    .insert({
      id: `rfqm-${crypto.randomUUID()}`,
      rfq_batch_id: batchId,
      sender_type: 'coordinator',
      sender_name: senderName,
      body,
    })
    .select()
    .single();

  if (error) { console.error('sendCoordinatorMessage error:', error); return null; }
  return rowToMessage(data);
}

/** Auto-posted notice (e.g. a load-in/load-out time) - rendered distinctly from a hand-typed coordinator message. */
export async function sendSystemMessage(batchId: string, body: string): Promise<RFQThreadMessage | null> {
  const { data, error } = await supabase
    .from('rfq_messages')
    .insert({
      id: `rfqm-${crypto.randomUUID()}`,
      rfq_batch_id: batchId,
      sender_type: 'system',
      sender_name: 'Automated Notice',
      body,
    })
    .select()
    .single();

  if (error) { console.error('sendSystemMessage error:', error); return null; }
  return rowToMessage(data);
}

export async function markMessagesReadByCoordinator(batchId: string): Promise<void> {
  const { error } = await supabase
    .from('rfq_messages')
    .update({ read_by_coordinator: true })
    .eq('rfq_batch_id', batchId)
    .eq('sender_type', 'supplier')
    .eq('read_by_coordinator', false);

  if (error) console.warn('markMessagesReadByCoordinator failed:', error);
}

/** Unread (supplier-authored, unread-by-coordinator) message counts, keyed by batch id, for every batch belonging to userId. */
export async function getUnreadCountsByBatch(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('rfq_messages')
    .select('rfq_batch_id, rfq_batches!inner(user_id)')
    .eq('sender_type', 'supplier')
    .eq('read_by_coordinator', false)
    .eq('rfq_batches.user_id', userId);

  if (error) { console.error('getUnreadCountsByBatch error:', error); return {}; }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.rfq_batch_id] = (counts[row.rfq_batch_id] || 0) + 1;
  }
  return counts;
}

export interface RecentBatchMessage {
  batchId: string;
  supplierName: string;
  message: RFQThreadMessage;
  unread: boolean;
}

/** Latest message per RFQ batch belonging to this event, newest first. */
export async function getRecentMessagesForEvent(eventId: string): Promise<RecentBatchMessage[]> {
  const { data: batches, error: batchError } = await supabase
    .from('rfq_batches')
    .select('id, supplier_name')
    .eq('event_id', eventId);

  if (batchError || !batches || batches.length === 0) return [];

  const { data: messages, error: msgError } = await supabase
    .from('rfq_messages')
    .select('*')
    .in('rfq_batch_id', batches.map(b => b.id))
    .order('created_at', { ascending: false });

  if (msgError || !messages) return [];

  const supplierNameByBatch = Object.fromEntries(batches.map(b => [b.id, b.supplier_name]));
  const seen = new Set<string>();
  const recent: RecentBatchMessage[] = [];

  for (const row of messages) {
    if (seen.has(row.rfq_batch_id)) continue;
    seen.add(row.rfq_batch_id);
    recent.push({
      batchId: row.rfq_batch_id,
      supplierName: supplierNameByBatch[row.rfq_batch_id] || 'Supplier',
      message: rowToMessage(row),
      unread: row.sender_type === 'supplier' && !row.read_by_coordinator,
    });
  }

  return recent;
}

function rowToMessage(row: any): RFQThreadMessage {
  return {
    id: row.id,
    rfqBatchId: row.rfq_batch_id,
    senderType: row.sender_type,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

// ─── Supplier portal side (token-gated RPCs) ────────────────────────────────

export async function getPortalMessages(token: string): Promise<RFQThreadMessage[]> {
  try {
    const { data, error } = await supabase.rpc('portal_get_messages', { p_token: token });
    if (error || !data) return [];
    return (data as any[]).map(m => ({
      id: m.id,
      rfqBatchId: m.rfqBatchId,
      senderType: m.senderType,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function postPortalMessage(token: string, body: string): Promise<RFQThreadMessage | null> {
  try {
    const { data, error } = await supabase.rpc('portal_post_message', { p_token: token, p_body: body });
    if (error || !data) { console.error('postPortalMessage error:', error); return null; }
    const m = data as any;
    return {
      id: m.id,
      rfqBatchId: m.rfqBatchId,
      senderType: m.senderType,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
    };
  } catch (err) {
    console.error('postPortalMessage failed:', err);
    return null;
  }
}

export async function markPortalMessagesRead(token: string): Promise<void> {
  try {
    await supabase.rpc('portal_mark_messages_read', { p_token: token });
  } catch (err) {
    console.warn('markPortalMessagesRead failed:', err);
  }
}
