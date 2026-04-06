-- ============================================================
-- Migration: Missed Decan Retry & Admin Excuse Flow (Module 08)
-- Additive only — no destructive changes.
-- ============================================================

-- Extend student_decan_progress with retry window and excuse fields
ALTER TABLE student_decan_progress
  ADD COLUMN IF NOT EXISTS retry_window_open  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_window_close TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_year         INTEGER,
  ADD COLUMN IF NOT EXISTS excuse_reason      TEXT,
  ADD COLUMN IF NOT EXISTS excused_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS excused_by         UUID REFERENCES auth.users(id);

-- Index for retry window queries (cron checks retry_window_open)
CREATE INDEX IF NOT EXISTS idx_sdp_retry_window_open
  ON student_decan_progress (retry_window_open)
  WHERE retry_window_open IS NOT NULL;

-- ── Admin excuse audit table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decan_excuse_audit (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_decan_progress_id   UUID        NOT NULL REFERENCES student_decan_progress(id),
  student_id                  UUID        NOT NULL,
  decan_id                    UUID        NOT NULL,
  excused_by                  UUID        NOT NULL REFERENCES auth.users(id),
  excuse_reason               TEXT        NOT NULL,
  previous_status             VARCHAR(20) NOT NULL,
  new_status                  VARCHAR(20) NOT NULL,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE decan_excuse_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_excuse_audit"
  ON decan_excuse_audit FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_excuse_audit_student
  ON decan_excuse_audit (student_id);

CREATE INDEX IF NOT EXISTS idx_excuse_audit_progress_id
  ON decan_excuse_audit (student_decan_progress_id);
