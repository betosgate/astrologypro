-- Add client_session_notes column so clients can take their own notes during sessions.
-- Diviner notes go in session_notes (already exists); client notes go here.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_session_notes TEXT;

COMMENT ON COLUMN bookings.client_session_notes IS 'Private notes taken by the client during the live session';
