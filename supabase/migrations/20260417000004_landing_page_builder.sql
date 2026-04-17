-- ═══════════════════════════════════════════════════════════════════
-- Migration: 20260417000004_landing_page_builder
-- Creates the modular landing page builder tables + seeds section types
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- Table: section_type_config (admin-managed registry)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE section_type_config (
  type                    VARCHAR(50) PRIMARY KEY,
  label                   VARCHAR(100) NOT NULL,
  description             TEXT,
  icon                    VARCHAR(50),
  category                VARCHAR(20) NOT NULL
    CHECK (category IN ('content', 'media', 'engagement', 'navigation')),
  is_system               BOOLEAN NOT NULL DEFAULT FALSE,
  is_globally_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  max_per_page            INTEGER NOT NULL DEFAULT 0,             -- 0 = unlimited
  max_body_length         INTEGER DEFAULT 10000,                   -- chars
  max_image_size_bytes    INTEGER DEFAULT 2097152,                 -- 2 MB
  max_images_per_section  INTEGER DEFAULT 20,
  allowed_image_types     TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowed_video_sources   TEXT[] DEFAULT ARRAY['youtube', 'vimeo', 'upload'],
  sort_order              INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed section types (matches the TypeScript SECTION_TYPES registry)
INSERT INTO section_type_config
  (type, label, description, icon, category, is_system, max_per_page, sort_order)
VALUES
  ('hero',           'Hero Section',         'Main banner with service title and image',     'LayoutTemplate',    'content',    TRUE,  1, 10),
  ('pricing',        'Pricing & Booking',    'Service price, duration, and booking button',  'DollarSign',        'engagement', TRUE,  1, 20),
  ('booking_cta',    'Booking CTA',          'Sticky/bottom call-to-action for booking',     'CalendarCheck',     'engagement', TRUE,  1, 30),
  ('bio',            'Bio / Introduction',   'Personal introduction with photo',             'User',              'content',    FALSE, 1, 100),
  ('expertise',      'Expertise',            'Skills, specialties, and credentials',         'Award',             'content',    FALSE, 1, 110),
  ('text_content',   'Text Content',         'Free-form rich text section',                  'FileText',          'content',    FALSE, 5, 120),
  ('image_banner',   'Image / Banner',       'Single image or banner with caption',          'Image',             'media',      FALSE, 3, 130),
  ('cta',            'Call-to-Action',       'Highlighted CTA with heading and button',      'MousePointerClick', 'engagement', FALSE, 3, 140),
  ('faq',            'FAQ Accordion',        'Expandable FAQ list',                          'HelpCircle',        'content',    FALSE, 1, 150),
  ('video_embed',    'Video Embed',          'YouTube, Vimeo, or uploaded video',            'Video',             'media',      FALSE, 3, 160),
  ('testimonials',   'Testimonials',         'Client reviews and testimonials',              'Quote',             'engagement', FALSE, 1, 170),
  ('gallery',        'Image Gallery',        'Grid or carousel of images',                   'LayoutGrid',        'media',      FALSE, 2, 180),
  ('rich_content',   'Rich Content',         'Advanced mixed content with layout options',   'Newspaper',         'content',    FALSE, 3, 190),
  ('whats_included', 'What''s Included',     'Checklist of service inclusions',             'CheckSquare',       'content',    FALSE, 1, 200),
  ('who_its_for',    'Who This Is For',      'Target audience description',                  'Users',             'content',    FALSE, 1, 210);

-- ═══════════════════════════════════════════════════════════════════
-- Table: service_landing_pages (one per diviner per service template)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE service_landing_pages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id              UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  service_template_id     UUID NOT NULL REFERENCES service_templates(id) ON DELETE CASCADE,

  -- Page-level metadata
  slug                    VARCHAR(100),
  custom_page_title       VARCHAR(120),
  custom_seo_title        VARCHAR(70),
  custom_seo_description  VARCHAR(160),
  custom_og_image_url     TEXT,

  -- Branding
  accent_color            VARCHAR(7),
  font_style              VARCHAR(30),

  -- Status
  status                  VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'preview', 'published', 'unpublished', 'archived')),
  published_at            TIMESTAMPTZ,
  unpublished_at          TIMESTAMPTZ,

  -- Versioning
  draft_version           INTEGER NOT NULL DEFAULT 1,
  published_version       INTEGER DEFAULT NULL,

  -- Admin moderation
  moderation_status       VARCHAR(20) DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending_review', 'flagged', 'rejected')),
  moderation_note         TEXT,
  moderated_by            UUID REFERENCES auth.users(id),
  moderated_at            TIMESTAMPTZ,

  -- Audit
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID REFERENCES auth.users(id),
  updated_by              UUID REFERENCES auth.users(id),

  UNIQUE(diviner_id, service_template_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- Table: service_landing_page_sections (individual content blocks)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE service_landing_page_sections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id         UUID NOT NULL REFERENCES service_landing_pages(id) ON DELETE CASCADE,
  diviner_id              UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,

  -- Section identity
  section_type            VARCHAR(50) NOT NULL REFERENCES section_type_config(type),
  instance_key            VARCHAR(100),   -- differentiates multi-instance types (text_content_1, text_content_2)

  -- Content
  title                   VARCHAR(200),
  subtitle                VARCHAR(300),
  content_json            JSONB NOT NULL DEFAULT '{}',
  body_html               TEXT,

  -- Media
  primary_image_url       TEXT,
  images                  JSONB DEFAULT '[]',

  -- Display
  display_order           INTEGER NOT NULL DEFAULT 0,
  is_enabled              BOOLEAN NOT NULL DEFAULT TRUE,

  -- State
  is_system               BOOLEAN NOT NULL DEFAULT FALSE,
  is_draft                BOOLEAN NOT NULL DEFAULT TRUE,
  draft_content_json      JSONB,
  draft_body_html         TEXT,
  published_content_json  JSONB,
  published_body_html     TEXT,

  -- Admin moderation
  moderation_status       VARCHAR(20) DEFAULT 'approved'
    CHECK (moderation_status IN ('approved', 'pending_review', 'flagged', 'rejected')),
  moderation_note         TEXT,

  -- Audit
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID REFERENCES auth.users(id),
  updated_by              UUID REFERENCES auth.users(id)
);

-- Unique index: only one instance of each SYSTEM section per page
-- Custom sections differentiate via instance_key at the API layer
CREATE UNIQUE INDEX idx_system_section_unique
  ON service_landing_page_sections(landing_page_id, section_type)
  WHERE is_system = TRUE;

-- ═══════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════

-- All enabled sections for a page, ordered
CREATE INDEX idx_sections_page_order
  ON service_landing_page_sections(landing_page_id, display_order)
  WHERE is_enabled = TRUE;

-- Landing page lookup by diviner + template
CREATE INDEX idx_landing_page_diviner_template
  ON service_landing_pages(diviner_id, service_template_id);

-- All landing pages for a diviner
CREATE INDEX idx_landing_page_diviner
  ON service_landing_pages(diviner_id, status);

-- Moderation queues
CREATE INDEX idx_sections_moderation
  ON service_landing_page_sections(moderation_status, updated_at DESC)
  WHERE moderation_status <> 'approved';

CREATE INDEX idx_landing_page_moderation
  ON service_landing_pages(moderation_status, updated_at DESC)
  WHERE moderation_status <> 'approved';

-- ═══════════════════════════════════════════════════════════════════
-- Triggers (reuse existing updated_at function)
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_landing_page_updated
  BEFORE UPDATE ON service_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

CREATE TRIGGER trg_section_updated
  BEFORE UPDATE ON service_landing_page_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

CREATE TRIGGER trg_section_type_config_updated
  BEFORE UPDATE ON section_type_config
  FOR EACH ROW
  EXECUTE FUNCTION update_diviner_services_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE section_type_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_landing_page_sections ENABLE ROW LEVEL SECURITY;

-- section_type_config: anyone can read, admin can write
CREATE POLICY stc_read ON section_type_config FOR SELECT USING (TRUE);
CREATE POLICY stc_admin ON section_type_config FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- service_landing_pages: diviner owns their own pages
CREATE POLICY slp_diviner ON service_landing_pages FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

-- admin can manage all landing pages
CREATE POLICY slp_admin ON service_landing_pages FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- public can read published + approved pages
CREATE POLICY slp_public_read ON service_landing_pages FOR SELECT
  USING (status = 'published' AND moderation_status = 'approved');

-- service_landing_page_sections: diviner owns their sections
CREATE POLICY slps_diviner ON service_landing_page_sections FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

-- admin can manage all sections
CREATE POLICY slps_admin ON service_landing_page_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- public can read enabled + approved sections on published pages
CREATE POLICY slps_public_read ON service_landing_page_sections FOR SELECT
  USING (
    is_enabled = TRUE
    AND moderation_status = 'approved'
    AND EXISTS (
      SELECT 1 FROM service_landing_pages slp
      WHERE slp.id = service_landing_page_sections.landing_page_id
        AND slp.status = 'published'
        AND slp.moderation_status = 'approved'
    )
  );
