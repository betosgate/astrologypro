ALTER TABLE social_advocacy
  ADD COLUMN IF NOT EXISTS last_posted_at timestamptz;
