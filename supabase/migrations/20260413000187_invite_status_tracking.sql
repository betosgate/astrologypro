-- ============================================================
-- Task 10: Household User Invite Status Tracking
-- Adds explicit invite lifecycle tracking so the inviting member
-- and admin can see exactly where each invite stands.
-- build: 2026-04-13
-- ============================================================

-- ─── Invite lifecycle state ───────────────────────────────────────────────────
--   not_sent  : no invite has been sent yet
--   sent      : invite email was dispatched
--   accepted  : the added user clicked the link and completed signup
--   expired   : invite link passed its expiry window without acceptance
--   failed    : email dispatch failed (SES error, invalid address, etc.)
--   resent    : a follow-up invite was sent after an earlier send
ALTER TABLE community_family_members
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'not_sent'
    CHECK (invite_status IN ('not_sent', 'sent', 'accepted', 'expired', 'failed', 'resent')),

  -- Total number of invites sent to this family member (initial + resends)
  ADD COLUMN IF NOT EXISTS invite_resend_count INTEGER NOT NULL DEFAULT 0,

  -- Expiry timestamp so the acceptance flow can validate token freshness
  -- Default: 7 days from invite_sent_at (set by application code)
  ADD COLUMN IF NOT EXISTS invite_expires_at   TIMESTAMPTZ,

  -- Failure reason stored for admin review
  ADD COLUMN IF NOT EXISTS invite_failure_reason TEXT;

-- ─── Backfill existing rows ───────────────────────────────────────────────────
-- Where invite_accepted_at is set → 'accepted'
UPDATE community_family_members
SET invite_status = 'accepted'
WHERE invite_accepted_at IS NOT NULL
  AND invite_status = 'not_sent';

-- Where invite_sent_at is set but not yet accepted → 'sent'
UPDATE community_family_members
SET invite_status = 'sent'
WHERE invite_sent_at IS NOT NULL
  AND invite_accepted_at IS NULL
  AND invite_status = 'not_sent';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cfm_invite_status
  ON community_family_members(invite_status);

CREATE INDEX IF NOT EXISTS idx_cfm_invite_expires
  ON community_family_members(invite_expires_at)
  WHERE invite_expires_at IS NOT NULL AND invite_status = 'sent';
