ALTER TABLE public.live_sessions
  DROP CONSTRAINT IF EXISTS live_sessions_platform_check;

ALTER TABLE public.live_sessions
  ADD CONSTRAINT live_sessions_platform_check
  CHECK (platform IN ('facebook', 'youtube', 'twitch', 'instagram', 'tiktok', 'zoom', 'other'));

WITH ranked_live_sessions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY diviner_id
      ORDER BY started_at DESC NULLS LAST, updated_at DESC, created_at DESC, id DESC
    ) AS row_number
  FROM public.live_sessions
  WHERE status = 'live'
)
UPDATE public.live_sessions
SET
  status = 'ended',
  ended_at = COALESCE(ended_at, now()),
  updated_at = now()
WHERE id IN (
  SELECT id
  FROM ranked_live_sessions
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS live_sessions_one_live_per_diviner_idx
  ON public.live_sessions(diviner_id)
  WHERE status = 'live';

CREATE INDEX IF NOT EXISTS live_sessions_diviner_schedule_idx
  ON public.live_sessions(diviner_id, status, scheduled_at, created_at);
