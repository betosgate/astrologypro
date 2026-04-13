ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_review_notes text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

UPDATE public.media_items
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_moderation_status_check;

ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'blocked'));

CREATE INDEX IF NOT EXISTS media_items_diviner_moderation_idx
  ON public.media_items(diviner_id, moderation_status, is_active, sort_order);
