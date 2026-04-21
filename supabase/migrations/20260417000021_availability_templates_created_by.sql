-- Track which authenticated admin created an availability template.
-- Additive-only: leaves existing rows null and backfills nothing.

ALTER TABLE public.availability_templates
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_availability_templates_created_by
  ON public.availability_templates(created_by);
