ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS source_type text;

ALTER TABLE public.media_items
  ADD COLUMN IF NOT EXISTS source_live_session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.media_items
  DROP CONSTRAINT IF EXISTS media_items_source_type_check;

ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('live_session'));

CREATE UNIQUE INDEX IF NOT EXISTS media_items_live_session_source_uidx
  ON public.media_items(source_live_session_id)
  WHERE source_live_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS media_items_diviner_source_type_idx
  ON public.media_items(diviner_id, source_type, created_at DESC);
