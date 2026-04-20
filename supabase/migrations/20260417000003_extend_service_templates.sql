-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260417000003_extend_service_templates.sql
-- Feature A – Task 03: Extend service_templates for admin management
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add admin management columns to service_templates ─────────────────────

ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS display_order   INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_name       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS color           VARCHAR(7),
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS whats_included  TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS who_its_for     TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faq             JSONB        DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title       VARCHAR(70),
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(160),
  ADD COLUMN IF NOT EXISTS created_by      UUID         REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ  DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by      UUID         REFERENCES auth.users(id);

-- ── 2. Backfill display_order from sort_order (already exists on table) ───────

UPDATE service_templates
SET display_order = sort_order
WHERE display_order = 0 OR display_order IS NULL;

-- ── 3. Backfill icon_name and color from hardcoded defaults ───────────────────
-- These map the legacy icon/color fields from the hardcoded service-templates.ts

UPDATE service_templates SET icon_name = 'Sun',          color = '#f59e0b' WHERE slug = 'nativity-birth-chart';
UPDATE service_templates SET icon_name = 'Sunrise',      color = '#f97316' WHERE slug = 'solar-return';
UPDATE service_templates SET icon_name = 'CalendarDays', color = '#0ea5e9' WHERE slug = 'weekly-transits';
UPDATE service_templates SET icon_name = 'Moon',         color = '#6366f1' WHERE slug = 'monthly-transits-lunar-return';
UPDATE service_templates SET icon_name = 'Heart',        color = '#f43f5e' WHERE slug = 'romantic-relationships';
UPDATE service_templates SET icon_name = 'Users',        color = '#14b8a6' WHERE slug = 'friendship-relationships';
UPDATE service_templates SET icon_name = 'Briefcase',    color = '#10b981' WHERE slug = 'business-relationship';
UPDATE service_templates SET icon_name = 'Eye',          color = '#8b5cf6' WHERE slug = 'predictive-event-horary';
UPDATE service_templates SET icon_name = 'Zap',          color = '#f59e0b' WHERE slug = 'jupiter-return';
UPDATE service_templates SET icon_name = 'Circle',       color = '#6366f1' WHERE slug = 'saturn-return';
UPDATE service_templates SET icon_name = 'Flame',        color = '#f43f5e' WHERE slug = 'mars-return';
UPDATE service_templates SET icon_name = 'Bolt',         color = '#0ea5e9' WHERE slug = 'uranus-opposition';
UPDATE service_templates SET icon_name = 'Layers',       color = '#84cc16' WHERE slug = '3-card-basic-question-spread';
UPDATE service_templates SET icon_name = 'LayoutGrid',   color = '#10b981' WHERE slug = '5-card-complex-question-spread';
UPDATE service_templates SET icon_name = 'TrendingUp',   color = '#14b8a6' WHERE slug = '7-card-6-month-forward-review';
UPDATE service_templates SET icon_name = 'Anchor',       color = '#8b5cf6' WHERE slug = '7-card-horseshoe-spread-major-read';
UPDATE service_templates SET icon_name = 'HeartHandshake',color = '#f43f5e' WHERE slug = '10-card-relationship-spread';
UPDATE service_templates SET icon_name = 'Cross',        color = '#f97316' WHERE slug = '10-card-celtic-cross-major-read';
UPDATE service_templates SET icon_name = 'CircleDot',    color = '#6366f1' WHERE slug = '12-card-astrological-spread-major-read';

-- ── 4. updated_at trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_service_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_templates_updated_at ON service_templates;

CREATE TRIGGER trg_service_templates_updated_at
  BEFORE UPDATE ON service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_service_templates_updated_at();

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

-- Fast active-template listing (onboarding, public pages)
CREATE INDEX IF NOT EXISTS idx_service_templates_active
  ON service_templates(is_active, category, display_order)
  WHERE is_active = TRUE;

-- Unique slug enforcement (already exists as PK or unique constraint — add if missing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_templates_slug
  ON service_templates(slug);
