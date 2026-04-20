// Bundled mirror of supabase/migrations/20260416000002_phone_sessions_status_expand.sql

export const MIGRATION_SQL = `
ALTER TABLE phone_sessions DROP CONSTRAINT IF EXISTS phone_sessions_status_check;

ALTER TABLE phone_sessions
  ADD CONSTRAINT phone_sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'failed', 'accepted', 'declined'));
`;
