-- ============================================================================
-- Migration: social_accounts + social_oauth_states
-- Date:      2026-04-19
-- Purpose:   Native social-media posting (replaces Ayrshare middleware).
--
--            Introduces two tables:
--
--            1. social_accounts
--               Per-owner (admin OR diviner) OAuth connections to external
--               social networks. Access + refresh tokens are stored encrypted
--               at rest (AES-256-GCM; ciphertext/iv/tag as base64 TEXT). The
--               encryption key lives in env var SOCIAL_TOKEN_ENCRYPTION_KEY
--               and is never stored in the database.
--
--            2. social_oauth_states
--               Short-lived (10 min) per-request rows used as BOTH the CSRF
--               state parameter AND the PKCE code_verifier store for the
--               OAuth redirect loop. The state value is the primary key so
--               a callback with a forged / reused state cannot proceed.
--
-- This migration is strictly ADDITIVE per CLAUDE.md §5 and §7:
--   - No existing column is dropped or renamed.
--   - The `scheduled_posts` table (added in 20260403000006) stays untouched.
--     A later additive migration can extend it (e.g. platform_post_id
--     per-platform) once we move off Ayrshare's single id field. For now
--     the existing `ayrshare_post_id` column is simply reused as a generic
--     "platform post id" by the new adapter code (see lib/social/platforms/).
--
-- NO data backfill. NO destructive operations. Feature flag / rollout gate
-- lives in lib/social/platform-registry.ts (only `twitter` is enabled;
-- every other platform is scaffolded but returns "platform not yet enabled"
-- from its adapter so the UI renders the Connect button disabled).
--
-- Rollback:
--   BEGIN;
--     DROP TABLE IF EXISTS social_oauth_states;
--     DROP TABLE IF EXISTS social_accounts;
--   COMMIT;
-- ============================================================================

BEGIN;

-- ── 1. social_accounts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_accounts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who owns this connection. For 'admin' the owner_id is NULL (brand-wide
  -- single connection per platform). For 'diviner' the owner_id references
  -- diviners.id (NOT constrained as FK so diviner deletion cascades can be
  -- handled at the application layer with a proper disconnect+revoke step).
  owner_type                TEXT NOT NULL
                              CHECK (owner_type IN ('admin', 'diviner')),
  owner_id                  UUID,

  -- Which network.
  platform                  TEXT NOT NULL
                              CHECK (platform IN (
                                'twitter', 'facebook', 'instagram',
                                'linkedin', 'tiktok', 'youtube'
                              )),

  -- External identifiers (returned by the platform after OAuth).
  platform_account_id       TEXT NOT NULL,
  platform_account_handle   TEXT,   -- e.g. "@jane" (for UI only)
  platform_account_name     TEXT,   -- display name

  -- Encrypted OAuth tokens. Each value is AES-256-GCM:
  --   *_ciphertext = base64(ciphertext)
  --   *_iv         = base64(96-bit IV)
  --   *_tag        = base64(128-bit auth tag)
  access_token_ciphertext   TEXT NOT NULL,
  access_token_iv           TEXT NOT NULL,
  access_token_tag          TEXT NOT NULL,
  refresh_token_ciphertext  TEXT,
  refresh_token_iv          TEXT,
  refresh_token_tag         TEXT,
  token_expires_at          TIMESTAMPTZ,
  scopes                    TEXT[],

  -- Lifecycle.
  connected_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  disconnected_at           TIMESTAMPTZ,
  last_refreshed_at         TIMESTAMPTZ,
  last_post_at              TIMESTAMPTZ,
  last_error_at             TIMESTAMPTZ,
  last_error_message        TEXT,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE social_accounts IS
  'OAuth connections to social networks. Tokens are AES-256-GCM encrypted at rest. '
  'Admin owner (brand-wide) has owner_id = NULL; diviner owner has owner_id = diviners.id.';

COMMENT ON COLUMN social_accounts.access_token_ciphertext IS
  'AES-256-GCM ciphertext (base64). Key: SOCIAL_TOKEN_ENCRYPTION_KEY env var.';

CREATE INDEX IF NOT EXISTS social_accounts_owner_active_idx
  ON social_accounts (owner_type, owner_id)
  WHERE disconnected_at IS NULL;

CREATE INDEX IF NOT EXISTS social_accounts_platform_active_idx
  ON social_accounts (platform)
  WHERE disconnected_at IS NULL;

-- Only one active connection per (owner, platform). owner_id is NULLable
-- (admin rows), so use COALESCE into a deterministic text to build the key.
CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_active_unique_idx
  ON social_accounts (
    owner_type,
    platform,
    COALESCE(owner_id::text, '__admin__')
  )
  WHERE disconnected_at IS NULL;

-- updated_at trigger (reuse helper if present; otherwise define inline once).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_social_accounts_updated_at'
  ) THEN
    CREATE FUNCTION set_social_accounts_updated_at()
    RETURNS TRIGGER AS $f$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $f$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS social_accounts_set_updated_at ON social_accounts;
CREATE TRIGGER social_accounts_set_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION set_social_accounts_updated_at();

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- No public / authenticated policies. ALL access goes through server routes
-- that use the service-role client. Diviners read their own connections via
-- GET /api/social/accounts which returns non-secret fields only.

-- ── 2. social_oauth_states ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_oauth_states (
  state              TEXT PRIMARY KEY,
  owner_type         TEXT NOT NULL
                      CHECK (owner_type IN ('admin', 'diviner')),
  owner_id           UUID,
  platform           TEXT NOT NULL
                      CHECK (platform IN (
                        'twitter', 'facebook', 'instagram',
                        'linkedin', 'tiktok', 'youtube'
                      )),

  -- PKCE code_verifier (for OAuth 2.0 PKCE flow — Twitter requires it).
  code_verifier      TEXT,

  -- URL to return the user to after successful connect.
  redirect_after_url TEXT,

  -- The auth.uid() at time of initiation. Lets the callback verify that
  -- the browser session that finishes OAuth is the one that started it.
  user_id            UUID,

  expires_at         TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_oauth_states_expires_idx
  ON social_oauth_states (expires_at);

ALTER TABLE social_oauth_states ENABLE ROW LEVEL SECURITY;
-- Same pattern: server-only. No public policies.

COMMIT;

-- ── Rollback (manual) ───────────────────────────────────────────────────────
-- BEGIN;
--   DROP TABLE IF EXISTS social_oauth_states;
--   DROP TABLE IF EXISTS social_accounts;
--   DROP FUNCTION IF EXISTS set_social_accounts_updated_at();
-- COMMIT;
