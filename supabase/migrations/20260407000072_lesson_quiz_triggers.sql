-- lesson_quiz_triggers: defines at what video timestamp a quiz should interrupt
CREATE TABLE IF NOT EXISTS lesson_quiz_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  trigger_timestamp_seconds INTEGER NOT NULL, -- seconds into video
  rewind_target_seconds INTEGER NOT NULL DEFAULT 0, -- where to rewind on wrong answer
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lqt_lesson_id ON lesson_quiz_triggers(lesson_id);

-- lesson_trigger_progress: tracks per-user rewatch/answer state for each trigger
CREATE TABLE IF NOT EXISTS lesson_trigger_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  trigger_id UUID NOT NULL REFERENCES lesson_quiz_triggers(id) ON DELETE CASCADE,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_rewind_at TIMESTAMPTZ,
  rewatch_required_until_seconds INTEGER, -- video must reach this position before retry allowed
  rewatch_completed BOOLEAN NOT NULL DEFAULT FALSE,
  passed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trigger_id)
);
CREATE INDEX IF NOT EXISTS idx_ltp_user_lesson ON lesson_trigger_progress(user_id, lesson_id);

-- RLS
ALTER TABLE lesson_quiz_triggers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lesson_quiz_triggers' AND policyname='triggers_readable') THEN
    CREATE POLICY "triggers_readable" ON lesson_quiz_triggers FOR SELECT USING (TRUE);
  END IF;
END $$;

ALTER TABLE lesson_trigger_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lesson_trigger_progress' AND policyname='own_trigger_progress') THEN
    CREATE POLICY "own_trigger_progress" ON lesson_trigger_progress FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_trigger_progress_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_trigger_progress_updated_at ON lesson_trigger_progress;
CREATE TRIGGER trg_trigger_progress_updated_at
  BEFORE UPDATE ON lesson_trigger_progress
  FOR EACH ROW EXECUTE FUNCTION update_trigger_progress_updated_at();
