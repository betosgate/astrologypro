-- Training gaps: add last_position_seconds for playback resume
-- This column stores the exact video playback position for lesson resume behavior.
-- Heartbeat saves it at ~10s cadence; lesson start/re-entry reads it back.

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS last_position_seconds integer DEFAULT 0;

COMMENT ON COLUMN lesson_progress.last_position_seconds
  IS 'Exact video playback position in seconds for resume behavior. Updated by heartbeat at ~10s cadence.';
