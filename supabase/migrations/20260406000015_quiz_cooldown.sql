-- Add attempt_number tracking to quiz_attempts for cooldown enforcement
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1;

-- Index to speed up cooldown check: filter by user+lesson+failed, order by attempted_at desc
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson_failed
  ON quiz_attempts (user_id, lesson_id, passed, attempted_at DESC)
  WHERE passed = false;
