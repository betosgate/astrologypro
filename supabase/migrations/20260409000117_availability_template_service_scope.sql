-- Allow availability templates to be scoped to a specific service.
-- NULL service_id means the schedule applies to all services.

ALTER TABLE public.availability_templates
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_availability_templates_service_id
  ON public.availability_templates(service_id);
