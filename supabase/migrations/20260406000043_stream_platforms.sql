-- Stream platform configs — one row per platform per diviner
CREATE TABLE stream_platform_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube','facebook','instagram','tiktok','zoom','other')),
  display_name text, -- optional override e.g. "My YouTube Channel"
  stream_url text, -- embed or channel URL
  embed_url text, -- direct embed URL if different
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(diviner_id, platform)
);

CREATE INDEX IF NOT EXISTS spc_diviner_id_idx ON stream_platform_configs(diviner_id, sort_order, is_enabled);

ALTER TABLE stream_platform_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'stream_platform_configs'
      AND policyname = 'diviners_manage_own_platforms'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_manage_own_platforms"
        ON stream_platform_configs FOR ALL
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'stream_platform_configs'
      AND policyname = 'public_read_enabled_platforms'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "public_read_enabled_platforms"
        ON stream_platform_configs FOR SELECT
        USING (is_enabled = true)
    $p$;
  END IF;
END $$;

-- Migrate existing data
INSERT INTO stream_platform_configs (diviner_id, platform, stream_url, is_enabled)
SELECT id, 'youtube', youtube_channel_id, true
FROM diviners
WHERE youtube_channel_id IS NOT NULL AND youtube_channel_id != ''
ON CONFLICT (diviner_id, platform) DO NOTHING;

INSERT INTO stream_platform_configs (diviner_id, platform, stream_url, is_enabled)
SELECT id, 'facebook', facebook_live_url, true
FROM diviners
WHERE facebook_live_url IS NOT NULL AND facebook_live_url != ''
ON CONFLICT (diviner_id, platform) DO NOTHING;

-- Also add is_live and fallback_content to diviners if not exists
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS live_platforms text[] DEFAULT '{}'; -- which platforms currently active
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS fallback_content text; -- shown when not live
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS next_live_at timestamptz;
