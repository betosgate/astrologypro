// Bundled mirror of supabase/migrations/20260423000003_admin_bookings_status_completed.sql
//
// Extends admin_bookings.status to allow 'completed' / 'no_show' / 'in_progress'.
// Required so the /api/chime/admin-bookings/end route can flip status to
// 'completed' after a Chime session ends.
export const MIGRATION_SQL = `
ALTER TABLE public.admin_bookings
  DROP CONSTRAINT IF EXISTS admin_bookings_status_check;

ALTER TABLE public.admin_bookings
  ADD CONSTRAINT admin_bookings_status_check
  CHECK (status IN (
    'confirmed',
    'canceled',
    'completed',
    'no_show',
    'in_progress'
  ));
`;
