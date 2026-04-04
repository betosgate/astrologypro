-- Spiritual Wisdom content (text/document + YouTube)
CREATE TABLE IF NOT EXISTS spiritual_wisdom (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  descriptive_title text,
  content          text,          -- rich text/HTML for text type
  image_url        text,
  youtube_url      text,
  type             text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'youtube')),
  priority         integer NOT NULL DEFAULT 0,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE spiritual_wisdom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_spiritual_wisdom" ON spiritual_wisdom FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_spiritual_wisdom" ON spiritual_wisdom FOR SELECT TO anon, authenticated USING (is_active = true);
