// Bundled mirror of supabase/migrations/20260414000002_booking_session_started_at.sql
export const MIGRATION_SQL = `ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz;
`;
