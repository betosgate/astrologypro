-- Broadcasting / notifications table
CREATE TABLE IF NOT EXISTS broadcasting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE broadcasting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access broadcasting"
  ON broadcasting FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX broadcasting_status_idx ON broadcasting(status);
CREATE INDEX broadcasting_updated_at_idx ON broadcasting(updated_at);
