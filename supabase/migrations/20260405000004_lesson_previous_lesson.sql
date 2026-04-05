-- Add previous_lesson_id to training_lessons for sequencing
ALTER TABLE training_lessons
  ADD COLUMN IF NOT EXISTS previous_lesson_id UUID
    REFERENCES training_lessons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS training_lessons_previous_lesson_idx
  ON training_lessons (previous_lesson_id);
