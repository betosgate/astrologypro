-- Lesson progress: playback resume position
-- Adds last_position_seconds to lesson_progress for video seek-on-resume.
-- Uses idempotent ADD COLUMN IF NOT EXISTS — safe to run even if the column
-- was already added by an earlier migration (20260407000092_training_gaps.sql).

ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS last_position_seconds integer DEFAULT 0;

COMMENT ON COLUMN lesson_progress.last_position_seconds
  IS 'Exact video playback position in seconds for resume behavior. Updated by heartbeat at ~10s cadence. Capped to first unpassed trigger on resume to prevent skipping trigger gates.';
