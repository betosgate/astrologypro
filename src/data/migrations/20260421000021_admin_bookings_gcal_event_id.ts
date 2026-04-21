export const MIGRATION_SQL = `ALTER TABLE public.admin_bookings
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_bookings_gcal_event_id
  ON public.admin_bookings (google_calendar_event_id)
  WHERE google_calendar_event_id IS NOT NULL;
`;
