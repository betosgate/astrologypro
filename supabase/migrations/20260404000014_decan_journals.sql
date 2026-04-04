-- General Content / Decan Journals (sign + decan level content entries)
CREATE TABLE IF NOT EXISTS decan_journals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign        text NOT NULL,
  decan       integer NOT NULL CHECK (decan IN (1, 2, 3)),
  title       text NOT NULL,
  description text,
  content     text,   -- rich text/HTML
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE decan_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_decan_journals" ON decan_journals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_decan_journals" ON decan_journals FOR SELECT TO anon, authenticated USING (is_active = true);
