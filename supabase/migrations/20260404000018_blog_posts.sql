CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  excerpt     text,
  content     text,
  category    text        NOT NULL DEFAULT 'General',
  image_url   text,
  is_published boolean    NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Public can read published posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads published posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "service role full access blog"
  ON blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
