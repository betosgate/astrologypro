CREATE TABLE IF NOT EXISTS public.service_template_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.service_templates(id) ON DELETE SET NULL,
  template_slug text NOT NULL,
  template_name text NOT NULL,
  category varchar(20) NOT NULL CHECK (category IN ('astrology', 'tarot')),
  toolkit_kind text,
  toolkit_tab_slug text,
  form_mode varchar(20) NOT NULL CHECK (form_mode IN ('single', 'couple')),
  primary_birth_city text,
  secondary_birth_city text,
  area_of_inquiry text,
  question text,
  future_week text,
  future_month text,
  payload jsonb NOT NULL,
  submission_status varchar(20) NOT NULL DEFAULT 'new' CHECK (submission_status IN ('new', 'reviewed', 'archived')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_template_intake_submissions_template_slug_idx
  ON public.service_template_intake_submissions(template_slug);

CREATE INDEX IF NOT EXISTS service_template_intake_submissions_toolkit_tab_slug_idx
  ON public.service_template_intake_submissions(toolkit_tab_slug);

CREATE INDEX IF NOT EXISTS service_template_intake_submissions_status_idx
  ON public.service_template_intake_submissions(submission_status);

CREATE INDEX IF NOT EXISTS service_template_intake_submissions_submitted_at_idx
  ON public.service_template_intake_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS service_template_intake_submissions_category_idx
  ON public.service_template_intake_submissions(category);

CREATE OR REPLACE FUNCTION public.touch_service_template_intake_submissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_service_template_intake_submissions_updated_at
ON public.service_template_intake_submissions;

CREATE TRIGGER trg_touch_service_template_intake_submissions_updated_at
BEFORE UPDATE ON public.service_template_intake_submissions
FOR EACH ROW
EXECUTE FUNCTION public.touch_service_template_intake_submissions_updated_at();
