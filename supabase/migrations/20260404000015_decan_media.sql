-- Decan Videos and PDFs (audio/video/PDF resources per sign+decan)
CREATE TABLE IF NOT EXISTS decan_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign        text NOT NULL,
  decan       integer NOT NULL CHECK (decan IN (1, 2, 3)),
  title       text NOT NULL,
  video_url   text,
  pdf_url     text,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE decan_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_decan_media" ON decan_media FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_decan_media" ON decan_media FOR SELECT TO anon, authenticated USING (is_active = true);
