-- ─── Client Company Details ─────────────────────────────────────────────────
-- Rounds out the client record ("clients") so company-level data used on every
-- proposal — registration number, accounts-payable email, and a client's known
-- divisions/departments — can be captured once and reused, instead of being
-- re-typed on every new event. Additive only; no existing columns touched.

alter table public.clients
  add column registration_number    text   not null default '',
  add column accounts_payable_email text   not null default '',
  add column divisions              text[] not null default '{}';
