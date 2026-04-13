-- ============================================================================
-- Calendar provider credentials (Google + Microsoft)
--
-- Two sibling tables that store the ADMIN-managed OAuth client credentials
-- for each calendar provider. This is distinct from calendar_connections —
-- which holds PER-USER OAuth refresh/access tokens. These tables hold the
-- application-level credentials (client_id, client_secret, redirect_uri,
-- tenant_id, etc.) that drive the OAuth handshake for every user.
--
-- Shape: flexible key-value rows. The runtime consumers look for the
-- well-known keys:
--   - google_api_keys      : client_id | client_secret | redirect_uri
--   - microsoft_api_keys   : client_id | client_secret | redirect_uri | tenant_id
--
-- Extra keys can be added by admins without a schema change (e.g. if Google
-- later splits scopes into a separate setting).
--
-- Security model:
--   - Service-role only. There is no authenticated SELECT policy and no
--     anon SELECT policy — these values are secrets. All reads go through
--     the admin Supabase client which bypasses RLS (the admin API routes
--     gate with getAdminUser() before calling it).
--   - Matches the service-role-only pattern used by calendar_connections
--     and pending_perennial_signups.
--
-- Additive and idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF
-- EXISTS before CREATE POLICY. Re-running is safe.
-- ============================================================================

-- ── Google API keys ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_api_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive lookup by (key) is the hot path for the runtime
-- provider-credentials helper.
CREATE INDEX IF NOT EXISTS google_api_keys_key_idx
  ON google_api_keys (lower(key))
  WHERE is_active = true;

ALTER TABLE google_api_keys ENABLE ROW LEVEL SECURITY;

-- Service-role-only: no anon/authenticated policies.
DROP POLICY IF EXISTS service_role_all_google_api_keys ON google_api_keys;
CREATE POLICY service_role_all_google_api_keys
  ON google_api_keys FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── Microsoft API keys ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS microsoft_api_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS microsoft_api_keys_key_idx
  ON microsoft_api_keys (lower(key))
  WHERE is_active = true;

ALTER TABLE microsoft_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_microsoft_api_keys ON microsoft_api_keys;
CREATE POLICY service_role_all_microsoft_api_keys
  ON microsoft_api_keys FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── updated_at trigger (shared with the rest of the project) ───────────────
-- moddatetime extension may or may not be available; fall back to no trigger
-- if it isn't. The API routes also stamp updated_at manually on PATCH.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions'
      AND p.proname = 'moddatetime'
  ) THEN
    DROP TRIGGER IF EXISTS google_api_keys_updated_at ON google_api_keys;
    CREATE TRIGGER google_api_keys_updated_at
      BEFORE UPDATE ON google_api_keys
      FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

    DROP TRIGGER IF EXISTS microsoft_api_keys_updated_at ON microsoft_api_keys;
    CREATE TRIGGER microsoft_api_keys_updated_at
      BEFORE UPDATE ON microsoft_api_keys
      FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);
  END IF;
END $$;
