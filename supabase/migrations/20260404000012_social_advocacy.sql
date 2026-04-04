-- Social Advocacy content (admin-managed, optionally auto-posted via Ayrshare)
CREATE TABLE IF NOT EXISTS social_advocacy (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  frequency   text DEFAULT 'Weekly',  -- Daily, Weekly, Monthly, Custom
  link        text,
  image_url   text,
  audio_url   text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_advocacy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_social_advocacy" ON social_advocacy FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_social_advocacy" ON social_advocacy FOR SELECT TO anon, authenticated USING (is_active = true);
