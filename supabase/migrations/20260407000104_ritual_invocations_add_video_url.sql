-- Add video_url column to ritual_invocations
-- Supports task 09.1: each invocation step can have an optional direct video URL

ALTER TABLE ritual_invocations
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN ritual_invocations.video_url IS 'Optional direct video URL (mp4/webm) for this ritual step. When present, shown as HTML5 player with auto-advance on completion.';
