-- ============================================================================
-- Training quiz question progress
--
-- Persists per-question correct answers for in-progress lesson quizzes so a
-- learner who answers Q1/Q2 correctly, exits, and returns can resume at Q3
-- instead of re-answering already-passed questions.
--
-- Additive / idempotent only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quiz_question_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  answered_correctly BOOLEAN NOT NULL DEFAULT TRUE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id, question_id),
  CHECK (selected_answer >= 0)
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_progress_user_lesson
  ON public.quiz_question_progress(user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_quiz_question_progress_question
  ON public.quiz_question_progress(question_id);

ALTER TABLE public.quiz_question_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_question_progress'
      AND policyname = 'own_quiz_question_progress_select'
  ) THEN
    CREATE POLICY "own_quiz_question_progress_select"
      ON public.quiz_question_progress
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_question_progress'
      AND policyname = 'own_quiz_question_progress_insert'
  ) THEN
    CREATE POLICY "own_quiz_question_progress_insert"
      ON public.quiz_question_progress
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_question_progress'
      AND policyname = 'own_quiz_question_progress_update'
  ) THEN
    CREATE POLICY "own_quiz_question_progress_update"
      ON public.quiz_question_progress
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'quiz_question_progress'
      AND policyname = 'service_role_quiz_question_progress'
  ) THEN
    CREATE POLICY "service_role_quiz_question_progress"
      ON public.quiz_question_progress
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.quiz_question_progress IS
  'Per-question correct-answer progress for in-progress lesson quizzes. Lets learners resume at the first unanswered question after leaving a lesson.';
