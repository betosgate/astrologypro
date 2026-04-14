-- Add session_started_at to bookings for persisting the video session timer
-- across page reloads. Set on first participant join, never overwritten.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz;
