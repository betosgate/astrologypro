-- blog_subscribers: email list for blog/newsletter signups
-- Used by POST /api/blog/subscribe (upsert on conflict)

CREATE TABLE IF NOT EXISTS blog_subscribers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  source        TEXT DEFAULT 'blog'   -- 'blog' | 'footer' | 'popup' etc.
);

CREATE INDEX IF NOT EXISTS blog_subscribers_email_idx ON blog_subscribers(email);

-- No RLS needed — only service role writes; reads are admin-only
