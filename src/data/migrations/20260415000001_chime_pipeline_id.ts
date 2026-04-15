// Bundled mirror of supabase/migrations/20260415000001_chime_pipeline_id.sql
export const MIGRATION_SQL = `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chime_pipeline_id text;
`;
