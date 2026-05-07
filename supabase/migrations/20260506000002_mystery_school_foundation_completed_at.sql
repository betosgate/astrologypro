-- ============================================================================
-- Mystery School: foundation_completed_at milestone column
--
-- Records the moment a student finished Admin Training-backed Foundation
-- and was advanced from training_status='foundation' → 'decans'. Lets
-- admin views surface "graduated to Decans on …" without inferring it
-- from category_completions joins, and gives the foundation-graduation
-- helper a place to write the milestone idempotently.
--
-- Sprint plan:
--   docs/tasks/2026-05-06/mystery-school-foundation-decan-access-flow.md
-- ============================================================================

BEGIN;

ALTER TABLE public.mystery_school_students
  ADD COLUMN IF NOT EXISTS foundation_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_mystery_school_students_foundation_completed_at
  ON public.mystery_school_students (foundation_completed_at)
  WHERE foundation_completed_at IS NOT NULL;

-- Best-effort backfill: any student already in 'decans' or 'graduated'
-- has implicitly finished Foundation. There is no mystery_school_students
-- started_at column; use enrollment_date when present, then enrolled_at,
-- then NOW(). Never overwrites an existing value.
UPDATE public.mystery_school_students
   SET foundation_completed_at = COALESCE(enrollment_date, enrolled_at, NOW())
 WHERE foundation_completed_at IS NULL
   AND training_status IN ('decans', 'graduated');

-- Sanity
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mystery_school_students'
      AND column_name = 'foundation_completed_at'
  ) THEN
    RAISE EXCEPTION
      'mystery_school_students.foundation_completed_at not added';
  END IF;
END
$check$;

COMMIT;
