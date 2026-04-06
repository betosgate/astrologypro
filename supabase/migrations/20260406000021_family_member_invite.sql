-- Migration: extend community_family_members with invite + user_id columns
-- Additive only — no destructive changes

ALTER TABLE community_family_members
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_email TEXT,
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cfm_user_id
  ON community_family_members(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cfm_invite_token
  ON community_family_members(invite_token)
  WHERE invite_token IS NOT NULL;
