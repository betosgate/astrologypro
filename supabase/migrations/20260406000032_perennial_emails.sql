-- ============================================================
-- Perennial email notifications
-- build: 2026-04-06
-- ============================================================

-- 1. Add notification_sent flag to monthly_transits for per-cycle dedup
ALTER TABLE monthly_transits
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS monthly_transits_notification_sent_idx
  ON monthly_transits (notification_sent)
  WHERE notification_sent = false;

-- 2. Allow 'cancelling' membership_status on community_members
--    (member has scheduled cancel_at_period_end but still has active access)
ALTER TABLE community_members
  DROP CONSTRAINT IF EXISTS community_members_membership_status_check;

ALTER TABLE community_members
  ADD CONSTRAINT community_members_membership_status_check
    CHECK (membership_status IN ('active', 'cancelling', 'paused', 'expired', 'cancelled'));
