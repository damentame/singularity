-- ─── Event Receipts ─────────────────────────────────────────────────────────
-- Stores physical receipts / invoices uploaded by coordinators against events.

create table if not exists public.event_receipts (
  id              uuid primary key default gen_random_uuid(),
  event_id        text not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  vendor          text not null,
  amount          numeric(12,2) not null default 0,
  currency        text not null default 'ZAR',
  receipt_date    date,
  category        text,
  description     text,
  payment_method  text,           -- 'cash' | 'card' | 'eft' | 'other'
  file_path       text,           -- storage path under event-receipts/{uid}/
  file_name       text,
  file_size       bigint,
  file_type       text,
  line_item_id    text,           -- optional link back to a specific line item
  uploaded_at     timestamptz not null default now()
);

alter table public.event_receipts enable row level security;

-- Coordinator can manage their own receipts
create policy "Coordinators manage own receipts"
  on public.event_receipts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for receipts (private, 20 MB limit, PDFs and images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-receipts',
  'event-receipts',
  false,
  20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic']
)
on conflict (id) do nothing;

-- Storage RLS: coordinators can only access their own folder
create policy "Coordinator receipt upload"
  on storage.objects for insert
  with check (
    bucket_id = 'event-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Coordinator receipt access"
  on storage.objects for select
  using (
    bucket_id = 'event-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Coordinator receipt delete"
  on storage.objects for delete
  using (
    bucket_id = 'event-receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
