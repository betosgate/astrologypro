-- Ingress Charts
-- Ported from NestJS IngressChart MongoDB schema
CREATE TABLE IF NOT EXISTS ingress_charts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  ingress_type         text,
  importance           text DEFAULT 'High Impact',
  short_description    text,
  effective_time_period text,
  event_time_period    text,
  event_timestamp      timestamptz,
  validity_start       date,
  validity_end         date,
  location_name        text,
  location_lat         numeric,
  location_lon         numeric,
  location_timezone    text,
  -- nested objects stored as JSONB
  system_interpretation jsonb,   -- { title, shortDescription, htmlContent, chartRuler, primaryChallenge, primaryStrength }
  chart_data            jsonb,   -- { planets[], houses[], aspects[] }
  sector_analysis       jsonb,
  tags                 text[]   DEFAULT '{}',
  sector_focus         text[]   DEFAULT '{}',
  is_social_advo       boolean  DEFAULT false,
  is_published         boolean  DEFAULT false,
  author_name          text,
  author_email         text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE ingress_charts ENABLE ROW LEVEL SECURITY;

-- Community members can read published charts
CREATE POLICY "Community members read ingress charts"
  ON ingress_charts FOR SELECT
  USING (is_published = true);

-- Admins have full access (via service role)
CREATE POLICY "Service role full access ingress charts"
  ON ingress_charts FOR ALL
  USING (true);
