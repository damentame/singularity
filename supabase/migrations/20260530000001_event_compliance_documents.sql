-- ─── Event Compliance Documents ───────────────────────────────────────────────
-- Per-event compliance documents (liquor license, municipal approvals, etc.)
-- uploaded by coordinators or suppliers (via portal token).

create table public.event_compliance_documents (
  id                uuid        primary key default gen_random_uuid(),
  event_id          text        not null,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  uploaded_by_role  text        not null default 'coordinator'
                    check (uploaded_by_role in ('coordinator', 'supplier')),
  uploaded_by_name  text        not null default '',
  document_type     text        not null,
  title             text        not null,
  issued_by         text        not null default '',
  issue_date        date,
  expiry_date       date,
  file_name         text        not null,
  file_path         text        not null,
  file_size         integer     not null default 0,
  mime_type         text        not null default '',
  notes             text        not null default '',
  uploaded_at       timestamptz not null default now()
);

alter table public.event_compliance_documents enable row level security;

-- Coordinators: full access to compliance docs for their own events
create policy "Coordinators manage own event compliance docs"
  on public.event_compliance_documents for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_ecd_event_id  on public.event_compliance_documents(event_id);
create index idx_ecd_user_id   on public.event_compliance_documents(user_id);
create index idx_ecd_expiry    on public.event_compliance_documents(expiry_date);

-- ─── Storage Bucket ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-compliance-docs',
  'event-compliance-docs',
  false,
  20971520,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Authenticated coordinators: full access under their uid/ prefix
create policy "Coordinator compliance upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-compliance-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Coordinator compliance read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-compliance-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Coordinator compliance delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-compliance-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anon suppliers: upload/read under portal/ prefix only (validated via RPC)
create policy "Portal supplier compliance upload"
  on storage.objects for insert to anon
  with check (
    bucket_id = 'event-compliance-docs'
    and (storage.foldername(name))[1] = 'portal'
  );

create policy "Portal supplier compliance read"
  on storage.objects for select to anon
  using (
    bucket_id = 'event-compliance-docs'
    and (storage.foldername(name))[1] = 'portal'
  );

-- ─── Portal RPCs (security definer — anon suppliers use these) ─────────────────

create or replace function portal_save_compliance_doc(
  p_token         text,
  p_doc_id        uuid,
  p_event_id      text,
  p_doc_type      text,
  p_title         text,
  p_issued_by     text,
  p_issue_date    date,
  p_expiry_date   date,
  p_file_name     text,
  p_file_path     text,
  p_file_size     integer,
  p_mime_type     text,
  p_notes         text,
  p_supplier_name text
) returns void
language plpgsql security definer as $$
declare
  v_batch public.rfq_batches%rowtype;
begin
  select * into v_batch from public.rfq_batches where portal_token = p_token;
  if not found then raise exception 'Invalid token'; end if;
  if v_batch.event_id != p_event_id then raise exception 'Event mismatch'; end if;

  insert into public.event_compliance_documents (
    id, event_id, user_id, uploaded_by_role, uploaded_by_name,
    document_type, title, issued_by, issue_date, expiry_date,
    file_name, file_path, file_size, mime_type, notes
  ) values (
    p_doc_id, p_event_id, v_batch.user_id, 'supplier', p_supplier_name,
    p_doc_type, p_title, p_issued_by, p_issue_date, p_expiry_date,
    p_file_name, p_file_path, p_file_size, p_mime_type, p_notes
  )
  on conflict (id) do update set
    document_type    = excluded.document_type,
    title            = excluded.title,
    issued_by        = excluded.issued_by,
    issue_date       = excluded.issue_date,
    expiry_date      = excluded.expiry_date,
    notes            = excluded.notes;
end;
$$;

create or replace function portal_get_compliance_docs(p_token text)
returns jsonb
language plpgsql security definer as $$
declare
  v_batch public.rfq_batches%rowtype;
  v_docs  jsonb;
begin
  select * into v_batch from public.rfq_batches where portal_token = p_token;
  if not found then return '[]'::jsonb; end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',               d.id,
      'event_id',         d.event_id,
      'user_id',          d.user_id,
      'uploaded_by_role', d.uploaded_by_role,
      'uploaded_by_name', d.uploaded_by_name,
      'document_type',    d.document_type,
      'title',            d.title,
      'issued_by',        d.issued_by,
      'issue_date',       d.issue_date,
      'expiry_date',      d.expiry_date,
      'file_name',        d.file_name,
      'file_path',        d.file_path,
      'file_size',        d.file_size,
      'mime_type',        d.mime_type,
      'notes',            d.notes,
      'uploaded_at',      d.uploaded_at
    ) order by d.uploaded_at desc
  ), '[]'::jsonb)
  into v_docs
  from public.event_compliance_documents d
  where d.event_id = v_batch.event_id;

  return v_docs;
end;
$$;

grant execute on function portal_save_compliance_doc to anon, authenticated;
grant execute on function portal_get_compliance_docs  to anon, authenticated;
