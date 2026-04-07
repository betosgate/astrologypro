-- ============================================================
-- Migration: Mystery School Lifecycle Gaps
-- Adds post-graduation consultation tracking and extends the
-- ms_email_log deduplication table to cover non-decan emails.
-- ============================================================

-- 1. Post-graduation consultation tracking on mystery_school_students.
--    Cron stops sending consultation reminder emails once this is set.
ALTER TABLE mystery_school_students
  ADD COLUMN IF NOT EXISTS post_grad_consultation_booked_at TIMESTAMPTZ;

-- Index so the cron can cheaply find graduated students who have not yet booked
CREATE INDEX IF NOT EXISTS idx_mss_post_grad_not_booked
  ON mystery_school_students (graduated_at, post_grad_consultation_booked_at)
  WHERE graduated_at IS NOT NULL AND post_grad_consultation_booked_at IS NULL;

-- 2. The existing ms_email_log UNIQUE constraint covers
--    (student_id, email_type, decan_id).  NULL != NULL in PG, so two rows with
--    the same student_id + email_type + NULL decan_id would NOT trigger the
--    constraint — allowing duplicate non-decan emails (e.g. post_grad_reminder_d0).
--    Add a partial unique index to close that gap for NULL decan_id rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ms_email_log_non_decan_unique
  ON ms_email_log (student_id, email_type)
  WHERE decan_id IS NULL;
