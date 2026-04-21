-- Allow availability_templates rows to be owned directly by an admin account
-- without requiring a diviner record.

ALTER TABLE public.availability_templates
  ALTER COLUMN diviner_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_availability_templates_created_by_created_at
  ON public.availability_templates(created_by, created_at DESC);
