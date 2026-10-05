// ─── Universal Quote Numbering ──────────────────────────────────────────────
// Allocates the sequential "TO-000001" style code from the shared Postgres
// sequence (public.quote_number_seq via the next_quote_number() RPC) so quote
// numbers are globally unique and monotonic across every coordinator, not
// just unique per-device the way the random jobCode is.

import { supabase } from '@/lib/supabase';

export async function getNextQuoteNumber(): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('next_quote_number');
    if (error || !data) throw error || new Error('empty response');
    return data as string;
  } catch (err) {
    // Deliberately blank, not a fake-looking placeholder: a non-blank value here would read as a
    // real code and would hide the "Assign Quote Number" retry control in EventDetailsCard.
    console.warn('getNextQuoteNumber: RPC failed, leaving blank for retry:', err);
    return '';
  }
}
