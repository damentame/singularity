-- ─── Universal Quote Numbering ──────────────────────────────────────────────
-- Sequential "TO-000001" style code assigned once per quote at creation time.
-- This is the code that's safe to share externally (with suppliers); the
-- coordinator's own free-text job code stays internal-only.

create sequence public.quote_number_seq start with 1;

create or replace function public.next_quote_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'TO-' || lpad(nextval('public.quote_number_seq')::text, 6, '0');
$$;

grant execute on function public.next_quote_number() to authenticated;

-- ─── RFQ Messages: automated "system" sender ────────────────────────────────
-- Lets the app auto-post load-in/load-out time notices into the existing
-- coordinator<->supplier thread, visually distinct from a hand-typed message.
-- Treated identically to 'coordinator' for read-tracking purposes.

alter table public.rfq_messages drop constraint rfq_messages_sender_type_check;
alter table public.rfq_messages add constraint rfq_messages_sender_type_check
  check (sender_type in ('coordinator','supplier','system'));

create or replace function public.portal_mark_messages_read(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_batch rfq_batches; begin
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid portal token'; end if;

  update rfq_messages
  set read_by_supplier = true
  where rfq_batch_id = v_batch.id and sender_type in ('coordinator','system') and read_by_supplier = false;
end;
$$;
