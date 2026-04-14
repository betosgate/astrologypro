ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS max_diviner_affiliate_share_percent numeric(5,2) NOT NULL DEFAULT 60;

UPDATE platform_settings
SET max_diviner_affiliate_share_percent = 60
WHERE max_diviner_affiliate_share_percent IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_settings_max_diviner_affiliate_share_percent_check'
  ) THEN
    ALTER TABLE platform_settings
      ADD CONSTRAINT platform_settings_max_diviner_affiliate_share_percent_check
      CHECK (
        max_diviner_affiliate_share_percent >= 0
        AND max_diviner_affiliate_share_percent <= 100
      );
  END IF;
END $$;
