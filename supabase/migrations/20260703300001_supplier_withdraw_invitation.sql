-- A supplier can now withdraw after already accepting (and possibly already quoting),
-- distinct from "declined" (never agreed to quote at all) and from never having responded.
-- Reuses the same invitation_response column and RPC rather than a parallel mechanism.

alter table public.rfq_batches drop constraint rfq_batches_invitation_response_check;
alter table public.rfq_batches add constraint rfq_batches_invitation_response_check
  check (invitation_response in ('accepted', 'declined', 'withdrawn'));

create or replace function public.supplier_respond_to_invitation(p_batch_id text, p_response text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_batch rfq_batches; begin
  if p_response not in ('accepted', 'declined', 'withdrawn') then
    raise exception 'Invalid response';
  end if;

  select * into v_batch from rfq_batches where id = p_batch_id;
  if not found then raise exception 'Invitation not found'; end if;
  if lower(trim(v_batch.supplier_email)) <> lower(auth.email()) then
    raise exception 'Not authorized';
  end if;

  update rfq_batches
  set invitation_response = p_response, invitation_responded_at = now()
  where id = p_batch_id;
end;
$$;
