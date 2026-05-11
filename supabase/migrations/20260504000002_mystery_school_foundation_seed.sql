-- Mystery School / Admin Training unification — Phase 3 (seed)
-- Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v2.md
--
-- Creates the canonical "Mystery School Foundation" training program plus 12
-- empty week-categories under it. Lessons themselves are NOT seeded — admins
-- populate them through /admin/training/lessons/new (or via a future bulk
-- migration of mystery_school_foundation_weeks).
--
-- This migration is intentionally additive and idempotent:
--   - program insert is guarded by NOT EXISTS (name match), so re-running is a no-op
--   - each category insert is guarded by NOT EXISTS (training_id + priority match)
--   - no rows in any other table are touched
--   - if an admin has already created a "Mystery School Foundation" program
--     manually with a different name spelling, this migration will create a
--     second one — a follow-up cleanup is the admin's responsibility, but
--     no existing data is changed
--
-- Categories are titled "Week N" with empty descriptions. Admins can rename
-- them ("Week 1 — The Awakening") and add descriptions through the existing
-- /admin/training/categories/[id]/edit UI without any code change.

-- ── Program ──────────────────────────────────────────────────────────────────
INSERT INTO training_programs (
  name,
  description,
  priority,
  is_active,
  is_sequential,
  allowed_roles
)
SELECT
  'Mystery School Foundation',
  '12-week Mystery School foundation curriculum. Source of truth for the /mystery-school/training learner experience.',
  100,
  TRUE,
  TRUE,
  ARRAY['is_mystery_school']
WHERE NOT EXISTS (
  SELECT 1 FROM training_programs WHERE name = 'Mystery School Foundation'
);

-- ── 12 week-categories ───────────────────────────────────────────────────────
-- Idempotent: each category insert is keyed on (training_id, priority).
-- Re-running the migration leaves existing rows untouched.
DO $$
DECLARE
  v_program_id UUID;
  v_week INTEGER;
BEGIN
  SELECT id INTO v_program_id
  FROM training_programs
  WHERE name = 'Mystery School Foundation'
  LIMIT 1;

  IF v_program_id IS NULL THEN
    -- Should never happen because we just inserted it above, but guard anyway.
    RAISE NOTICE 'Mystery School Foundation program not found — skipping category seed.';
    RETURN;
  END IF;

  FOR v_week IN 1..12 LOOP
    INSERT INTO training_categories (
      training_id,
      name,
      description,
      priority,
      is_active,
      is_sequential
    )
    SELECT
      v_program_id,
      'Week ' || v_week,
      NULL,
      v_week,
      TRUE,
      TRUE
    WHERE NOT EXISTS (
      SELECT 1
      FROM training_categories
      WHERE training_id = v_program_id
        AND priority = v_week
    );
  END LOOP;
END $$;
