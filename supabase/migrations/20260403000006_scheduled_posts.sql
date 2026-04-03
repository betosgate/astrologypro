-- scheduled_posts: records of social media posts created or scheduled by diviners
-- Used by POST /api/social/post (currently a stub; Ayrshare integration pending)

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id      UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  content_id      UUID,                          -- optional ref to marketing_content
  platforms       TEXT[] NOT NULL DEFAULT '{}',  -- e.g. ['instagram', 'twitter']
  caption         TEXT,
  image_url       TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'scheduled', 'published', 'failed')),
  ayrshare_post_id TEXT,                         -- populated after Ayrshare API call
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scheduled_posts_diviner_id_idx ON scheduled_posts(diviner_id);
CREATE INDEX IF NOT EXISTS scheduled_posts_status_idx     ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS scheduled_posts_scheduled_at_idx ON scheduled_posts(scheduled_at);

-- RLS: diviners can only see/manage their own posts
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diviners manage own scheduled posts"
  ON scheduled_posts
  FOR ALL
  USING (
    diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  );
