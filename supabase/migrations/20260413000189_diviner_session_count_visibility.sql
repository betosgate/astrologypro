ALTER TABLE public.diviners
  ADD COLUMN IF NOT EXISTS show_public_session_counts boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_session_counts_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_session_counts_override text,
  ADD COLUMN IF NOT EXISTS public_session_counts_override_reason text,
  ADD COLUMN IF NOT EXISTS public_session_counts_override_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS public_session_counts_override_at timestamptz;

ALTER TABLE public.diviners
  DROP CONSTRAINT IF EXISTS diviners_public_session_counts_override_check;

ALTER TABLE public.diviners
  ADD CONSTRAINT diviners_public_session_counts_override_check
  CHECK (
    public_session_counts_override IS NULL
    OR public_session_counts_override IN ('force_show', 'force_hide')
  );

CREATE INDEX IF NOT EXISTS diviners_show_public_session_counts_idx
  ON public.diviners(show_public_session_counts);

CREATE INDEX IF NOT EXISTS diviners_public_session_counts_override_idx
  ON public.diviners(public_session_counts_override);
