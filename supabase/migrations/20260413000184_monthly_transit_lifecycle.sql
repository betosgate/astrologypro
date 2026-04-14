-- ============================================================
-- Task 04: Monthly Transit Lifecycle States
-- Extends monthly_transits with full lifecycle tracking so
-- generation failures are visible to admin ops and not silently
-- lost.
-- build: 2026-04-13
-- ============================================================

-- ─── Lifecycle state ─────────────────────────────────────────────────────────
--   pending    : row reserved but generation not yet attempted
--   generated  : transit data was computed successfully
--   notified   : email notification was delivered to the member
--   failed     : generation or notification attempt failed
--   suppressed : intentionally skipped (e.g. membership paused mid-month)
ALTER TABLE monthly_transits
  ADD COLUMN IF NOT EXISTS generation_status TEXT NOT NULL DEFAULT 'generated'
    CHECK (generation_status IN ('pending', 'generated', 'notified', 'failed', 'suppressed')),

  ADD COLUMN IF NOT EXISTS failure_reason    TEXT,
  ADD COLUMN IF NOT EXISTS retry_count       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMPTZ,

  -- Separate notification timestamp so notification success can be tracked
  -- independently from generation success (generation can succeed even if email fails)
  ADD COLUMN IF NOT EXISTS notified_at       TIMESTAMPTZ,

  -- notification_sent already exists — keep it for backwards compat; notified_at is the richer version
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN     NOT NULL DEFAULT false;

-- ─── Backfill existing rows ───────────────────────────────────────────────────
-- Existing rows were all successfully generated; notification_sent indicates email status.
UPDATE monthly_transits
SET
  generation_status = CASE WHEN notification_sent THEN 'notified' ELSE 'generated' END,
  notified_at       = CASE WHEN notification_sent THEN generated_at ELSE NULL END
WHERE generation_status = 'generated';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mt_generation_status
  ON monthly_transits(generation_status);

CREATE INDEX IF NOT EXISTS idx_mt_failed
  ON monthly_transits(generation_status)
  WHERE generation_status = 'failed';

CREATE INDEX IF NOT EXISTS idx_mt_family_member_month
  ON monthly_transits(family_member_id, month);
