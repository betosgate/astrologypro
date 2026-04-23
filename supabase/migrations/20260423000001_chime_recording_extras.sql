-- Chime recording extras for admin_bookings + phone_sessions.
--
-- Adds the pipeline-id, recording-url, and recording-share-id columns that
-- were already present on `bookings` but missing here. Without these, the
-- admin↔trainee video path and the voice (PSTN) path can't persist the Chime
-- Media Capture Pipeline ARN, the final S3 URL, or a share token — so the
-- end-meeting flow can't concatenate segments and the sync-recordings cron
-- has nowhere to write.
--
-- Additive + idempotent. Safe to re-run.

-- ── admin_bookings ───────────────────────────────────────────────────────────
ALTER TABLE public.admin_bookings
  ADD COLUMN IF NOT EXISTS chime_pipeline_id    text,
  ADD COLUMN IF NOT EXISTS recording_url        text,
  ADD COLUMN IF NOT EXISTS recording_share_id   text,
  ADD COLUMN IF NOT EXISTS session_started_at   timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at             timestamptz,
  ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

-- Lookup index for the sync-recordings cron (finds bookings that still need
-- a recording_url synced from S3).
CREATE INDEX IF NOT EXISTS idx_admin_bookings_recording_sync
  ON public.admin_bookings (chime_meeting_id)
  WHERE chime_meeting_id IS NOT NULL AND recording_url IS NULL;

-- ── phone_sessions ───────────────────────────────────────────────────────────
ALTER TABLE public.phone_sessions
  ADD COLUMN IF NOT EXISTS chime_pipeline_id   text,
  ADD COLUMN IF NOT EXISTS recording_share_id  text;

CREATE INDEX IF NOT EXISTS idx_phone_sessions_recording_sync
  ON public.phone_sessions (chime_meeting_id)
  WHERE chime_meeting_id IS NOT NULL AND recording_url IS NULL;
