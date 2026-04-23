// Bundled mirror of supabase/migrations/20260423000001_chime_recording_extras.sql
export const MIGRATION_SQL = `
-- Chime recording extras for admin_bookings + phone_sessions.
-- Adds pipeline-id, recording-url, recording-share-id columns that were
-- already on \`bookings\` but missing here. Idempotent.

ALTER TABLE public.admin_bookings
  ADD COLUMN IF NOT EXISTS chime_pipeline_id       text,
  ADD COLUMN IF NOT EXISTS recording_url           text,
  ADD COLUMN IF NOT EXISTS recording_share_id      text,
  ADD COLUMN IF NOT EXISTS session_started_at      timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at                timestamptz,
  ADD COLUMN IF NOT EXISTS actual_duration_minutes integer;

CREATE INDEX IF NOT EXISTS idx_admin_bookings_recording_sync
  ON public.admin_bookings (chime_meeting_id)
  WHERE chime_meeting_id IS NOT NULL AND recording_url IS NULL;

ALTER TABLE public.phone_sessions
  ADD COLUMN IF NOT EXISTS chime_pipeline_id   text,
  ADD COLUMN IF NOT EXISTS recording_share_id  text;

CREATE INDEX IF NOT EXISTS idx_phone_sessions_recording_sync
  ON public.phone_sessions (chime_meeting_id)
  WHERE chime_meeting_id IS NOT NULL AND recording_url IS NULL;
`;
