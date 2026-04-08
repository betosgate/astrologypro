// AUTO-GENERATED bundled mirror of supabase/migrations/20260408000111_quiz_question_remediation.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.

export const MIGRATION_SQL = `-- ============================================================================
-- Module 04: question-level remediation metadata for lesson quizzes
--
-- Adds remediation columns to the existing quiz_questions table so each
-- lesson quiz question can drive the new stepwise per-question remediation
-- flow (Module 05). Wrong answer -> learner is sent back to a specific video
-- timestamp, the required replay window plays out, then focus returns to
-- the quiz for retry.
--
-- Reuses the existing quiz_questions storage instead of inventing a third
-- quiz subsystem. The fields are nullable so existing questions without
-- remediation metadata stay backward-compatible (the runtime treats null
-- remediation as "no remediation, just allow retry inline").
--
-- Idempotent / additive only.
-- ============================================================================

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS remediation_video_id UUID,
  ADD COLUMN IF NOT EXISTS remediation_video_index INTEGER,
  ADD COLUMN IF NOT EXISTS remediation_start_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS remediation_replay_until_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS remediation_message TEXT;

COMMENT ON COLUMN public.quiz_questions.remediation_video_id IS
  'Optional FK-style reference to a specific video when a lesson has multiple. NULL = use the lesson''s primary video (lesson.video_url).';
COMMENT ON COLUMN public.quiz_questions.remediation_video_index IS
  'Alternative to remediation_video_id when the lesson uses an ordered video list. 0-based index into that list. Ignored if remediation_video_id is set.';
COMMENT ON COLUMN public.quiz_questions.remediation_start_seconds IS
  'Wrong-answer seek target — where playback should restart (seconds from the start of the remediation video).';
COMMENT ON COLUMN public.quiz_questions.remediation_replay_until_seconds IS
  'Required replay-until timestamp. Playback must reach this position before the learner is allowed to retry the question. Must be > remediation_start_seconds.';
COMMENT ON COLUMN public.quiz_questions.remediation_message IS
  'Optional learner-readable message shown briefly between the wrong answer and the video seek. Falls back to a generic copy in the runtime if NULL.';

-- Sanity constraint: if a remediation window is defined, replay-until must
-- be strictly greater than start. Otherwise the window is empty and the
-- runtime would never satisfy it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_questions_remediation_window_check'
  ) THEN
    ALTER TABLE public.quiz_questions
      ADD CONSTRAINT quiz_questions_remediation_window_check
      CHECK (
        remediation_replay_until_seconds IS NULL
        OR remediation_start_seconds IS NULL
        OR remediation_replay_until_seconds > remediation_start_seconds
      );
  END IF;
END $$;

-- Index to make "give me all questions for lesson X with remediation" cheap
-- (used by the learner lesson detail route).
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson_remediation
  ON public.quiz_questions (lesson_id)
  WHERE remediation_start_seconds IS NOT NULL;
`;
