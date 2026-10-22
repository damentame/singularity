-- Suppliers are auto-approved for now - there's no admin review page yet to actually act on
-- a 'pending' status, so leaving the real default in place just strands every new supplier
-- there permanently. Flip the default forward and backfill anyone already stuck pending/
-- not_submitted. uploadIdDocument() (frontend/src/lib/idDocumentUpload.ts) is updated
-- alongside this to stop setting 'pending' on upload, for the same reason.
-- Revert both the default and that function back to 'pending' once a real admin review flow
-- exists - this migration is deliberately temporary scaffolding, not a design decision.

alter table public.service_providers
  alter column id_verification_status set default 'approved';

update public.service_providers
  set id_verification_status = 'approved'
  where id_verification_status in ('not_submitted', 'pending');
