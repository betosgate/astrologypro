CREATE TABLE IF NOT EXISTS trainee_lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id   UUID NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  quiz_score   INTEGER,   -- percent, null if not taken
  quiz_passed  BOOLEAN,
  UNIQUE(trainee_id, lesson_id)
);
ALTER TABLE trainee_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainee_own_progress" ON trainee_lesson_progress
  FOR ALL TO authenticated
  USING (trainee_id IN (SELECT id FROM trainees WHERE user_id = auth.uid()))
  WITH CHECK (trainee_id IN (SELECT id FROM trainees WHERE user_id = auth.uid()));
CREATE POLICY "service_role_progress" ON trainee_lesson_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);
