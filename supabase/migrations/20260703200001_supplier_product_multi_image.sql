-- Products can now carry up to 4 photos (enforced client-side) instead of exactly one.
-- Backfills any existing single image_url into the new array before dropping the old column -
-- no live rows have one set yet, but this keeps the migration correct regardless.

alter table public.supplier_products add column image_urls text[] not null default '{}';

update public.supplier_products set image_urls = array[image_url] where image_url <> '';

alter table public.supplier_products drop column image_url;
