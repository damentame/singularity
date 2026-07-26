-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Utility: auto-update updated_at ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES
-- Extends auth.users with role and app-specific fields.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  role            text not null default 'host' check (role in ('host', 'supplier', 'coordinator')),
  available_roles text[] not null default array['host'],
  event_type      text,
  avatar_url      text,
  phone           text,
  company_name    text,
  country         text,
  city            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role, available_roles)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'host'),
    array[coalesce(new.raw_user_meta_data->>'role', 'host')]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- PLANNER EVENTS
-- Stores the full PlannerEvent blob + queryable summary columns.
-- Used by the manage-events edge function (useEventPersistence hook).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.planner_events (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            text not null,                    -- app-generated "evt-..." id
  user_id             uuid not null references auth.users(id) on delete cascade,
  event_data          jsonb not null default '{}',      -- full PlannerEvent object
  -- summary columns for listing without loading the full blob
  name                text not null default '',
  event_type          text not null default 'wedding',
  event_date          date,
  end_date            date,
  status              text not null default 'draft',
  guest_count         integer not null default 0,
  venue               text,
  country             text,
  city                text,
  currency            text not null default 'ZAR',
  total_client_price  numeric(14,2) not null default 0,
  total_supplier_cost numeric(14,2) not null default 0,
  margin_percent      numeric(6,2) not null default 0,
  moments_count       integer not null default 0,
  line_items_count    integer not null default 0,
  last_auto_save_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (event_id, user_id)
);

create trigger planner_events_updated_at
  before update on public.planner_events
  for each row execute function public.set_updated_at();

create index planner_events_user_id_idx on public.planner_events(user_id);
create index planner_events_event_id_idx on public.planner_events(event_id);
create index planner_events_updated_at_idx on public.planner_events(updated_at desc);

alter table public.planner_events enable row level security;

create policy "Users can manage own planner events"
  on public.planner_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- CLIENTS
-- Coordinator-owned client accounts. Used by clientDbStore.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.clients (
  id                        uuid primary key default uuid_generate_v4(),
  coordinator_id            uuid not null references auth.users(id) on delete cascade,
  client_type               text not null default 'wedding' check (client_type in ('wedding', 'celebration', 'corporate')),
  primary_contact_name      text not null default '',
  primary_contact_email     text not null default '',
  primary_contact_phone_code text not null default '',
  primary_contact_phone     text not null default '',
  company_name              text not null default '',
  country                   text not null default '',
  region                    text not null default '',
  city                      text not null default '',
  billing_address           text not null default '',
  vat_number                text not null default '',
  style_preferences         jsonb not null default '{}',
  budget_history            jsonb not null default '[]',
  notes                     text not null default '',
  mood_board_refs           jsonb not null default '[]',
  tags                      text[] not null default '{}',
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create index clients_coordinator_id_idx on public.clients(coordinator_id);
create index clients_is_active_idx on public.clients(is_active);
create index clients_email_idx on public.clients(primary_contact_email);

alter table public.clients enable row level security;

create policy "Coordinators can manage own clients"
  on public.clients for all
  using (auth.uid() = coordinator_id)
  with check (auth.uid() = coordinator_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- CLIENT EVENTS
-- Event history per client. Used by clientDbStore.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.client_events (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid not null references public.clients(id) on delete cascade,
  coordinator_id      uuid not null references auth.users(id) on delete cascade,
  event_local_id      text not null default '',         -- matches PlannerEvent.id
  event_name          text not null default '',
  event_type          text not null default '',
  event_date          date,
  venue               text not null default '',
  guest_count         integer not null default 0,
  total_budget        numeric(14,2) not null default 0,
  total_client_price  numeric(14,2) not null default 0,
  suppliers_used      jsonb not null default '[]',
  mood_board_refs     jsonb not null default '[]',
  status              text not null default 'draft',
  notes               text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger client_events_updated_at
  before update on public.client_events
  for each row execute function public.set_updated_at();

create index client_events_client_id_idx on public.client_events(client_id);
create index client_events_coordinator_id_idx on public.client_events(coordinator_id);

alter table public.client_events enable row level security;

create policy "Coordinators can manage own client events"
  on public.client_events for all
  using (auth.uid() = coordinator_id)
  with check (auth.uid() = coordinator_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICE PROVIDERS
-- Supplier/provider profiles. Used by portfolioUpload.ts and the
-- service provider registration wizard.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.service_providers (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references auth.users(id) on delete cascade,
  business_name           text not null default '',
  trading_name            text not null default '',
  registration_number     text not null default '',
  business_type           text not null default '',
  years_in_operation      text not null default '',
  team_size               text not null default '',
  business_description    text not null default '',
  website                 text not null default '',
  instagram               text not null default '',
  facebook                text not null default '',
  pinterest               text not null default '',
  tiktok                  text not null default '',
  country                 text not null default '',
  state                   text not null default '',
  city                    text not null default '',
  postcode                text not null default '',
  service_radius          text not null default '',
  selected_event_types    text[] not null default '{}',
  selected_categories     jsonb not null default '{}',
  service_details         jsonb not null default '{}',
  insurance_types         text[] not null default '{}',
  public_liability_amount text not null default '',
  policy_number           text not null default '',
  expiry_date             text not null default '',
  portfolio_urls          text[] not null default '{}',
  cover_image_url         text,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger service_providers_updated_at
  before update on public.service_providers
  for each row execute function public.set_updated_at();

create index service_providers_country_idx on public.service_providers(country);
create index service_providers_is_active_idx on public.service_providers(is_active);

alter table public.service_providers enable row level security;

-- Anyone can view active provider profiles (browsing)
create policy "Public can view active service providers"
  on public.service_providers for select
  using (is_active = true);

-- Providers can manage only their own row
create policy "Providers can manage own profile"
  on public.service_providers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS (host/wizard flow)
-- Simpler event table used by the host wizard flow (useDataSync.ts).
-- ─────────────────────────────────────────────────────────────────────────────
create table public.events (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  event_id                text not null unique,
  event_name              text not null,
  event_type              text not null check (event_type in ('corporate', 'wedding', 'celebration')),
  event_category          text,
  country                 text,
  city                    text,
  start_date              date,
  end_date                date,
  total_days              integer,
  total_guests            integer,
  budget_min              numeric(14,2),
  budget_max              numeric(14,2),
  currency                text default 'ZAR',
  status                  text default 'draft',
  notes                   text,
  questionnaire_responses jsonb default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create index events_user_id_idx on public.events(user_id);

alter table public.events enable row level security;

create policy "Users can manage own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- SUB EVENTS
-- Day-by-day breakdown of an event. Used by useDataSync.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.sub_events (
  id                 uuid primary key default uuid_generate_v4(),
  event_id           uuid not null references public.events(id) on delete cascade,
  day_number         integer not null,
  event_area_type    text not null,
  venue_name         text,
  guest_count        integer,
  load_in_time       time,
  event_start_time   time,
  event_end_time     time,
  strike_time        time,
  color_scheme       text[] default '{}',
  setup_requirements text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger sub_events_updated_at
  before update on public.sub_events
  for each row execute function public.set_updated_at();

create index sub_events_event_id_idx on public.sub_events(event_id);

alter table public.sub_events enable row level security;

create policy "Users can manage sub events via parent"
  on public.sub_events for all
  using (
    exists (
      select 1 from public.events e
      where e.id = sub_events.event_id and e.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- GUESTS
-- Guest list per event. Used by useDataSync.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.guests (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references public.events(id) on delete cascade,
  full_name           text not null,
  email               text,
  phone               text,
  rsvp_status         text default 'pending' check (rsvp_status in ('pending', 'confirmed', 'declined', 'maybe')),
  dietary_requirements text[] default '{}',
  allergies           text,
  meal_preference     text,
  plus_one            boolean default false,
  plus_one_name       text,
  plus_one_dietary    text[] default '{}',
  table_assignment    text,
  seat_number         integer,
  group_name          text,
  relationship        text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger guests_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

create index guests_event_id_idx on public.guests(event_id);
create index guests_rsvp_status_idx on public.guests(rsvp_status);

alter table public.guests enable row level security;

create policy "Users can manage guests via parent event"
  on public.guests for all
  using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICE PROVIDER SELECTIONS
-- Which suppliers a host has selected per event. Used by useDataSync.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.service_provider_selections (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references public.events(id) on delete cascade,
  category        text not null,
  supplier_id     text,
  supplier_name   text,
  options         text[] default '{}',
  lookbook_urls   text[] default '{}',
  flower_allergies text,
  special_requests text,
  status          text default 'considering',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger service_provider_selections_updated_at
  before update on public.service_provider_selections
  for each row execute function public.set_updated_at();

create index sps_event_id_idx on public.service_provider_selections(event_id);

alter table public.service_provider_selections enable row level security;

create policy "Users can manage selections via parent event"
  on public.service_provider_selections for all
  using (
    exists (
      select 1 from public.events e
      where e.id = service_provider_selections.event_id and e.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- SUPPLIER WORKBOOKS
-- Detailed cost workbooks per event/supplier. Used by useDataSync.ts.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.supplier_workbooks (
  id                      uuid primary key default uuid_generate_v4(),
  event_id                uuid references public.events(id) on delete cascade,
  supplier_id             text,
  supplier_name           text,
  supplier_category       text,
  service_items           jsonb default '[]',
  subtotal_1              numeric(14,2) default 0,
  delivery_cost           numeric(14,2) default 0,
  setup_cost              numeric(14,2) default 0,
  collection_cost         numeric(14,2) default 0,
  collection_timing       text,
  logistics_notes         text,
  subtotal_2              numeric(14,2) default 0,
  vat_rate                numeric(5,4) default 0.15,
  vat_amount              numeric(14,2) default 0,
  contingency_percentage  numeric(5,2) default 0,
  contingency_amount      numeric(14,2) default 0,
  refundable_deposit      numeric(14,2) default 0,
  subtotal_3              numeric(14,2) default 0,
  additional_items        jsonb default '[]',
  additional_items_total  numeric(14,2) default 0,
  damages_deductions      jsonb default '[]',
  damages_total           numeric(14,2) default 0,
  final_total             numeric(14,2) default 0,
  refund_due              numeric(14,2) default 0,
  -- client banking for refund payments
  client_bank_name        text,
  client_account_name     text,
  client_account_number   text,
  client_routing_number   text,
  client_swift_code       text,
  client_iban             text,
  additional_invoice_url  text,
  additional_invoice_notes text,
  status                  text default 'draft',
  currency                text default 'ZAR',
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger supplier_workbooks_updated_at
  before update on public.supplier_workbooks
  for each row execute function public.set_updated_at();

create index supplier_workbooks_event_id_idx on public.supplier_workbooks(event_id);

alter table public.supplier_workbooks enable row level security;

create policy "Users can manage workbooks via parent event"
  on public.supplier_workbooks for all
  using (
    exists (
      select 1 from public.events e
      where e.id = supplier_workbooks.event_id and e.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-media',
  'supplier-media',
  true,
  52428800,   -- 50 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "Public read on supplier-media"
  on storage.objects for select
  using (bucket_id = 'supplier-media');

create policy "Authenticated upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'supplier-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'portfolios'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Owners can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'supplier-media'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
