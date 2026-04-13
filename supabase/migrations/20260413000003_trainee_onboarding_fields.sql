-- Add timezone and goals columns to trainees for onboarding profile completion.
-- Additive only — no existing columns removed.

ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS goals TEXT;
