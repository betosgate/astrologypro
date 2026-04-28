// AUTO-GENERATED bundled mirror of supabase/migrations/20260428000003_ritual_global_settings.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `-- ============================================================================
-- Ritual Global Playback Settings (Apr 28, 2026)
--
-- Singleton table to store platform-wide video player behaviors.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ritual_global_settings (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  video_loop        BOOLEAN      NOT NULL DEFAULT FALSE,
  video_autoplay    BOOLEAN      NOT NULL DEFAULT TRUE,
  video_controls    BOOLEAN      NOT NULL DEFAULT TRUE,
  video_muted       BOOLEAN      NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists (singleton pattern)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ux_ritual_global_settings_singleton'
    ) THEN
        ALTER TABLE public.ritual_global_settings ADD COLUMN IF NOT EXISTS singleton_guard BOOLEAN DEFAULT TRUE UNIQUE;
        ALTER TABLE public.ritual_global_settings ADD CONSTRAINT ux_ritual_global_settings_singleton CHECK (singleton_guard = TRUE);
    END IF;
END $$;

-- RLS
ALTER TABLE public.ritual_global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ritual_global_settings_service_all ON public.ritual_global_settings;
CREATE POLICY ritual_global_settings_service_all
  ON public.ritual_global_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ritual_global_settings_auth_read ON public.ritual_global_settings;
CREATE POLICY ritual_global_settings_auth_read
  ON public.ritual_global_settings FOR SELECT TO authenticated
  USING (true);

-- Seed default settings if empty
INSERT INTO public.ritual_global_settings (video_loop, video_autoplay, video_controls, video_muted)
SELECT false, true, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.ritual_global_settings);
`;
