-- Per-product photo, separate from the general portfolio gallery (service_providers.portfolio_urls).
-- Uploaded through the same supplier-media bucket/path convention (portfolios/<uid>/...) so no
-- new storage RLS policy is needed - the existing "Authenticated upload to own folder" policy
-- already allows any file under that prefix.

alter table public.supplier_products
  add column image_url text not null default '';
