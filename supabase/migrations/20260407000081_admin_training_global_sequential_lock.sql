-- ============================================================
-- Training Settings: Add global_sequential_lock field
-- Module 01 gap-closure — adds the global sequential lock boolean
-- that controls whether program/category is_sequential flags are enforced.
-- Additive only — does not modify existing rows.
-- ============================================================

-- Add the field if it does not exist
ALTER TABLE training_settings
  ADD COLUMN IF NOT EXISTS global_sequential_lock BOOLEAN NOT NULL DEFAULT false;

-- Update the one existing seed row to explicit false (idempotent)
UPDATE training_settings
SET global_sequential_lock = false
WHERE global_sequential_lock IS NULL;
