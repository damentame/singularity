// ─── Receipt Uploads ─────────────────────────────────────────────────────────
// Manages physical receipt / invoice uploads for coordinators.

import { supabase } from '@/lib/supabase';

export type PaymentMethod = 'cash' | 'card' | 'eft' | 'other';

export interface EventReceipt {
  id: string;
  eventId: string;
  userId: string;
  vendor: string;
  amount: number;
  currency: string;
  receiptDate: string | null;
  category: string;
  description: string;
  paymentMethod: PaymentMethod | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  lineItemId: string | null;
  uploadedAt: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  eft: 'EFT',
  other: 'Other',
};

function mapRow(row: any): EventReceipt {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    vendor: row.vendor,
    amount: Number(row.amount),
    currency: row.currency || 'ZAR',
    receiptDate: row.receipt_date || null,
    category: row.category || '',
    description: row.description || '',
    paymentMethod: row.payment_method || null,
    filePath: row.file_path || null,
    fileName: row.file_name || null,
    fileSize: row.file_size || null,
    fileType: row.file_type || null,
    lineItemId: row.line_item_id || null,
    uploadedAt: row.uploaded_at,
  };
}

export async function getReceipts(eventId: string): Promise<EventReceipt[]> {
  const { data, error } = await supabase
    .from('event_receipts')
    .select('*')
    .eq('event_id', eventId)
    .order('receipt_date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function uploadReceipt(
  file: File,
  eventId: string,
  userId: string,
  meta: {
    vendor: string;
    amount: number;
    currency: string;
    receiptDate: string;
    category: string;
    description: string;
    paymentMethod: PaymentMethod | null;
    lineItemId?: string;
  },
): Promise<EventReceipt | null> {
  const ext = file.name.split('.').pop() || 'pdf';
  const filePath = `${userId}/${eventId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('event-receipts')
    .upload(filePath, file, { upsert: false });
  if (uploadErr) { console.error('Receipt upload error:', uploadErr); return null; }

  const { data, error: insertErr } = await supabase
    .from('event_receipts')
    .insert({
      event_id: eventId,
      user_id: userId,
      vendor: meta.vendor,
      amount: meta.amount,
      currency: meta.currency,
      receipt_date: meta.receiptDate || null,
      category: meta.category,
      description: meta.description,
      payment_method: meta.paymentMethod,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      line_item_id: meta.lineItemId || null,
    })
    .select()
    .single();

  if (insertErr || !data) {
    await supabase.storage.from('event-receipts').remove([filePath]);
    return null;
  }
  return mapRow(data);
}

export async function deleteReceipt(receiptId: string, filePath: string | null): Promise<void> {
  if (filePath) {
    await supabase.storage.from('event-receipts').remove([filePath]);
  }
  await supabase.from('event_receipts').delete().eq('id', receiptId);
}

export async function getReceiptUrl(filePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('event-receipts')
    .createSignedUrl(filePath, 3600);
  return data?.signedUrl || null;
}
