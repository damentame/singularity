-- ─── RFQ Portal Tables ────────────────────────────────────────────────────────
-- Backs the supplier portal so quotes are readable on any device via token.
-- RLS allows coordinators (authenticated) full access to their own rows.
-- Unauthenticated suppliers access data only through security-definer RPC
-- functions that validate the portal token server-side.

-- ─── rfq_batches ──────────────────────────────────────────────────────────────

create table public.rfq_batches (
  id                              text          primary key,
  event_id                        text          not null,
  user_id                         uuid          not null references auth.users(id) on delete cascade,
  supplier_name                   text          not null,
  supplier_email                  text          not null default '',
  status                          text          not null default 'DRAFT'
                                                  check (status in ('DRAFT','SENT','QUOTED','REVISED','ACCEPTED','LOCKED','CANCELLED')),
  portal_token                    text          not null unique,
  message_to_supplier             text          not null default '',
  include_vat_info                boolean       not null default true,
  include_moment_space_context    boolean       not null default true,
  current_supplier_draft_version  integer       not null default 0,
  current_submitted_version       integer       not null default 0,
  -- Snapshot of event context needed by the portal (currency, VAT, moments, etc.)
  event_context                   jsonb         not null default '{}',
  sent_at                         timestamptz,
  accepted_at                     timestamptz,
  last_supplier_save_at           timestamptz,
  created_at                      timestamptz   not null default now(),
  updated_at                      timestamptz   not null default now()
);

create trigger rfq_batches_updated_at
  before update on public.rfq_batches
  for each row execute function public.set_updated_at();

alter table public.rfq_batches enable row level security;

create policy "Coordinators can manage own RFQ batches"
  on public.rfq_batches for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_rfq_batches_event_id     on public.rfq_batches(event_id);
create index idx_rfq_batches_portal_token on public.rfq_batches(portal_token);

-- ─── rfq_batch_items ──────────────────────────────────────────────────────────

create table public.rfq_batch_items (
  id                            text        primary key,
  rfq_batch_id                  text        not null references public.rfq_batches(id) on delete cascade,
  line_item_id                  text        not null,
  item_name_snapshot            text        not null default '',
  qty_snapshot                  integer     not null default 1,
  unit_type_snapshot            text        not null default 'EACH',
  moment_id_snapshot            text        not null default '',
  space_id_snapshot             text        not null default '',
  installation_label_snapshot   text        not null default '',
  item_notes_snapshot           text        not null default '',
  category_snapshot             text        not null default '',
  created_at                    timestamptz not null default now()
);

alter table public.rfq_batch_items enable row level security;

create policy "Coordinators can manage own batch items"
  on public.rfq_batch_items for all
  using (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  )
  with check (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  );

create index idx_rfq_batch_items_batch_id on public.rfq_batch_items(rfq_batch_id);

-- ─── supplier_quote_versions ──────────────────────────────────────────────────

create table public.supplier_quote_versions (
  id             text          primary key,
  rfq_batch_id   text          not null references public.rfq_batches(id) on delete cascade,
  version_number integer       not null,
  type           text          not null check (type in ('DRAFT_SAVE','SUBMITTED')),
  supplier_notes text          not null default '',
  total_net      numeric(14,2) not null default 0,
  total_vat      numeric(14,2) not null default 0,
  total_gross    numeric(14,2) not null default 0,
  created_at     timestamptz   not null default now(),
  submitted_at   timestamptz
);

alter table public.supplier_quote_versions enable row level security;

create policy "Coordinators can read own quote versions"
  on public.supplier_quote_versions for select
  using (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  );

create index idx_sqv_batch_id on public.supplier_quote_versions(rfq_batch_id);

-- ─── supplier_quote_items ─────────────────────────────────────────────────────

create table public.supplier_quote_items (
  id                           uuid          primary key default gen_random_uuid(),
  quote_version_id             text          not null references public.supplier_quote_versions(id) on delete cascade,
  rfq_batch_item_id            text          not null references public.rfq_batch_items(id) on delete cascade,
  supplier_unit_price_input    numeric(14,2) not null default 0,
  supplier_price_includes_vat  boolean       not null default true,
  vat_rate_used                numeric(6,4)  not null default 0,
  currency                     text          not null default 'ZAR',
  lead_time_days               integer       not null default 0,
  availability_notes           text          not null default ''
);

alter table public.supplier_quote_items enable row level security;

create policy "Coordinators can read own quote items"
  on public.supplier_quote_items for select
  using (
    exists (
      select 1 from supplier_quote_versions sqv
      join rfq_batches b on b.id = sqv.rfq_batch_id
      where sqv.id = quote_version_id and b.user_id = auth.uid()
    )
  );

create index idx_sqi_quote_version_id on public.supplier_quote_items(quote_version_id);

-- ─── supplier_rfq_documents ───────────────────────────────────────────────────

create table public.supplier_rfq_documents (
  id           text        primary key,
  rfq_batch_id text        not null references public.rfq_batches(id) on delete cascade,
  file_name    text        not null,
  file_url     text        not null,
  file_size    integer,
  mime_type    text,
  uploaded_at  timestamptz not null default now()
);

alter table public.supplier_rfq_documents enable row level security;

create policy "Coordinators can read own RFQ documents"
  on public.supplier_rfq_documents for select
  using (
    exists (select 1 from rfq_batches b where b.id = rfq_batch_id and b.user_id = auth.uid())
  );

create index idx_rfq_docs_batch_id on public.supplier_rfq_documents(rfq_batch_id);

-- ─── Storage: allow portal (anon) uploads to rfq-docs/ ───────────────────────
-- Suppliers are not authenticated; their uploads go into supplier-media/rfq-docs/
-- The rfq_batch_item_id is included in the path for audit purposes.
-- Metadata is persisted via portal_save_document RPC (token-validated).

create policy "Portal anon uploads to rfq-docs folder"
  on storage.objects for insert
  with check (
    bucket_id = 'supplier-media'
    and (storage.foldername(name))[1] = 'rfq-docs'
  );

-- ─── RPC: portal_get_data ─────────────────────────────────────────────────────
-- Returns all data the portal needs for a given token.
-- Runs as security definer so anon role can read protected tables.

create or replace function public.portal_get_data(p_token text)
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
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then return null; end if;

  -- Batch items
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

  -- Latest draft
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

  -- Latest submitted
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

  -- Attached documents
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
      'eventContext',                v_batch.event_context
    ),
    'batchItems',      v_items,
    'latestDraft',     v_draft,
    'latestSubmitted', v_submitted,
    'documents',       v_docs
  );
end;
$$;

grant execute on function public.portal_get_data(text) to anon, authenticated;

-- ─── RPC: portal_save_quote ───────────────────────────────────────────────────

create or replace function public.portal_save_quote(
  p_token           text,
  p_type            text,
  p_items           jsonb,
  p_notes           text,
  p_vat_rate        numeric,
  p_default_inc_vat boolean
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
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid portal token'; end if;
  if v_batch.status in ('ACCEPTED','LOCKED','CANCELLED') then
    raise exception 'This RFQ is locked';
  end if;

  if p_type = 'SUBMITTED' then
    v_version_num := v_batch.current_submitted_version + 1;
  else
    v_version_num := v_batch.current_supplier_draft_version + 1;
  end if;

  -- Calculate totals
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

grant execute on function public.portal_save_quote(text, text, jsonb, text, numeric, boolean) to anon, authenticated;

-- ─── RPC: portal_save_document ────────────────────────────────────────────────

create or replace function public.portal_save_document(
  p_token      text,
  p_doc_id     text,
  p_file_name  text,
  p_file_url   text,
  p_file_size  integer,
  p_mime_type  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_batch rfq_batches; begin
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid portal token'; end if;

  insert into supplier_rfq_documents (id, rfq_batch_id, file_name, file_url, file_size, mime_type)
  values (p_doc_id, v_batch.id, p_file_name, p_file_url, p_file_size, p_mime_type)
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.portal_save_document(text, text, text, text, integer, text) to anon, authenticated;

-- ─── RPC: portal_remove_document ─────────────────────────────────────────────

create or replace function public.portal_remove_document(p_token text, p_doc_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_batch rfq_batches; begin
  select * into v_batch from rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid portal token'; end if;

  delete from supplier_rfq_documents where id = p_doc_id and rfq_batch_id = v_batch.id;
end;
$$;

grant execute on function public.portal_remove_document(text, text) to anon, authenticated;
