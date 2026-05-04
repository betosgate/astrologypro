// Bundled mirror of supabase/migrations/20260504000002_mystery_school_foundation_seed.sql
// Used by /api/admin/db/migrate so the deployed Vercel function does not need fs access.
// Keep this file in sync if the canonical .sql file changes.

export const MIGRATION_SQL = `-- Mystery School / Admin Training unification — Phase 3 (seed)
-- Spec: docs/tasks/2026-04-30/mystery-school-admin-training-unification-v2.md
--
-- Creates the canonical "Mystery School Foundation" training program plus 12
-- empty week-categories under it. Lessons themselves are NOT seeded — admins
-- populate them through /admin/training/lessons/new.
--
-- Idempotent: program guarded by NOT EXISTS on name, categories guarded by
-- (training_id, priority). Re-running is a no-op.

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
`;
