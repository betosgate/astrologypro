-- Add trainee invite code column to diviners table
-- Diviners can share this code with trainees during signup to be auto-linked as mentor

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS trainee_invite_code VARCHAR(30) UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_diviners_trainee_invite_code
  ON diviners(trainee_invite_code)
  WHERE trainee_invite_code IS NOT NULL;
