// AUTO-GENERATED bundled mirror of supabase/migrations/20260413000002_no_show_policy_settings.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS no_show_diviner_refund_percent INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS no_show_client_refund_percent INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS no_show_grace_minutes INTEGER NOT NULL DEFAULT 10;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_diviner_refund_range'
  ) THEN
    ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_diviner_refund_range
      CHECK (no_show_diviner_refund_percent BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_client_refund_range'
  ) THEN
    ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_client_refund_range
      CHECK (no_show_client_refund_percent BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_grace_minutes_range'
  ) THEN
    ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_grace_minutes_range
      CHECK (no_show_grace_minutes BETWEEN 1 AND 60);
  END IF;
END $$;
`;
