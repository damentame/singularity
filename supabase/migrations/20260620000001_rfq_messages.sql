-- ─── RFQ Messages ───────────────────────────────────────────────────────────
-- Two-way messaging between a coordinator and a supplier, threaded per RFQ
-- batch (one supplier's RFQ for one proposal — the same unit RFQs are already
-- batched by). Same access model as rfq_portal_tables.sql: coordinators
-- (authenticated) get full RLS-gated access to their own rows; unauthenticated
-- suppliers access data only through security-definer RPC functions that
-- validate the portal token server-side.

-- ─── rfq_messages ───────────────────────────────────────────────────────────

create table public.rfq_messages (
  id                  text        primary key,
  rfq_batch_id        text        not null references public.rfq_batches(id) on delete cascade,
  sender_type         text        not null check (sender_type in ('coordinator','supplier')),
  sender_name         text        not null default '',
  body                text        not null,
  read_by_coordinator boolean     not null default false,
  read_by_supplier    boolean     not null default false,
  created_at          timestamptz not null default now()
);

alter table public.rfq_messages enable row level security;

create policy "Coordinators can manage own batch messages"
  on public.rfq_messages for all
  using (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  )
  with check (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  );

create index idx_rfq_messages_batch_id      on public.rfq_messages(rfq_batch_id);
create index idx_rfq_messages_batch_unread  on public.rfq_messages(rfq_batch_id, read_by_coordinator);

-- ─── RPC: portal_get_messages ───────────────────────────────────────────────

create or replace function public.portal_get_messages(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch    rfq_batches;
  v_messages jsonb;
begin
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then return null; end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',         m.id,
      'rfqBatchId', m.rfq_batch_id,
      'senderType', m.sender_type,
      'senderName', m.sender_name,
      'body',       m.body,
      'createdAt',  m.created_at
    ) order by m.created_at asc
  ), '[]'::jsonb)
  into v_messages
  from rfq_messages m
  where m.rfq_batch_id = v_batch.id;

  return v_messages;
end;
$$;

grant execute on function public.portal_get_messages(text) to anon, authenticated;

-- ─── RPC: portal_post_message ───────────────────────────────────────────────

create or replace function public.portal_post_message(p_token text, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch rfq_batches;
  v_id    text;
begin
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid portal token'; end if;
  if v_batch.status in ('CANCELLED') then raise exception 'This RFQ is cancelled'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Message body cannot be empty'; end if;

  v_id := 'rfqm-' || gen_random_uuid()::text;

  insert into rfq_messages (id, rfq_batch_id, sender_type, sender_name, body)
  values (v_id, v_batch.id, 'supplier', v_batch.supplier_name, p_body);

  return jsonb_build_object(
    'id',         v_id,
    'rfqBatchId', v_batch.id,
    'senderType', 'supplier',
    'senderName', v_batch.supplier_name,
    'body',       p_body,
    'createdAt',  now()
  );
end;
$$;

grant execute on function public.portal_post_message(text, text) to anon, authenticated;

-- ─── RPC: portal_mark_messages_read ─────────────────────────────────────────

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
  where rfq_batch_id = v_batch.id and sender_type = 'coordinator' and read_by_supplier = false;
end;
$$;

grant execute on function public.portal_mark_messages_read(text) to anon, authenticated;
