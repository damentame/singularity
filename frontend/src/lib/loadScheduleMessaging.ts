// ─── Automated Load-Slot Notifications ──────────────────────────────────────
// When a coordinator sets or changes a supplier's load-in/load-out time, this
// posts an automated "system" message into that supplier's existing RFQ
// thread (there is no separate transactional-email pipeline in this app -
// the RFQ message thread, polled every 5s on both sides, is the one working
// channel suppliers and coordinators actually share).

import { supabase } from '@/lib/supabase';
import { sendSystemMessage } from '@/lib/rfqMessagesApi';
import { PlannerEvent, SupplierLoadSlot } from '@/contexts/EventContext';

function formatSlotMessage(slot: SupplierLoadSlot, venueSpaceName: string): string {
  const typeLabel = slot.type === 'load_in' ? 'Load-In' : 'Load-Out';
  const dateStr = slot.date
    ? new Date(slot.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'date TBC';
  const timeStr = slot.startTime ? `${slot.startTime}${slot.endTime ? '–' + slot.endTime : ''}` : 'time TBC';
  const label = slot.label ? ` (${slot.label})` : '';
  const space = venueSpaceName ? ` @ ${venueSpaceName}` : '';
  return `📅 ${typeLabel} scheduled${label}: ${dateStr}, ${timeStr}${space}.`;
}

// Returns true if at least one RFQ batch (i.e. this supplier has actually been sent a quote
// request for this event) received the notice. False just means there's nothing to notify yet.
export async function notifySupplierOfLoadSlot(event: PlannerEvent, slot: SupplierLoadSlot): Promise<boolean> {
  try {
    const { data: batches, error } = await supabase
      .from('rfq_batches')
      .select('id, supplier_email, supplier_name')
      .eq('event_id', event.id);

    if (error || !batches || batches.length === 0) return false;

    const emailKey = slot.supplierEmail.trim().toLowerCase();
    const nameKey = slot.supplierName.trim().toLowerCase();
    const matches = batches.filter(b => {
      const bEmail = (b.supplier_email || '').trim().toLowerCase();
      if (emailKey && bEmail) return bEmail === emailKey;
      return (b.supplier_name || '').trim().toLowerCase() === nameKey;
    });
    if (matches.length === 0) return false;

    const venueSpace = (event.venueSpaces || []).find(s => s.id === slot.venueSpaceId);
    const body = formatSlotMessage(slot, venueSpace?.name || '');

    const results = await Promise.all(matches.map(b => sendSystemMessage(b.id, body)));
    return results.some(r => r !== null);
  } catch (err) {
    console.warn('notifySupplierOfLoadSlot failed:', err);
    return false;
  }
}
