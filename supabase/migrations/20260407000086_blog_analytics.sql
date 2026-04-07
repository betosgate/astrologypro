-- Migration 086: Blog analytics tables + CTA block enhancements
-- 2026-04-07

-- ── 1. Extend blog_cta_blocks with type + linked_entity_id ───────────────────
ALTER TABLE blog_cta_blocks
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'generic'
    CHECK (type IN ('course', 'service', 'newsletter', 'generic')),
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid,
  ADD COLUMN IF NOT EXISTS text text;

-- Rename body → text (additive: keep body, add text alias)
-- We keep `body` for backward compat and add `text` as the new column

-- ── 2. Blog page views event log ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_post_views (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  session_id       TEXT,
  ip_hash          TEXT,
  user_agent_type  TEXT CHECK (user_agent_type IN ('mobile', 'desktop', 'bot')),
  country_code     TEXT,
  viewed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpv_post ON blog_post_views(post_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bpv_date ON blog_post_views(viewed_at DESC);

-- ── 3. CTA click tracking ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_cta_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  cta_block_id  UUID REFERENCES blog_cta_blocks(id) ON DELETE SET NULL,
  session_id    TEXT,
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bcc_block ON blog_cta_clicks(cta_block_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_bcc_post  ON blog_cta_clicks(post_id, clicked_at DESC);

-- ── 4. RLS: blog_post_views (public insert, auth read) ───────────────────────
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_post_views' AND policyname = 'bpv_insert'
  ) THEN
    CREATE POLICY "bpv_insert" ON blog_post_views FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_post_views' AND policyname = 'bpv_admin_read'
  ) THEN
    CREATE POLICY "bpv_admin_read" ON blog_post_views FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_post_views' AND policyname = 'bpv_service_role_all'
  ) THEN
    CREATE POLICY "bpv_service_role_all" ON blog_post_views FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── 5. RLS: blog_cta_clicks (public insert, auth read) ───────────────────────
ALTER TABLE blog_cta_clicks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_cta_clicks' AND policyname = 'bcc_insert'
  ) THEN
    CREATE POLICY "bcc_insert" ON blog_cta_clicks FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_cta_clicks' AND policyname = 'bcc_admin_read'
  ) THEN
    CREATE POLICY "bcc_admin_read" ON blog_cta_clicks FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'blog_cta_clicks' AND policyname = 'bcc_service_role_all'
  ) THEN
    CREATE POLICY "bcc_service_role_all" ON blog_cta_clicks FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
