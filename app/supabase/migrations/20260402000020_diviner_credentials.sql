-- Add credentials and verified fields to diviners table
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS credentials TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
