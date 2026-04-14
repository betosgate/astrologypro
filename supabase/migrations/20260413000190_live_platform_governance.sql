CREATE TABLE IF NOT EXISTS public.live_platform_registry (
  platform_key text PRIMARY KEY,
  display_name text NOT NULL,
  is_globally_enabled boolean NOT NULL DEFAULT true,
  is_selectable_by_diviners boolean NOT NULL DEFAULT true,
  integration_tier text NOT NULL DEFAULT 'managed'
    CHECK (integration_tier IN ('first_class', 'managed', 'link_out_only', 'custom')),
  playback_mode text NOT NULL DEFAULT 'external_link'
    CHECK (playback_mode IN ('embedded_player', 'external_link', 'manual_status')),
  supports_embed boolean NOT NULL DEFAULT false,
  supports_chat_embed boolean NOT NULL DEFAULT false,
  supports_oauth_connection boolean NOT NULL DEFAULT false,
  supports_event_sync boolean NOT NULL DEFAULT false,
  supports_auto_live_detection boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.live_platform_registry (
  platform_key,
  display_name,
  is_globally_enabled,
  is_selectable_by_diviners,
  integration_tier,
  playback_mode,
  supports_embed,
  supports_chat_embed,
  supports_oauth_connection,
  supports_event_sync,
  supports_auto_live_detection,
  sort_order,
  admin_notes
)
VALUES
  ('youtube', 'YouTube', true, true, 'first_class', 'embedded_player', true, false, true, true, true, 10, 'Primary embedded live platform.'),
  ('twitch', 'Twitch', true, true, 'first_class', 'embedded_player', true, true, true, true, true, 20, 'Primary gaming or chat-heavy live platform.'),
  ('facebook', 'Facebook', true, true, 'managed', 'embedded_player', true, false, false, false, false, 30, 'Supported conservatively for public video embeds.'),
  ('instagram', 'Instagram', true, true, 'link_out_only', 'external_link', false, false, false, false, false, 40, 'Link-out only.'),
  ('tiktok', 'TikTok', true, true, 'link_out_only', 'external_link', false, false, false, false, false, 50, 'Link-out only.'),
  ('zoom', 'Zoom', true, true, 'first_class', 'external_link', false, false, false, false, false, 60, 'Owned-session join or watch path.'),
  ('other', 'Other', true, true, 'custom', 'external_link', false, false, false, false, false, 70, 'Fallback custom provider.')
ON CONFLICT (platform_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  integration_tier = EXCLUDED.integration_tier,
  playback_mode = EXCLUDED.playback_mode,
  supports_embed = EXCLUDED.supports_embed,
  supports_chat_embed = EXCLUDED.supports_chat_embed,
  supports_oauth_connection = EXCLUDED.supports_oauth_connection,
  supports_event_sync = EXCLUDED.supports_event_sync,
  supports_auto_live_detection = EXCLUDED.supports_auto_live_detection,
  sort_order = EXCLUDED.sort_order,
  admin_notes = EXCLUDED.admin_notes,
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.diviner_live_platform_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES public.diviners(id) ON DELETE CASCADE,
  platform_key text NOT NULL REFERENCES public.live_platform_registry(platform_key) ON DELETE CASCADE,
  availability_mode text NOT NULL DEFAULT 'inherit'
    CHECK (availability_mode IN ('inherit', 'force_enable', 'force_disable')),
  reason text,
  set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  set_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(diviner_id, platform_key)
);

CREATE INDEX IF NOT EXISTS live_platform_registry_enabled_idx
  ON public.live_platform_registry(is_globally_enabled, is_selectable_by_diviners, sort_order);

CREATE INDEX IF NOT EXISTS diviner_live_platform_overrides_diviner_idx
  ON public.diviner_live_platform_overrides(diviner_id, platform_key);

ALTER TABLE public.stream_platform_configs
  DROP CONSTRAINT IF EXISTS stream_platform_configs_platform_check;

ALTER TABLE public.stream_platform_configs
  ADD CONSTRAINT stream_platform_configs_platform_check
  CHECK (platform IN ('youtube', 'twitch', 'facebook', 'instagram', 'tiktok', 'zoom', 'other'));
