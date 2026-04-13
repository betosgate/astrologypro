-- Add SEO-specific fields to the diviners table.
-- These fields back metadata composition, structured data, and local/global SEO claims.
-- Additive only — no existing columns removed or modified.

-- ── Geography and service-area ─────────────────────────────────────────────
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS seo_city            VARCHAR(120),
  ADD COLUMN IF NOT EXISTS seo_region          VARCHAR(120),
  ADD COLUMN IF NOT EXISTS seo_country         VARCHAR(120),
  ADD COLUMN IF NOT EXISTS seo_country_code    CHAR(2),
  ADD COLUMN IF NOT EXISTS seo_service_area_mode VARCHAR(30)
    CHECK (seo_service_area_mode IN ('local', 'multi_region', 'remote_global')),
  ADD COLUMN IF NOT EXISTS seo_service_areas   TEXT[],
  ADD COLUMN IF NOT EXISTS seo_is_remote_global BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Authority and identity ─────────────────────────────────────────────────
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS seo_languages       TEXT[],
  ADD COLUMN IF NOT EXISTS seo_credentials     TEXT[],
  ADD COLUMN IF NOT EXISTS seo_awards          TEXT[],
  ADD COLUMN IF NOT EXISTS seo_years_experience SMALLINT,
  ADD COLUMN IF NOT EXISTS seo_same_as_urls    TEXT[],
  ADD COLUMN IF NOT EXISTS seo_press_mentions  TEXT[];

-- ── Metadata overrides ─────────────────────────────────────────────────────
-- Title: max 70 chars; description: max 160 chars (enforced at app layer too)
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS seo_title_override       VARCHAR(70),
  ADD COLUMN IF NOT EXISTS seo_description_override VARCHAR(160),
  ADD COLUMN IF NOT EXISTS seo_h1_override          VARCHAR(120),
  ADD COLUMN IF NOT EXISTS seo_primary_keyword      VARCHAR(80),
  ADD COLUMN IF NOT EXISTS seo_secondary_keywords   TEXT[],
  ADD COLUMN IF NOT EXISTS seo_og_image_url         TEXT;

-- ── Review/social proof controls ──────────────────────────────────────────
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS seo_show_aggregate_rating BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS seo_show_testimonials_in_schema BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Validation constraints ─────────────────────────────────────────────────
-- City requires country (local claims must be complete)
ALTER TABLE diviners
  ADD CONSTRAINT chk_seo_city_requires_country
    CHECK (seo_city IS NULL OR seo_country IS NOT NULL);

-- service_area_mode = 'local' requires city
ALTER TABLE diviners
  ADD CONSTRAINT chk_seo_local_mode_requires_city
    CHECK (seo_service_area_mode IS NULL
      OR seo_service_area_mode != 'local'
      OR seo_city IS NOT NULL);
