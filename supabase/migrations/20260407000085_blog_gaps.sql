-- Migration 085: Blog Gap-fill — taxonomy fields, related entities, audit logs, view_count
-- 2026-04-07

-- ── 1. view_count ─────────────────────────────────────────────────────────────
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- ── 2. Astrology taxonomy fields ──────────────────────────────────────────────
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS zodiac_signs TEXT[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS planets      TEXT[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS houses       TEXT[] DEFAULT '{}';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS difficulty_level TEXT
  CHECK (difficulty_level IN ('beginner','intermediate','advanced'));
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_intent TEXT
  CHECK (content_intent IN ('forecast','guide','education','opinion','promotion','news'));

-- ── 3. blog_post_related_entities ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_related_entities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID        NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  entity_type   TEXT        NOT NULL CHECK (entity_type IN ('course','product','service','training_program')),
  entity_id     UUID        NOT NULL,
  entity_title  TEXT        NOT NULL,
  entity_url    TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bpre_post ON blog_post_related_entities(post_id);

-- ── 4. blog_audit_logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  TEXT        NOT NULL DEFAULT 'blog_post',
  entity_id    UUID        NOT NULL,
  action       TEXT        NOT NULL,
  performed_by UUID        REFERENCES auth.users(id),
  before_json  JSONB,
  after_json   JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bal_entity ON blog_audit_logs(entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bal_actor  ON blog_audit_logs(performed_by, created_at DESC);

-- ── 5. FTS stored column (generated) ─────────────────────────────────────────
-- Add a generated tsvector column for efficient full-text search.
-- Uses STORED so it's precomputed and indexable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_posts' AND column_name = 'fts'
  ) THEN
    EXECUTE $q$
      ALTER TABLE blog_posts
        ADD COLUMN fts tsvector
          GENERATED ALWAYS AS (
            to_tsvector('english',
              coalesce(title, '') || ' ' ||
              coalesce(excerpt, '') || ' ' ||
              coalesce(seo_description, '')
            )
          ) STORED
    $q$;
  END IF;
END $$;

-- ── 6. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bp_views ON blog_posts(view_count DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_bp_fts   ON blog_posts USING gin(fts)   WHERE status = 'published';

-- ── 7. Helper function for atomic view_count increment ────────────────────────
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
$$;

-- ── 8. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE blog_post_related_entities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_post_related_entities' AND policyname = 'bpre_public_read'
  ) THEN
    CREATE POLICY "bpre_public_read"
      ON blog_post_related_entities FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_post_related_entities' AND policyname = 'bpre_service_role_all'
  ) THEN
    CREATE POLICY "bpre_service_role_all"
      ON blog_post_related_entities FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE blog_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_audit_logs' AND policyname = 'bal_admin_only'
  ) THEN
    CREATE POLICY "bal_admin_only"
      ON blog_audit_logs FOR ALL
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_audit_logs' AND policyname = 'bal_service_role_all'
  ) THEN
    CREATE POLICY "bal_service_role_all"
      ON blog_audit_logs FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
