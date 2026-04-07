-- Migration: 20260406000025_ritual_journals
-- Purpose: Module 05 Ritual Praxis Runner + Module 06 Scrying & Mundane Journals
-- Extends decan_rituals, scry_journals, mundane_journals; adds ritual_executions table.

-- ============================================================
-- Extend decan_rituals
-- ============================================================
ALTER TABLE decan_rituals
  ADD COLUMN IF NOT EXISTS is_published  BOOLEAN     DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS version       INTEGER     DEFAULT 1,
  ADD COLUMN IF NOT EXISTS preview_only  BOOLEAN     DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- Extend scry_journals
-- ============================================================
ALTER TABLE scry_journals
  ADD COLUMN IF NOT EXISTS assigned_card     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS alternate_card    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS experience_text   TEXT,
  ADD COLUMN IF NOT EXISTS submission_count  INTEGER DEFAULT 1;
-- 'content' column kept for backward compatibility; experience_text is the new primary field.

-- ============================================================
-- Extend mundane_journals
-- ============================================================
ALTER TABLE mundane_journals
  ADD COLUMN IF NOT EXISTS relationships_section   TEXT,
  ADD COLUMN IF NOT EXISTS business_work_section   TEXT,
  ADD COLUMN IF NOT EXISTS shifts_perception_section TEXT;
-- 'content' column kept for backward compatibility; three new sections are the new required fields.

-- ============================================================
-- Ritual execution tracking
-- Tracks step-level progress per student+decan (not just done/not done).
-- ============================================================
CREATE TABLE IF NOT EXISTS ritual_executions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES mystery_school_students(id) ON DELETE CASCADE,
  decan_id     UUID        NOT NULL REFERENCES decans(id),
  current_step INTEGER     DEFAULT 0,
  total_steps  INTEGER     NOT NULL,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_complete  BOOLEAN     DEFAULT FALSE,
  UNIQUE (student_id, decan_id)
);

ALTER TABLE ritual_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_executions"
  ON ritual_executions FOR ALL
  TO authenticated
  USING   (student_id IN (SELECT id FROM mystery_school_students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM mystery_school_students WHERE user_id = auth.uid()));

CREATE POLICY "service_role_executions"
  ON ritual_executions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ritual_executions_student ON ritual_executions (student_id);
CREATE INDEX IF NOT EXISTS idx_ritual_executions_decan   ON ritual_executions (decan_id);
