-- ─── Supplier ID Documents ────────────────────────────────────────────────────
-- Stores identity verification documents uploaded during supplier registration.
-- Files live in the PRIVATE 'supplier-id-documents' storage bucket (signed URLs only).

create table public.supplier_id_documents (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  document_type       text        not null check (document_type in ('id_card', 'passport', 'drivers_license')),
  file_name           text        not null,
  file_path           text        not null,
  file_size           integer,
  mime_type           text,
  verification_status text        not null default 'pending'
                                    check (verification_status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  uploaded_at         timestamptz not null default now(),
  reviewed_at         timestamptz,
  reviewed_by         text
);

alter table public.supplier_id_documents enable row level security;

-- Suppliers can view their own documents only
create policy "Supplier can view own documents"
  on public.supplier_id_documents for select
  using (auth.uid() = user_id);

-- Suppliers can insert their own documents
create policy "Supplier can upload own documents"
  on public.supplier_id_documents for insert
  with check (auth.uid() = user_id);

-- ─── Add verification status column to service_providers ──────────────────────

alter table public.service_providers
  add column if not exists id_verification_status text
    not null default 'not_submitted'
    check (id_verification_status in ('not_submitted', 'pending', 'approved', 'rejected'));

-- ─── Storage bucket: supplier-id-documents (PRIVATE) ─────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-id-documents',
  'supplier-id-documents',
  false,    -- private — access via signed URLs only
  20971520, -- 20 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- Authenticated suppliers can upload only to their own folder: {userId}/...
create policy "Supplier can upload own ID documents"
  on storage.objects for insert
  with check (
    bucket_id = 'supplier-id-documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Suppliers can only read files inside their own folder
create policy "Supplier can read own ID documents"
  on storage.objects for select
  using (
    bucket_id = 'supplier-id-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppliers can delete their own documents
create policy "Supplier can delete own ID documents"
  on storage.objects for delete
  using (
    bucket_id = 'supplier-id-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
