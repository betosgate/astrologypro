// AUTO-GENERATED bundled mirror of supabase/migrations/20260408000107_astro_system_settings.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.
// To regenerate: copy the .sql file contents into the template literal below.

export const MIGRATION_SQL = `-- ============================================================================
-- astro_system_settings: unified astrology config + credential store
--
-- Replaces the role currently played by \`astrology_api_keys\` (which only
-- holds ASTROLOGY_API key/secret pairs) by introducing one centralised table
-- for three categories of astrology-related settings:
--
--   1. ASTROLOGY_API     — multiple access_key + secret_key pairs for
--                          json.astrologyapi.com (round-robin / LRU rotation)
--   2. FREEASTROLOGY_API — multiple API-key-only entries for the
--                          FreeAstrologyAPI service (no secret)
--   3. SYSTEM_CONFIG     — single named values like ASTRO_AI_API_URL or
--                          ASTRO_PLANET_RETURN_URL (no secret)
--
-- The status column controls activation. Consumers query
-- (type, status='active') and pick the first row, OR rotate across all
-- active rows for a type.
--
-- Migration is additive — \`astrology_api_keys\` is left in place during the
-- dual-read window. A follow-up migration will drop it once every consumer
-- has switched over to the helper in \`src/lib/astro/system-settings.ts\`.
-- ============================================================================

CREATE TABLE IF NOT EXISTS astro_system_settings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT        NOT NULL,
  key_name      TEXT        NOT NULL,
  key_value     TEXT        NOT NULL,
  secret_value  TEXT,
  status        TEXT        NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT astro_system_settings_type_check
    CHECK (type IN ('ASTROLOGY_API', 'FREEASTROLOGY_API', 'SYSTEM_CONFIG')),
  CONSTRAINT astro_system_settings_status_check
    CHECK (status IN ('active', 'inactive')),

  -- Same name within a type is unique. Different types may share names.
  CONSTRAINT astro_system_settings_type_name_key UNIQUE (type, key_name)
);

-- Indexes match the two real query patterns:
--   (a) "give me one active row of type X"        -> (type, status)
--   (b) "look up by type+name during admin edit"  -> covered by the unique constraint
CREATE INDEX IF NOT EXISTS idx_astro_system_settings_type_status
  ON astro_system_settings (type, status);

-- updated_at trigger (uses extensions.moddatetime when available, otherwise
-- a manual fallback so the migration is portable across Supabase projects)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions' AND p.proname = 'moddatetime'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_astro_system_settings
               BEFORE UPDATE ON astro_system_settings
               FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  ELSE
    -- Inline updated_at trigger
    CREATE OR REPLACE FUNCTION update_astro_system_settings_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $f$
    BEGIN NEW.updated_at = now(); RETURN NEW; END; $f$;

    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_astro_system_settings
               BEFORE UPDATE ON astro_system_settings
               FOR EACH ROW EXECUTE FUNCTION update_astro_system_settings_updated_at()';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- RLS — credentials live in this table, so service_role only.
ALTER TABLE astro_system_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'astro_system_settings' AND policyname = 'astro_system_settings_service_role'
  ) THEN
    CREATE POLICY astro_system_settings_service_role
      ON astro_system_settings FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

COMMENT ON TABLE astro_system_settings IS
  'Centralised store for astrology API credentials and system configuration. Three types: ASTROLOGY_API (key+secret pairs), FREEASTROLOGY_API (key only), SYSTEM_CONFIG (named URLs/values). Replaces astrology_api_keys via additive backfill.';

-- ----------------------------------------------------------------------------
-- Backfill: copy every existing row from astrology_api_keys into the new
-- table as type='ASTROLOGY_API'. Idempotent via the type+key_name unique
-- constraint, so rerunning the migration is safe and a partial backfill from
-- a previous attempt is preserved.
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'astrology_api_keys'
  ) THEN
    INSERT INTO astro_system_settings (type, key_name, key_value, secret_value, status)
    SELECT
      'ASTROLOGY_API',
      label,
      access_key,
      secret_key,
      CASE WHEN is_active THEN 'active' ELSE 'inactive' END
    FROM astrology_api_keys
    ON CONFLICT (type, key_name) DO NOTHING;
  END IF;
END $$;
`;
