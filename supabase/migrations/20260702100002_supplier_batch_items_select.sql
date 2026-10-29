-- supplierRfqApi.ts's invitation list shows an item count per batch, which needs its own
-- read access to rfq_batch_items - portal_get_data (used for the full per-invitation detail
-- view) already returns items bundled in, but that RPC is one-batch-at-a-time and isn't used
-- for the list screen's lightweight per-batch counts.

create policy "Suppliers can view own batch items by email"
  on public.rfq_batch_items for select
  using (
    exists (
      select 1 from rfq_batches b
      where b.id = rfq_batch_id and lower(trim(b.supplier_email)) = lower(auth.email())
    )
  );
