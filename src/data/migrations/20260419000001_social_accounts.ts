// Bundled mirror of supabase/migrations/20260419000001_social_accounts.sql
//
// Keep this file in lock-step with the canonical .sql. Both are executed
// (canonical .sql via `node scripts/run-migration.js`, this mirror via the
// admin UI at /admin/db/migrations which imports MIGRATIONS from
// src/lib/db/migrations.ts).
//
// Strictly additive per CLAUDE.md §5 + §7. No drops, no backfill.

export const MIGRATION_SQL = `
BEGIN;

CREATE TABLE IF NOT EXISTS social_accounts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type                TEXT NOT NULL
                              CHECK (owner_type IN ('admin', 'diviner')),
  owner_id                  UUID,
  platform                  TEXT NOT NULL
                              CHECK (platform IN (
                                'twitter', 'facebook', 'instagram',
                                'linkedin', 'tiktok', 'youtube'
                              )),
  platform_account_id       TEXT NOT NULL,
  platform_account_handle   TEXT,
  platform_account_name     TEXT,
  access_token_ciphertext   TEXT NOT NULL,
  access_token_iv           TEXT NOT NULL,
  access_token_tag          TEXT NOT NULL,
  refresh_token_ciphertext  TEXT,
  refresh_token_iv          TEXT,
  refresh_token_tag         TEXT,
  token_expires_at          TIMESTAMPTZ,
  scopes                    TEXT[],
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

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_active_unique_idx
  ON social_accounts (
    owner_type,
    platform,
    COALESCE(owner_id::text, '__admin__')
  )
  WHERE disconnected_at IS NULL;

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
  code_verifier      TEXT,
  redirect_after_url TEXT,
  user_id            UUID,
  expires_at         TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_oauth_states_expires_idx
  ON social_oauth_states (expires_at);

ALTER TABLE social_oauth_states ENABLE ROW LEVEL SECURITY;

COMMIT;
`;
