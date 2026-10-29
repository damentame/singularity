-- portal_save_quote previously only checked rfq_batches.status for a lock, never
-- invitation_response. The UI hides the pricing form once a supplier declines, but
-- nothing stopped a stale client (a second open tab, a direct RPC call) from still
-- submitting a quote after declining. Checking it here closes that gap regardless
-- of which UI path is used, and naturally supports "undo my decline" - re-accepting
-- flips invitation_response back to 'accepted', which lifts this check again.

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

  if v_batch.invitation_response = 'declined' then
    raise exception 'This invitation has been declined';
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
