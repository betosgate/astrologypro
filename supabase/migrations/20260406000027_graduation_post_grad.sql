-- Graduation & Post-Graduation Unlocks
-- Module 09 — Extend mystery_school_students and add personal_rituals table.

-- Extend mystery_school_students
ALTER TABLE mystery_school_students
  ADD COLUMN IF NOT EXISTS graduation_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graduation_blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS post_grad_access BOOLEAN GENERATED ALWAYS AS (graduated_at IS NOT NULL) STORED;

-- Index for the cron graduation-check query (training_status != 'graduated')
CREATE INDEX IF NOT EXISTS idx_mss_training_status
  ON mystery_school_students (training_status)
  WHERE training_status != 'graduated';

-- Personal ritual library for post-grads
CREATE TABLE IF NOT EXISTS personal_rituals (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID         NOT NULL REFERENCES mystery_school_students(id) ON DELETE CASCADE,
  name           VARCHAR(200) NOT NULL,
  ritual_type    VARCHAR(50)  DEFAULT 'free_form',
    -- 'personal_transit'|'seasonal'|'decan_custom'|'free_form'
  tags           TEXT[]       DEFAULT '{}',
  components     JSONB        NOT NULL DEFAULT '[]',
    -- [{id, type, planet?, sign?, decan?, content, order}]
  notes          TEXT,
  is_shared_with_admin BOOLEAN DEFAULT FALSE,
  shared_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE personal_rituals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_rituals"
  ON personal_rituals FOR ALL TO authenticated
  USING (student_id IN (
    SELECT id FROM mystery_school_students WHERE user_id = auth.uid()
  ))
  WITH CHECK (student_id IN (
    SELECT id FROM mystery_school_students WHERE user_id = auth.uid()
  ));

CREATE POLICY "service_role_personal_rituals"
  ON personal_rituals FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for student personal ritual lookups
CREATE INDEX IF NOT EXISTS idx_personal_rituals_student_id
  ON personal_rituals (student_id, created_at DESC);

-- Index for admin shared-ritual reviews
CREATE INDEX IF NOT EXISTS idx_personal_rituals_shared
  ON personal_rituals (is_shared_with_admin, shared_at DESC)
  WHERE is_shared_with_admin = TRUE;
