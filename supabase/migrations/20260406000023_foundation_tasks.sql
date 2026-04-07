-- ============================================================
-- Migration: Foundation Q1 Task System
-- Extends mystery_school_foundation_weeks and
-- student_foundation_progress to support structured tasks.
-- ============================================================

-- Add structured task fields to foundation weeks
-- tasks = [{ id: "uuid", order: 1, title: string, description?: string }]
ALTER TABLE mystery_school_foundation_weeks
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tasks JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add task-level completion tracking to student progress rows.
-- task_completions = { "<task-uuid>": { "completed_at": "<ISO timestamp>" } }
-- week_completed_at replaces the old row-insert-time semantics; we keep
-- completed_at for backward compat (existing rows already have it).
ALTER TABLE student_foundation_progress
  ADD COLUMN IF NOT EXISTS task_completions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS week_completed_at TIMESTAMPTZ;

-- Back-fill week_completed_at from the existing completed_at for rows
-- that were inserted by the old "mark week complete" flow.
UPDATE student_foundation_progress
  SET week_completed_at = completed_at
  WHERE week_completed_at IS NULL;

-- GIN index for task_completions so key lookups are fast.
CREATE INDEX IF NOT EXISTS idx_sfp_task_completions
  ON student_foundation_progress USING GIN (task_completions);

-- Allow students to UPDATE their own progress row (needed for task checks).
CREATE POLICY "student updates own foundation progress"
  ON student_foundation_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mystery_school_students mss
      WHERE mss.id = student_id AND mss.user_id = auth.uid()
    )
  );
