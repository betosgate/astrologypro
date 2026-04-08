-- ============================================================================
-- Allow duplicate (type, key_name) rows in astro_system_settings
--
-- Per the spec in
-- tasks/08.04.2026/astro-toolkit/allow-duplicate-system-settings.md, the
-- API should accept multiple rows with the same (type, key_name) so an
-- admin can store rotation pools (e.g. multiple ASTROLOGY_API keys with
-- the same key_name label) without 409 conflicts.
--
-- Drops both the explicitly-named constraint from migration
-- 20260408000107_astro_system_settings AND any auto-generated UNIQUE that
-- Postgres may have created on the same column pair. The
-- corresponding auto-created index goes away with the constraint.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS is safe on every run.
--
-- Note on consequences:
--   * The helper getActiveAstroSetting() still picks the first active row,
--     so existing read paths are unchanged.
--   * Future seed migrations that used ON CONFLICT (type, key_name) DO ...
--     would no longer find a matching constraint to anchor the upsert. The
--     existing seed in 20260408000107 has already been applied via the
--     runner before this migration, so this is forward-only.
-- ============================================================================

ALTER TABLE public.astro_system_settings
  DROP CONSTRAINT IF EXISTS astro_system_settings_type_name_key;

-- Belt-and-braces: drop any other auto-named unique on (type, key_name).
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'astro_system_settings'
      AND c.contype = 'u'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.astro_system_settings DROP CONSTRAINT %I',
      con.conname
    );
  END LOOP;
END $$;

COMMENT ON TABLE public.astro_system_settings IS
  'Centralised store for astrology API credentials and system configuration. Three types: ASTROLOGY_API (key+secret pairs), FREEASTROLOGY_API (key only), SYSTEM_CONFIG (named URLs/values). Multiple rows with the same (type, key_name) are allowed — the helper getActiveAstroSetting picks the first active row by created_at.';
