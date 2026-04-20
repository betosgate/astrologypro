-- Add chat_transcript column to bookings table to persist in-session chat messages
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chat_transcript JSONB;

COMMENT ON COLUMN bookings.chat_transcript IS 'JSON array of chat messages exchanged during the session. Each entry: {from, text, time}';
