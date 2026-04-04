-- Add Stripe billing columns to community_members for subscription tracking
ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_type              TEXT DEFAULT 'individual'
    CHECK (plan_type IN ('individual', 'family'));

CREATE INDEX IF NOT EXISTS community_members_stripe_sub_idx
  ON community_members (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Calendar of events table (admin-managed)
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  category        TEXT,
  start_at        TIMESTAMPTZ NOT NULL,
  end_at          TIMESTAMPTZ NOT NULL,
  display_for     TEXT        NOT NULL DEFAULT 'public'
    CHECK (display_for IN ('public', 'members', 'students', 'members_and_guests')),
  priority        INTEGER     NOT NULL DEFAULT 0,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_calendar_events" ON calendar_events
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_role_write_calendar_events" ON calendar_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Perennial Mandalism content (admin-managed, consumed in community portal)
CREATE TABLE IF NOT EXISTS mandalism_content (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    TEXT        NOT NULL
    CHECK (content_type IN ('live_stream', 'video', 'document', 'youtube', 'announcement')),
  title           TEXT        NOT NULL,
  description     TEXT,
  url             TEXT,       -- stream URL / video URL / YouTube URL
  pdf_url         TEXT,       -- for documents
  content_body    TEXT,       -- for announcements
  start_at        TIMESTAMPTZ,  -- for live streams
  end_at          TIMESTAMPTZ,
  access_control  TEXT        NOT NULL DEFAULT 'members'
    CHECK (access_control IN ('free', 'members')),
  priority        INTEGER     NOT NULL DEFAULT 0,
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mandalism_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_mandalism" ON mandalism_content
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "public_read_free_mandalism" ON mandalism_content
  FOR SELECT TO anon USING (is_published = true AND access_control = 'free');
CREATE POLICY "service_role_write_mandalism" ON mandalism_content
  FOR ALL TO service_role USING (true) WITH CHECK (true);
