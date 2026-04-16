// Bundled mirror of supabase/migrations/20260416000003_add_chat_transcript.sql

export const MIGRATION_SQL = `
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chat_transcript JSONB;

COMMENT ON COLUMN bookings.chat_transcript IS 'JSON array of chat messages exchanged during the session. Each entry: {from, text, time}';
`;
