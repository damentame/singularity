import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authError || !user) {
      return json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    const { action, eventId, eventData, summary, events: eventsBatch } = body;

    // ── list ────────────────────────────────────────────────────────────────
    if (action === 'list') {
      const { data, error } = await supabase
        .from('planner_events')
        .select([
          'id', 'event_id', 'name', 'event_type', 'event_date', 'end_date',
          'status', 'guest_count', 'venue', 'country', 'city', 'currency',
          'total_client_price', 'total_supplier_cost', 'margin_percent',
          'moments_count', 'line_items_count', 'last_auto_save_at',
          'created_at', 'updated_at',
        ].join(', '))
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return json({ success: true, events: data });
    }

    // ── load ────────────────────────────────────────────────────────────────
    if (action === 'load') {
      if (!eventId) return json({ success: false, error: 'eventId required' }, 400);

      const { data, error } = await supabase
        .from('planner_events')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return json({ success: true, event: data });
    }

    // ── save ────────────────────────────────────────────────────────────────
    if (action === 'save') {
      if (!eventData) return json({ success: false, error: 'eventData required' }, 400);

      const { error } = await supabase
        .from('planner_events')
        .upsert(buildRow(user.id, eventData, summary), { onConflict: 'event_id,user_id' });

      if (error) throw error;
      return json({ success: true });
    }

    // ── save-batch ──────────────────────────────────────────────────────────
    if (action === 'save-batch') {
      if (!Array.isArray(eventsBatch)) return json({ success: false, error: 'events array required' }, 400);

      const rows = eventsBatch.map(({ eventData: ed, summary: s }: { eventData: any; summary: any }) =>
        buildRow(user.id, ed, s),
      );

      const { error } = await supabase
        .from('planner_events')
        .upsert(rows, { onConflict: 'event_id,user_id' });

      if (error) throw error;
      return json({ success: true });
    }

    // ── delete ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!eventId) return json({ success: false, error: 'eventId required' }, 400);

      const { error } = await supabase
        .from('planner_events')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      return json({ success: true });
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error('manage-events error:', err);
    return json({ success: false, error: err?.message ?? 'Internal error' }, 500);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildRow(userId: string, evtData: any, summary: any) {
  return {
    event_id:            evtData.id,
    user_id:             userId,
    event_data:          evtData,
    name:                evtData.name ?? '',
    event_type:          evtData.eventType ?? 'wedding',
    event_date:          evtData.date ?? null,
    end_date:            evtData.endDate ?? null,
    status:              evtData.status ?? 'draft',
    guest_count:         evtData.guestCount ?? 0,
    venue:               evtData.venue ?? null,
    country:             evtData.country ?? null,
    city:                evtData.city ?? null,
    currency:            evtData.currency ?? 'ZAR',
    total_client_price:  summary?.totalClientPrice ?? 0,
    total_supplier_cost: summary?.totalSupplierCost ?? 0,
    margin_percent:      summary?.grossMarginPercent ?? 0,
    moments_count:       (evtData.moments ?? []).length,
    line_items_count:    (evtData.lineItems ?? []).length,
    last_auto_save_at:   new Date().toISOString(),
    updated_at:          new Date().toISOString(),
  };
}
