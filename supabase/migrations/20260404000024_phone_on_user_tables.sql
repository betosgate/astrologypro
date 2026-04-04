-- Add phone column to user-role tables that were missing it.
-- diviners and clients already have phone; add to the remaining three.

ALTER TABLE social_advocates
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
