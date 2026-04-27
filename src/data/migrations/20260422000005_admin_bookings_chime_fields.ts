export const MIGRATION_SQL = `
-- Video session fields on admin_bookings.
--
-- Mirrors the video columns on bookings so the admin calendar flow
-- can run real Chime sessions (not just Google Calendar links).
-- Additive only.

ALTER TABLE public.admin_bookings
  ADD COLUMN IF NOT EXISTS chime_meeting_id text,
  ADD COLUMN IF NOT EXISTS chime_external_meeting_id text,
  ADD COLUMN IF NOT EXISTS video_provider text;
`;
