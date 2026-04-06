-- Add avatar_url to trainees table so trainees can upload a profile photo.
-- Additive migration only — no existing columns removed.

ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
