-- Add chime_pipeline_id to store the Media Capture Pipeline ARN.
-- Required to trigger the concatenation pipeline when a session ends,
-- which merges all segment files into a single named MP4.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS chime_pipeline_id text;
