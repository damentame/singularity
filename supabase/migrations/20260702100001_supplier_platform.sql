-- ─── Supplier Platform: authenticated supplier access ──────────────────────────
-- Lets a supplier who creates a real account (profiles.role='supplier') see and
-- act on exactly the RFQ invitations addressed to their email - no new invite
-- mechanism needed, since a coordinator already "invites" a supplier simply by
-- putting their email on an rfq_batches row. Keyed off auth.email() (the live
-- JWT claim), not profiles.email, since profiles.email only syncs on insert and
-- would go stale if a user changed their login email later.
-- The anonymous portal_token flow is untouched and keeps working as-is for
-- suppliers who never create an account - every RPC below treats p_token as the
-- primary path and only falls back to email-match when it's omitted.

-- ─── rfq_batches: suppliers can see their own invitations, plus respond ────────

create policy "Suppliers can view own invitations by email"
  on public.rfq_batches for select
  using (lower(trim(supplier_email)) = lower(auth.email()));

alter table public.rfq_batches
  add column invitation_response text check (invitation_response in ('accepted', 'declined')),
  add column invitation_responded_at timestamptz;

-- ─── rfq_messages: suppliers can read/send/mark-read on their own batches ──────
-- Mirrors "Coordinators can manage own batch messages" exactly, just keyed by
-- email match instead of user_id match - same table, same sender_type check
-- constraint already allows 'supplier'. This means an authenticated supplier
-- uses the exact same direct-table functions the coordinator side already uses;
-- only the anonymous portal needs its own token-gated RPCs.

create policy "Suppliers can manage own batch messages by email"
  on public.rfq_messages for all
  using (
    exists (
      select 1 from rfq_batches b
      where b.id = rfq_batch_id and lower(trim(b.supplier_email)) = lower(auth.email())
    )
  )
  with check (
    exists (
      select 1 from rfq_batches b
      where b.id = rfq_batch_id and lower(trim(b.supplier_email)) = lower(auth.email())
    )
  );

-- ─── RPC: supplier_respond_to_invitation ────────────────────────────────────────
-- A dedicated RPC (rather than a broad UPDATE RLS policy) so an authenticated
-- supplier can only ever touch these two columns, not rewrite their own
-- supplier_name/status/portal_token/etc.

create or replace function public.supplier_respond_to_invitation(p_batch_id text, p_response text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_batch rfq_batches; begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'Invalid response';
  end if;

  select * into v_batch from rfq_batches where id = p_batch_id;
  if not found then raise exception 'Invitation not found'; end if;
  if lower(trim(v_batch.supplier_email)) <> lower(auth.email()) then
    raise exception 'Not authorized';
  end if;

  update rfq_batches
  set invitation_response = p_response, invitation_responded_at = now()
  where id = p_batch_id;
end;
$$;

grant execute on function public.supplier_respond_to_invitation(text, text) to authenticated;

-- ─── portal_get_data / portal_save_quote: add an authenticated-email path ──────
-- Both RPCs gain an optional p_batch_id so an authenticated supplier can call
-- them without a token; dropped first since adding a parameter changes the
-- function's signature (CREATE OR REPLACE would otherwise leave the old
-- single-argument overload sitting alongside the new one instead of replacing it).

drop function if exists public.portal_get_data(text);

create or replace function public.portal_get_data(p_token text default null, p_batch_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch      rfq_batches;
  v_items      jsonb;
  v_draft      jsonb;
  v_submitted  jsonb;
  v_docs       jsonb;
begin
  if p_token is not null then
    select * into v_batch from rfq_batches where portal_token = p_token;
  elsif p_batch_id is not null then
    select * into v_batch from rfq_batches where id = p_batch_id;
    if found and lower(trim(v_batch.supplier_email)) <> lower(auth.email()) then
      return null;
    end if;
  end if;
  if not found then return null; end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',                         i.id,
      'rfqBatchId',                 i.rfq_batch_id,
      'lineItemId',                 i.line_item_id,
      'itemNameSnapshot',           i.item_name_snapshot,
      'qtySnapshot',                i.qty_snapshot,
      'unitTypeSnapshot',           i.unit_type_snapshot,
      'momentIdSnapshot',           i.moment_id_snapshot,
      'spaceIdSnapshot',            i.space_id_snapshot,
      'installationLabelSnapshot',  i.installation_label_snapshot,
      'itemNotesSnapshot',          i.item_notes_snapshot,
      'categorySnapshot',           i.category_snapshot,
      'createdAt',                  i.created_at
    )
  ), '[]'::jsonb)
  into v_items
  from rfq_batch_items i
  where i.rfq_batch_id = v_batch.id;

  select jsonb_build_object(
    'id',            qv.id,
    'type',          qv.type,
    'versionNumber', qv.version_number,
    'supplierNotes', qv.supplier_notes,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rfqBatchItemId',           qi.rfq_batch_item_id,
        'supplierUnitPriceInput',   qi.supplier_unit_price_input,
        'supplierPriceIncludesVat', qi.supplier_price_includes_vat,
        'vatRateUsed',              qi.vat_rate_used,
        'currency',                 qi.currency,
        'leadTimeDays',             qi.lead_time_days,
        'availabilityNotes',        qi.availability_notes
      )), '[]'::jsonb)
      from supplier_quote_items qi where qi.quote_version_id = qv.id
    )
  )
  into v_draft
  from supplier_quote_versions qv
  where qv.rfq_batch_id = v_batch.id and qv.type = 'DRAFT_SAVE'
  order by qv.version_number desc limit 1;

  select jsonb_build_object(
    'id',            qv.id,
    'type',          qv.type,
    'versionNumber', qv.version_number,
    'supplierNotes', qv.supplier_notes,
    'totals', jsonb_build_object('net', qv.total_net, 'vat', qv.total_vat, 'gross', qv.total_gross),
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'rfqBatchItemId',           qi.rfq_batch_item_id,
        'supplierUnitPriceInput',   qi.supplier_unit_price_input,
        'supplierPriceIncludesVat', qi.supplier_price_includes_vat,
        'vatRateUsed',              qi.vat_rate_used,
        'currency',                 qi.currency,
        'leadTimeDays',             qi.lead_time_days,
        'availabilityNotes',        qi.availability_notes
      )), '[]'::jsonb)
      from supplier_quote_items qi where qi.quote_version_id = qv.id
    )
  )
  into v_submitted
  from supplier_quote_versions qv
  where qv.rfq_batch_id = v_batch.id and qv.type = 'SUBMITTED'
  order by qv.version_number desc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',         d.id,
    'rfqBatchId', d.rfq_batch_id,
    'fileName',   d.file_name,
    'fileUrl',    d.file_url,
    'fileSize',   d.file_size,
    'mimeType',   d.mime_type,
    'uploadedAt', d.uploaded_at
  )), '[]'::jsonb)
  into v_docs
  from supplier_rfq_documents d
  where d.rfq_batch_id = v_batch.id;

  return jsonb_build_object(
    'batch', jsonb_build_object(
      'id',                          v_batch.id,
      'eventId',                     v_batch.event_id,
      'supplierName',                v_batch.supplier_name,
      'supplierEmail',               v_batch.supplier_email,
      'status',                      v_batch.status,
      'portalToken',                 v_batch.portal_token,
      'messageToSupplier',           v_batch.message_to_supplier,
      'includeVatInfo',              v_batch.include_vat_info,
      'includeMomentSpaceContext',   v_batch.include_moment_space_context,
      'currentSupplierDraftVersion', v_batch.current_supplier_draft_version,
      'currentSubmittedVersion',     v_batch.current_submitted_version,
      'sentAt',                      v_batch.sent_at,
      'acceptedAt',                  v_batch.accepted_at,
      'lastSupplierSaveAt',          v_batch.last_supplier_save_at,
      'createdAt',                   v_batch.created_at,
      'eventContext',                v_batch.event_context,
      'invitationResponse',          v_batch.invitation_response,
      'invitationRespondedAt',       v_batch.invitation_responded_at
    ),
    'batchItems',      v_items,
    'latestDraft',     v_draft,
    'latestSubmitted', v_submitted,
    'documents',       v_docs
  );
end;
$$;

grant execute on function public.portal_get_data(text, text) to anon, authenticated;

drop function if exists public.portal_save_quote(text, text, jsonb, text, numeric, boolean);

create or replace function public.portal_save_quote(
  p_token           text default null,
  p_type            text default 'SUBMITTED',
  p_items           jsonb default '[]'::jsonb,
  p_notes           text default '',
  p_vat_rate        numeric default 0,
  p_default_inc_vat boolean default true,
  p_batch_id        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch       rfq_batches;
  v_version_num integer;
  v_qv_id       text;
  v_item        jsonb;
  v_qty         integer;
  v_price       numeric;
  v_inc_vat     boolean;
  v_vat_rate    numeric;
  v_total_net   numeric := 0;
  v_total_vat   numeric := 0;
  v_total_gross numeric := 0;
  v_net numeric; v_vat numeric; v_gross numeric;
begin
  if p_token is not null then
    select * into v_batch from rfq_batches where portal_token = p_token;
    if not found then raise exception 'Invalid portal token'; end if;
  elsif p_batch_id is not null then
    select * into v_batch from rfq_batches where id = p_batch_id;
    if not found then raise exception 'Invalid batch'; end if;
    if lower(trim(v_batch.supplier_email)) <> lower(auth.email()) then
      raise exception 'Not authorized';
    end if;
  else
    raise exception 'Either p_token or p_batch_id is required';
  end if;

  if v_batch.status in ('ACCEPTED','LOCKED','CANCELLED') then
    raise exception 'This RFQ is locked';
  end if;

  if p_type = 'SUBMITTED' then
    v_version_num := v_batch.current_submitted_version + 1;
  else
    v_version_num := v_batch.current_supplier_draft_version + 1;
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select coalesce(qty_snapshot, 1) into v_qty
    from rfq_batch_items
    where id = (v_item->>'rfqBatchItemId') and rfq_batch_id = v_batch.id;

    v_qty      := coalesce(v_qty, 1);
    v_price    := coalesce((v_item->>'supplierUnitPriceInput')::numeric, 0);
    v_inc_vat  := coalesce((v_item->>'supplierPriceIncludesVat')::boolean, p_default_inc_vat);
    v_vat_rate := coalesce((v_item->>'vatRateUsed')::numeric, p_vat_rate);

    if v_inc_vat then
      v_gross := v_price * v_qty;
      v_net   := v_gross / (1 + v_vat_rate);
      v_vat   := v_gross - v_net;
    else
      v_net   := v_price * v_qty;
      v_vat   := v_net * v_vat_rate;
      v_gross := v_net + v_vat;
    end if;

    v_total_net   := v_total_net   + v_net;
    v_total_vat   := v_total_vat   + v_vat;
    v_total_gross := v_total_gross + v_gross;
  end loop;

  v_qv_id := 'sqv-' || gen_random_uuid()::text;

  insert into supplier_quote_versions (
    id, rfq_batch_id, version_number, type, supplier_notes,
    total_net, total_vat, total_gross, submitted_at
  ) values (
    v_qv_id, v_batch.id, v_version_num, p_type, p_notes,
    round(v_total_net,2), round(v_total_vat,2), round(v_total_gross,2),
    case when p_type = 'SUBMITTED' then now() else null end
  );

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into supplier_quote_items (
      quote_version_id, rfq_batch_item_id,
      supplier_unit_price_input, supplier_price_includes_vat,
      vat_rate_used, currency, lead_time_days, availability_notes
    ) values (
      v_qv_id,
      (v_item->>'rfqBatchItemId'),
      coalesce((v_item->>'supplierUnitPriceInput')::numeric, 0),
      coalesce((v_item->>'supplierPriceIncludesVat')::boolean, p_default_inc_vat),
      coalesce((v_item->>'vatRateUsed')::numeric, p_vat_rate),
      coalesce(v_item->>'currency', 'ZAR'),
      coalesce((v_item->>'leadTimeDays')::integer, 0),
      coalesce(v_item->>'availabilityNotes', '')
    );
  end loop;

  if p_type = 'SUBMITTED' then
    update rfq_batches set
      current_submitted_version = v_version_num,
      status = case when v_version_num > 1 then 'REVISED' else 'QUOTED' end,
      last_supplier_save_at = now(), updated_at = now()
    where id = v_batch.id;
  else
    update rfq_batches set
      current_supplier_draft_version = v_version_num,
      last_supplier_save_at = now(), updated_at = now()
    where id = v_batch.id;
  end if;

  return jsonb_build_object(
    'quoteVersionId', v_qv_id,
    'versionNumber',  v_version_num,
    'type',           p_type,
    'totals', jsonb_build_object(
      'net',   round(v_total_net,2),
      'vat',   round(v_total_vat,2),
      'gross', round(v_total_gross,2)
    )
  );
end;
$$;

grant execute on function public.portal_save_quote(text, text, jsonb, text, numeric, boolean, text) to anon, authenticated;

-- ─── service_providers: contact fields the wizard already collects but never ───
-- ─── had columns for, plus a special-requests flag ─────────────────────────────

alter table public.service_providers
  add column contact_name text not null default '',
  add column contact_email text not null default '',
  add column contact_phone text not null default '',
  add column alternate_phone text not null default '',
  add column accepts_special_requests boolean not null default false,
  add column special_request_notes text not null default '';

-- ─── supplier_products: catalog (name, price, qty, colour, description) ───────

create table public.supplier_products (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  description         text not null default '',
  category            text not null default '',
  unit_price          numeric(14,2) not null default 0,
  currency            text not null default 'ZAR',
  quantity_available  integer,            -- null = unlimited / made to order
  color               text not null default '',
  is_active           boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger supplier_products_updated_at
  before update on public.supplier_products
  for each row execute function public.set_updated_at();

create index idx_supplier_products_user_id on public.supplier_products(user_id);

alter table public.supplier_products enable row level security;

create policy "Suppliers manage own products"
  on public.supplier_products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
