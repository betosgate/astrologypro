-- Add unique index on services(diviner_id, slug) to support ON CONFLICT upsert
-- in diviner onboarding (fixes Postgres error 42P10).
--
-- Preflight: 0 duplicate (diviner_id, slug) rows confirmed before applying.
-- Safe to apply directly without cleanup.
CREATE UNIQUE INDEX IF NOT EXISTS services_diviner_id_slug_key
  ON public.services (diviner_id, slug);
