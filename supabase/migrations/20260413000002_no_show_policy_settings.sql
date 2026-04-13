-- ============================================================================
-- Add configurable no-show refund policy to platform_settings
--
-- Replaces hardcoded 100% (diviner no-show) and 50% (client no-show)
-- refund percentages in the no-show cron job with admin-configurable values.
-- ============================================================================

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS no_show_diviner_refund_percent INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS no_show_client_refund_percent INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS no_show_grace_minutes INTEGER NOT NULL DEFAULT 10;

-- Validate ranges
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
