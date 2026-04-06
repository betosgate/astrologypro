-- Migration 036: Blog V2 Schema
-- Adds supporting tables FIRST, then alters blog_posts to reference them.
-- 2026-04-06

-- ── 1. blog_authors (must exist before blog_posts ALTER) ─────────────────────
CREATE TABLE IF NOT EXISTS blog_authors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  bio         text,
  avatar_url  text,
  twitter_handle text,
  website_url text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 2. blog_categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  parent_id   uuid        REFERENCES blog_categories(id) ON DELETE SET NULL,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. blog_tags ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. blog_series (must exist before blog_posts ALTER) ──────────────────────
CREATE TABLE IF NOT EXISTS blog_series (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  slug            text        NOT NULL UNIQUE,
  description     text,
  cover_image_url text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Extend blog_posts ──────────────────────────────────────────────────────
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','scheduled','published','unpublished','archived')),
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES blog_authors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES blog_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_image_alt text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS reading_time_minutes integer,
  ADD COLUMN IF NOT EXISTS word_count integer,
  ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS unpublished_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Migrate is_published → status
UPDATE blog_posts SET status = 'published' WHERE is_published = true AND status = 'draft';

-- ── 6. blog_post_categories (pivot) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id     uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- ── 7. blog_post_tags (pivot) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ── 8. blog_post_revisions (audit trail) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id                 uuid        NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  changed_by              uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_content_blocks jsonb,
  previous_title          text,
  previous_status         text,
  change_summary          text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 9. blog_redirects ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_redirects (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_slug  text        NOT NULL UNIQUE,
  to_slug    text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 10. blog_cta_blocks ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_cta_blocks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  cta_label  text        NOT NULL,
  cta_url    text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS blog_posts_status_idx    ON blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_author_idx    ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS blog_posts_series_idx    ON blog_posts(series_id);
CREATE INDEX IF NOT EXISTS blog_posts_featured_idx  ON blog_posts(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS blog_posts_scheduled_idx ON blog_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS blog_posts_updated_at_id ON blog_posts(updated_at DESC, id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

-- blog_posts: drop old policies, add new ones
DROP POLICY IF EXISTS "public reads published posts" ON blog_posts;
DROP POLICY IF EXISTS "service role full access blog" ON blog_posts;

CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "blog_posts_service_role_all"
  ON blog_posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_categories
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_categories_public_read"
  ON blog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "blog_categories_service_role_all"
  ON blog_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_tags
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_tags_public_read"
  ON blog_tags FOR SELECT
  USING (true);

CREATE POLICY "blog_tags_service_role_all"
  ON blog_tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_authors
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_authors_public_read"
  ON blog_authors FOR SELECT
  USING (is_active = true);

CREATE POLICY "blog_authors_service_role_all"
  ON blog_authors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_series
ALTER TABLE blog_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_series_public_read"
  ON blog_series FOR SELECT
  USING (is_active = true);

CREATE POLICY "blog_series_service_role_all"
  ON blog_series FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_post_categories
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_post_categories_service_role_all"
  ON blog_post_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_post_tags
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_post_tags_service_role_all"
  ON blog_post_tags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_post_revisions
ALTER TABLE blog_post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_revisions_service_role_all"
  ON blog_post_revisions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_redirects
ALTER TABLE blog_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_redirects_public_read"
  ON blog_redirects FOR SELECT
  USING (is_active = true);

CREATE POLICY "blog_redirects_service_role_all"
  ON blog_redirects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- blog_cta_blocks
ALTER TABLE blog_cta_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_cta_service_role_all"
  ON blog_cta_blocks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
