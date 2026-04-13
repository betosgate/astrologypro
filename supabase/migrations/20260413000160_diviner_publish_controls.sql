ALTER TABLE public.diviners
  ADD COLUMN IF NOT EXISTS public_publish_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_public_sections text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS blocked_media_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS publish_block_reason text,
  ADD COLUMN IF NOT EXISTS publish_blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_blocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.diviners
SET
  blocked_public_sections = COALESCE(blocked_public_sections, '{}'::text[]),
  blocked_media_types = COALESCE(blocked_media_types, '{}'::text[])
WHERE blocked_public_sections IS NULL
   OR blocked_media_types IS NULL;

ALTER TABLE public.diviners
  DROP CONSTRAINT IF EXISTS diviners_blocked_public_sections_check;

ALTER TABLE public.diviners
  ADD CONSTRAINT diviners_blocked_public_sections_check
  CHECK (
    blocked_public_sections <@ ARRAY[
      'hero',
      'bio',
      'services',
      'live',
      'media',
      'testimonials',
      'weekly_subscription'
    ]::text[]
  );

ALTER TABLE public.diviners
  DROP CONSTRAINT IF EXISTS diviners_blocked_media_types_check;

ALTER TABLE public.diviners
  ADD CONSTRAINT diviners_blocked_media_types_check
  CHECK (
    blocked_media_types <@ ARRAY[
      'video',
      'audio',
      'article',
      'link',
      'image'
    ]::text[]
  );

CREATE INDEX IF NOT EXISTS diviners_public_publish_blocked_idx
  ON public.diviners(public_publish_blocked);
