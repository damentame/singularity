-- ─── General Inquiry: "Request a Quote" from the real supplier directory ──────
-- SearchProviders.tsx lists real, onboarded service_providers and lets a host/
-- coordinator request a quote from one. Until now that button only wrote to
-- local React state (addBookingRequest/handleSubmitQuote) and never reached the
-- supplier - confirmed by reading both call sites, neither ever touched
-- Supabase. This RPC makes that real: it creates a genuine rfq_batches row
-- (status SENT, zero line items - this is a general enquiry, not a structured
-- RFQ) addressed to the provider's real email, so it shows up through the
-- exact same authenticated-supplier RLS/UI already built for the event-based
-- Sourcing flow (My Invitations, the new Messages inbox, etc).
--
-- service_providers has no email column (and shouldn't be made publicly
-- selectable just for this), so the lookup happens here, server-side, via
-- security definer - the caller only ever passes a user_id it already has
-- (service_providers.user_id is public), and the raw email is never returned
-- to the client, only used internally to populate rfq_batches.supplier_email.

create or replace function public.create_general_inquiry(
  p_provider_user_id uuid,
  p_supplier_name text,
  p_message text,
  p_event_context jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    text;
  v_batch_id text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = p_provider_user_id;
  if v_email is null then
    raise exception 'Provider not found';
  end if;

  v_batch_id := 'rfqb-' || replace(gen_random_uuid()::text, '-', '');

  insert into rfq_batches (
    id, event_id, user_id, supplier_name, supplier_email, status,
    portal_token, message_to_supplier, event_context, sent_at
  ) values (
    v_batch_id,
    'inquiry-' || v_batch_id,
    auth.uid(),
    p_supplier_name,
    v_email,
    'SENT',
    replace(gen_random_uuid()::text, '-', ''),
    p_message,
    p_event_context,
    now()
  );

  return v_batch_id;
end;
$$;

grant execute on function public.create_general_inquiry(uuid, text, text, jsonb) to authenticated;
