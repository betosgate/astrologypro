-- Extend landing-page reading leads with service and birth-context details.
-- Additive only: keeps existing lead rows and the original question column intact.

alter table reading_leads
  add column if not exists service_slug text,
  add column if not exists birth_timezone text,
  add column if not exists current_timezone text,
  add column if not exists additional_context text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update reading_leads
set additional_context = question
where additional_context is null
  and question is not null;

create index if not exists idx_reading_leads_service_slug
  on reading_leads (service_slug)
  where service_slug is not null;

create index if not exists idx_reading_leads_birth_timezone
  on reading_leads (birth_timezone)
  where birth_timezone is not null;

comment on column reading_leads.service_slug is
  'Canonical service slug from the landing page form, used to preserve service intent.';

comment on column reading_leads.birth_timezone is
  'Birth or question-context timezone captured from the landing page lead form.';

comment on column reading_leads.current_timezone is
  'Browser-detected current timezone captured at form submission when available.';

comment on column reading_leads.additional_context is
  'Reader-facing context note from the landing page form.';

comment on column reading_leads.metadata is
  'Structured landing-page intake metadata for future lead routing and attribution.';
