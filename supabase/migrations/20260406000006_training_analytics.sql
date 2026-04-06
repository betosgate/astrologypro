-- ============================================================
-- Training Analytics: Time Tracking + Progress Tables
-- build: 2026-04-06
-- ============================================================

-- 1. Add time tracking to existing quiz_attempts
ALTER TABLE quiz_attempts
  ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER;

-- 2. Add start tracking to lesson_completions
ALTER TABLE lesson_completions
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

-- 3. Add start tracking to category_completions
ALTER TABLE category_completions
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;

-- 4. Lesson progress tracker (tracks open → active → complete)
--    Separate from lesson_completions so we track partial progress too.
CREATE TABLE IF NOT EXISTS lesson_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  lesson_id           UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user         ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson       ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_started      ON lesson_progress(started_at);

-- 5. Program enrollment tracker (tracks first open of a program)
CREATE TABLE IF NOT EXISTS program_enrollments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL,
  program_id          UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, program_id)
);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user     ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program  ON program_enrollments(program_id);

-- 6. RLS on new tables
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_lesson_progress_select"   ON lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_lesson_progress_insert"   ON lesson_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_lesson_progress_update"   ON lesson_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_lesson_progress" ON lesson_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_program_enrollments_select"   ON program_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_program_enrollments_insert"   ON program_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_program_enrollments_update"   ON program_enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_program_enrollments" ON program_enrollments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Analytics helper indexes (improves admin analytics query performance)
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_lesson        ON quiz_attempts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed        ON quiz_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempted_at  ON quiz_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson   ON lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_at       ON lesson_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_category_completions_cat    ON category_completions(category_id);
CREATE INDEX IF NOT EXISTS idx_category_completions_at     ON category_completions(completed_at);
