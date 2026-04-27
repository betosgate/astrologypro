-- ============================================================================
-- Ritual Admin Configuration (Apr 27, 2026)
--
-- Spec source:
--   docs/tasks/2026-04-27/03-admin-ritual-configurations-and-dynamic-media-management.md
--
-- Foundation tables for moving ritual presentation + asset mapping out of
-- hardcoded constants and into admin-managed records:
--
--   ritual_definitions     — ritual metadata, playback policy, optional
--                            final-override asset link
--   ritual_media_assets    — upload-backed or URL-backed video assets
--   ritual_asset_mappings  — (tag_key | step_role) → asset_id, scoped
--                            global or per-ritual-definition
--
-- The migration also seeds initial rows so the runtime resolver has
-- data on day one and `nothing should break`:
--   1. Four ritual definitions (the three static rituals + the dynamic
--      planetary/zodiacal one) — final_override DISABLED by default so
--      the existing playlist behaviour is preserved.
--   2. Every video filename currently in `src/lib/community/ritual-video-map.ts`
--      as a `ritual_media_assets` row pointing at the existing S3 URL.
--   3. Tag → asset mappings (global scope) for every key in the same
--      hardcoded map.
--
-- This means the resolver can read the DB exclusively for already-known
-- tags, while the code map remains as an emergency fallback.
--
-- Strictly additive. Safe to re-run. Existing tables and rituals are
-- untouched. Planet/zodiac sequencing logic stays in code (TS module).
-- ============================================================================

-- ── Tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ritual_media_assets (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key                VARCHAR(120) NOT NULL UNIQUE,
  title                    TEXT         NOT NULL,
  source_type              VARCHAR(20)  NOT NULL DEFAULT 'external_url',
  storage_path             TEXT,
  external_url             TEXT,
  mime_type                VARCHAR(80)  DEFAULT 'video/mp4',
  duration_seconds         INTEGER,
  poster_url               TEXT,
  notes                    TEXT,
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  is_published             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  archived_at              TIMESTAMPTZ,

  CONSTRAINT ritual_media_assets_source_type_check
    CHECK (source_type IN ('upload', 'external_url')),
  -- Either storage_path (upload) or external_url (URL paste) must be set,
  -- not both, never neither. NULL ↔ missing source.
  CONSTRAINT ritual_media_assets_source_present_check
    CHECK (
      (source_type = 'upload' AND storage_path IS NOT NULL)
      OR
      (source_type = 'external_url' AND external_url IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_ritual_media_assets_active_published
  ON public.ritual_media_assets (is_active, is_published)
  WHERE is_active = TRUE AND is_published = TRUE;

CREATE TABLE IF NOT EXISTS public.ritual_definitions (
  id                            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  key                           VARCHAR(80)  NOT NULL UNIQUE,
  title                         TEXT         NOT NULL,
  description                   TEXT,
  ritual_type                   VARCHAR(20)  NOT NULL DEFAULT 'dynamic',
  supported_mode                VARCHAR(20)  NOT NULL DEFAULT 'both',
  badge_label                   TEXT,
  icon_key                      VARCHAR(60),
  sort_order                    INTEGER      NOT NULL DEFAULT 0,
  is_visible                    BOOLEAN      NOT NULL DEFAULT TRUE,
  is_published                  BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Loose JSON for playback policy toggles. Default mirrors current behaviour.
  playback_policy_json          JSONB        NOT NULL DEFAULT '{
    "autoplay": true,
    "sequential_lock": true,
    "allow_backward_replay": true,
    "show_playlist": true,
    "completion_requires_video_end": true,
    "missing_asset_behavior": "warn_and_skip"
  }'::jsonb,
  final_override_enabled        BOOLEAN      NOT NULL DEFAULT FALSE,
  final_override_asset_id       UUID         REFERENCES public.ritual_media_assets(id) ON DELETE SET NULL,
  -- User-facing label overrides (Section D in the spec).
  card_title_override           TEXT,
  card_description_override     TEXT,
  card_cta_label_override       TEXT,
  playlist_title_override       TEXT,
  completion_message            TEXT,
  missing_asset_message         TEXT,
  created_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  archived_at                   TIMESTAMPTZ,

  CONSTRAINT ritual_definitions_ritual_type_check
    CHECK (ritual_type IN ('static', 'dynamic')),
  CONSTRAINT ritual_definitions_supported_mode_check
    CHECK (supported_mode IN ('invocation', 'banishing', 'both'))
);

CREATE INDEX IF NOT EXISTS ix_ritual_definitions_published_visible
  ON public.ritual_definitions (is_published, is_visible, sort_order)
  WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS public.ritual_asset_mappings (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_definition_id     UUID         REFERENCES public.ritual_definitions(id) ON DELETE CASCADE,
  -- 'global' = applies to every ritual; 'ritual_definition' = scoped to one.
  mapping_scope            VARCHAR(24)  NOT NULL DEFAULT 'global',
  -- The canonical tag persisted on user_ritual_configurations.ritual_tags
  -- (e.g. "Fire_Gate_Invocation_Ritual"). Optional when step_role is set.
  tag_key                  VARCHAR(120),
  step_role                VARCHAR(40),
  asset_id                 UUID         NOT NULL REFERENCES public.ritual_media_assets(id) ON DELETE CASCADE,
  label_override           TEXT,
  sort_order               INTEGER      NOT NULL DEFAULT 0,
  is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT ritual_asset_mappings_scope_check
    CHECK (mapping_scope IN ('global', 'ritual_definition')),
  -- A scope=ritual_definition row must reference a ritual_definition_id;
  -- a scope=global row must NOT.
  CONSTRAINT ritual_asset_mappings_scope_consistency_check
    CHECK (
      (mapping_scope = 'global' AND ritual_definition_id IS NULL)
      OR
      (mapping_scope = 'ritual_definition' AND ritual_definition_id IS NOT NULL)
    ),
  -- Either a tag_key or a step_role (or both) must identify the slot.
  CONSTRAINT ritual_asset_mappings_target_present_check
    CHECK (
      tag_key IS NOT NULL OR step_role IS NOT NULL
    )
);

-- Uniqueness:
--   - one global mapping per tag_key
--   - one per-ritual mapping per (ritual_definition_id, tag_key)
-- Implemented as partial unique indexes since `mapping_scope` is the
-- discriminator and tag_key can be null.
CREATE UNIQUE INDEX IF NOT EXISTS ux_ritual_asset_mappings_global_tag
  ON public.ritual_asset_mappings (tag_key)
  WHERE mapping_scope = 'global' AND tag_key IS NOT NULL AND is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ritual_asset_mappings_definition_tag
  ON public.ritual_asset_mappings (ritual_definition_id, tag_key)
  WHERE mapping_scope = 'ritual_definition' AND tag_key IS NOT NULL AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS ix_ritual_asset_mappings_lookup
  ON public.ritual_asset_mappings (mapping_scope, tag_key, ritual_definition_id)
  WHERE is_active = TRUE;

-- ── updated_at trigger (reuses helper if present) ────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'astro_ai_responses_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.ritual_admin_set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $body$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $body$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS ritual_definitions_updated_at_trg
  ON public.ritual_definitions;
CREATE TRIGGER ritual_definitions_updated_at_trg
  BEFORE UPDATE ON public.ritual_definitions
  FOR EACH ROW EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

DROP TRIGGER IF EXISTS ritual_media_assets_updated_at_trg
  ON public.ritual_media_assets;
CREATE TRIGGER ritual_media_assets_updated_at_trg
  BEFORE UPDATE ON public.ritual_media_assets
  FOR EACH ROW EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

DROP TRIGGER IF EXISTS ritual_asset_mappings_updated_at_trg
  ON public.ritual_asset_mappings;
CREATE TRIGGER ritual_asset_mappings_updated_at_trg
  BEFORE UPDATE ON public.ritual_asset_mappings
  FOR EACH ROW EXECUTE PROCEDURE public.astro_ai_responses_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
-- All three tables: service_role full; authenticated read of published/active
-- rows so the runtime resolver running under user sessions can read without
-- needing service-role escalation. Writes only via service_role (admin
-- endpoints in Phase 2 will go through the admin client).

ALTER TABLE public.ritual_media_assets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_definitions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_asset_mappings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ritual_media_assets_service_all ON public.ritual_media_assets;
CREATE POLICY ritual_media_assets_service_all
  ON public.ritual_media_assets FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ritual_media_assets_auth_read ON public.ritual_media_assets;
CREATE POLICY ritual_media_assets_auth_read
  ON public.ritual_media_assets FOR SELECT TO authenticated
  USING (is_active = TRUE AND is_published = TRUE AND archived_at IS NULL);

DROP POLICY IF EXISTS ritual_definitions_service_all ON public.ritual_definitions;
CREATE POLICY ritual_definitions_service_all
  ON public.ritual_definitions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ritual_definitions_auth_read ON public.ritual_definitions;
CREATE POLICY ritual_definitions_auth_read
  ON public.ritual_definitions FOR SELECT TO authenticated
  USING (is_published = TRUE AND archived_at IS NULL);

DROP POLICY IF EXISTS ritual_asset_mappings_service_all ON public.ritual_asset_mappings;
CREATE POLICY ritual_asset_mappings_service_all
  ON public.ritual_asset_mappings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ritual_asset_mappings_auth_read ON public.ritual_asset_mappings;
CREATE POLICY ritual_asset_mappings_auth_read
  ON public.ritual_asset_mappings FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- ── Seed: ritual definitions ─────────────────────────────────────────────

INSERT INTO public.ritual_definitions
  (key, title, description, ritual_type, supported_mode, badge_label, sort_order, is_visible, is_published)
VALUES
  ('standard_banishing_pentagram',
   'Standard Banishing Ritual of the Pentagram',
   'Traditional banishing ritual of the pentagram. A grounding clearing rite suitable as a daily practice or a preface to deeper work.',
   'static', 'banishing', 'Banishing', 10, TRUE, TRUE),
  ('standard_invocation_pentagram',
   'Standard Invocation Ritual of the Pentagram',
   'Traditional invocation ritual of the pentagram. A focused calling-in rite for opening sacred space.',
   'static', 'invocation', 'Invocation', 20, TRUE, TRUE),
  ('dib_invocation_ritual',
   'Divine Infinite Being Invocation Ritual',
   'Core invocation rite for the Divine Infinite Being current.',
   'static', 'invocation', 'Core', 30, TRUE, TRUE),
  ('planetary_zodiacal_invocation',
   'Planetary Zodiacal Invocation Ritual of the Pentagram',
   'Custom planetary and zodiacal invocations sequenced through the elemental gate hierarchy. Choose planets and zodiacs to invoke; the system orders them per the ritual praxis.',
   'dynamic', 'both', 'Custom', 40, TRUE, TRUE)
ON CONFLICT (key) DO NOTHING;

-- ── Seed: media assets (mirror src/lib/community/ritual-video-map.ts) ────

INSERT INTO public.ritual_media_assets
  (asset_key, title, source_type, external_url)
VALUES
  ('ritual_opening',          'Ritual Opening',          'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/Ritual_Opening.mp4'),
  ('ritual_closing',          'Ritual Closing',          'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/Ritual_Closing.mp4'),
  ('standard_banishing',      'Standard Banishing Ritual',  'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/StandardBanishingRitual.mp4'),
  ('standard_invocation',     'Standard Invocation Ritual', 'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/StandardInvocationRitual.mp4'),
  ('core_invocation',         'Core Invocation Ritual',     'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/Core_Invocation_Ritual.mp4'),
  ('fire_gate_invocation',    'Fire Gate Invocation',    'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/fire_gate_invocation.mp4'),
  ('fire_gate_banishing',     'Fire Gate Banishing',     'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/fire_gate_banishing.mp4'),
  ('water_gate_invocation',   'Water Gate Invocation',   'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/water_gate_invocation.mp4'),
  ('water_gate_banishing',    'Water Gate Banishing',    'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/water_gate_banishing.mp4'),
  ('air_gate_invocation',     'Air Gate Invocation',     'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/air_gate_invocation.mp4'),
  ('air_gate_banishing',      'Air Gate Banishing',      'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/air_gate_banishing.mp4'),
  ('earth_gate_invocation',   'Earth Gate Invocation',   'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/earth_gate_invocation.mp4'),
  ('earth_gate_banishing',    'Earth Gate Banishing',    'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/earth_gate_banishing.mp4'),
  ('spirit_gate_invocation',  'Spirit Gate Invocation',  'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/spirit_gate_invocation.mp4'),
  ('spirit_gate_banishing',   'Spirit Gate Banishing',   'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/spirit_gate_banishing.mp4'),
  -- Planetary
  ('mars_invocation',         'Mars Invocation',         'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/mars_invocation.mp4'),
  ('jupiter_invocation',      'Jupiter Invocation',      'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/jupiter_invocation.mp4'),
  ('moon_invocation',         'Moon Invocation',         'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/moon_invocation.mp4'),
  ('neptune_invocation',      'Neptune Invocation',      'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/neptune_invocation.mp4'),
  ('mercury_invocation',      'Mercury Invocation',      'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/mercury_invocation.mp4'),
  ('uranus_invocation',       'Uranus Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/uranus_invocation.mp4'),
  ('venus_invocation',        'Venus Invocation',        'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/venus_invocation.mp4'),
  ('saturn_invocation',       'Saturn Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/saturn_invocation.mp4'),
  ('sun_invocation',          'Sun Invocation',          'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/sun_invocation.mp4'),
  ('pluto_invocation',        'Pluto Invocation',        'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/pluto_invocation.mp4'),
  -- Zodiac
  ('aries_invocation',        'Aries Invocation',        'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/aries_invocation.mp4'),
  ('leo_invocation',          'Leo Invocation',          'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/leo_invocation.mp4'),
  ('sagittarius_invocation',  'Sagittarius Invocation',  'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/sagittarius_invocation.mp4'),
  ('cancer_invocation',       'Cancer Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/cancer_invocation.mp4'),
  ('scorpio_invocation',      'Scorpio Invocation',      'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/scorpio_invocation.mp4'),
  ('pisces_invocation',       'Pisces Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/pisces_invocation.mp4'),
  ('libra_invocation',        'Libra Invocation',        'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/libra_invocation.mp4'),
  ('aquarius_invocation',     'Aquarius Invocation',     'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/aquarius_invocation.mp4'),
  ('gemini_invocation',       'Gemini Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/gemini_invocation.mp4'),
  ('capricorn_invocation',    'Capricorn Invocation',    'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/capricorn_invocation.mp4'),
  ('taurus_invocation',       'Taurus Invocation',       'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/taurus_invocation.mp4'),
  ('virgo_invocation',        'Virgo Invocation',        'external_url', 'https://divineritualasset.s3.us-east-1.amazonaws.com/virgo_invocation.mp4')
ON CONFLICT (asset_key) DO NOTHING;

-- ── Seed: tag mappings (global scope) ────────────────────────────────────
-- Mirror every key in src/lib/community/ritual-video-map.ts so the runtime
-- resolver can read the DB exclusively for known tags.

DO $$
DECLARE
  pairs TEXT[][] := ARRAY[
    -- [tag_key, asset_key]
    ARRAY['Ritual_Opening',                    'ritual_opening'],
    ARRAY['Ritual_Closing',                    'ritual_closing'],
    ARRAY['Pentagram_Gate_Banishing_Ritual',   'standard_banishing'],
    ARRAY['Pentagram_Banishing_Ritual',        'standard_banishing'],
    ARRAY['Pentagram_Gate_Invocation_Ritual',  'standard_invocation'],
    ARRAY['Pentagram_Invocation_Ritual',       'standard_invocation'],
    ARRAY['DIB_Gate_Invocation_Ritual',        'core_invocation'],
    ARRAY['DIB_Invocation_Ritual',             'core_invocation'],
    ARRAY['Fire_Gate_Invocation_Ritual',       'fire_gate_invocation'],
    ARRAY['Water_Gate_Invocation_Ritual',      'water_gate_invocation'],
    ARRAY['Air_Gate_Invocation_Ritual',        'air_gate_invocation'],
    ARRAY['Earth_Gate_Invocation_Ritual',      'earth_gate_invocation'],
    ARRAY['Spirit_Gate_Invocation_Ritual',     'spirit_gate_invocation'],
    ARRAY['Fire_Gate_Banishing_Ritual',        'fire_gate_banishing'],
    ARRAY['Water_Gate_Banishing_Ritual',       'water_gate_banishing'],
    ARRAY['Air_Gate_Banishing_Ritual',         'air_gate_banishing'],
    ARRAY['Earth_Gate_Banishing_Ritual',       'earth_gate_banishing'],
    ARRAY['Spirit_Gate_Banishing_Ritual',      'spirit_gate_banishing'],
    ARRAY['Mars_Invocation_Ritual',            'mars_invocation'],
    ARRAY['Jupiter_Invocation_Ritual',         'jupiter_invocation'],
    ARRAY['Moon_Invocation_Ritual',            'moon_invocation'],
    ARRAY['Neptune_Invocation_Ritual',         'neptune_invocation'],
    ARRAY['Mercury_Invocation_Ritual',         'mercury_invocation'],
    ARRAY['Uranus_Invocation_Ritual',          'uranus_invocation'],
    ARRAY['Venus_Invocation_Ritual',           'venus_invocation'],
    ARRAY['Saturn_Invocation_Ritual',          'saturn_invocation'],
    ARRAY['Sun_Invocation_Ritual',             'sun_invocation'],
    ARRAY['Pluto_Invocation_Ritual',           'pluto_invocation'],
    ARRAY['Aries_Invocation_Ritual',           'aries_invocation'],
    ARRAY['Leo_Invocation_Ritual',             'leo_invocation'],
    ARRAY['Sagittarius_Invocation_Ritual',     'sagittarius_invocation'],
    ARRAY['Cancer_Invocation_Ritual',          'cancer_invocation'],
    ARRAY['Scorpio_Invocation_Ritual',         'scorpio_invocation'],
    ARRAY['Pisces_Invocation_Ritual',          'pisces_invocation'],
    ARRAY['Libra_Invocation_Ritual',           'libra_invocation'],
    ARRAY['Aquarius_Invocation_Ritual',        'aquarius_invocation'],
    ARRAY['Gemini_Invocation_Ritual',          'gemini_invocation'],
    ARRAY['Capricorn_Invocation_Ritual',       'capricorn_invocation'],
    ARRAY['Taurus_Invocation_Ritual',          'taurus_invocation'],
    ARRAY['Virgo_Invocation_Ritual',           'virgo_invocation']
  ];
  pair TEXT[];
  v_asset_id UUID;
BEGIN
  FOREACH pair SLICE 1 IN ARRAY pairs LOOP
    SELECT id INTO v_asset_id
      FROM public.ritual_media_assets WHERE asset_key = pair[2];
    IF v_asset_id IS NULL THEN CONTINUE; END IF;

    -- Idempotent: skip if a global mapping for this tag already exists.
    IF NOT EXISTS (
      SELECT 1 FROM public.ritual_asset_mappings
      WHERE mapping_scope = 'global' AND tag_key = pair[1] AND is_active = TRUE
    ) THEN
      INSERT INTO public.ritual_asset_mappings
        (mapping_scope, tag_key, asset_id, is_active)
      VALUES ('global', pair[1], v_asset_id, TRUE);
    END IF;
  END LOOP;
END $$;
