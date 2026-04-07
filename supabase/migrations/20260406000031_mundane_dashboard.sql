-- Country/Entity registry for mundane astrology analysis
CREATE TABLE IF NOT EXISTS mundane_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('country','city','institution','market','commodity','organization','other')),
  region text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  timezone text,
  flag_emoji text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mundane chart records linked to entities (can have multiple per entity)
CREATE TABLE IF NOT EXISTS mundane_entity_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES mundane_entities(id) ON DELETE CASCADE,
  chart_title text NOT NULL,
  chart_type text NOT NULL CHECK (chart_type IN ('independence','constitution','ingress','lunation','eclipse','transit','event','other')),
  event_date date NOT NULL,
  event_time time,
  timezone text,
  latitude numeric(10,6),
  longitude numeric(10,6),
  notes text,
  chart_url text,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Mundane forecasts/observations
CREATE TABLE IF NOT EXISTS mundane_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  entity_id uuid REFERENCES mundane_entities(id),
  forecast_type text NOT NULL CHECK (forecast_type IN ('political','economic','weather','social','market','general')),
  forecast_period_start date NOT NULL,
  forecast_period_end date NOT NULL,
  content text NOT NULL,
  signal_strength text CHECK (signal_strength IN ('low','medium','high','critical')),
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON mundane_entities(entity_type, is_active);
CREATE INDEX ON mundane_entity_charts(entity_id, event_date DESC);
CREATE INDEX ON mundane_forecasts(forecast_period_start, forecast_period_end);
CREATE INDEX ON mundane_forecasts(entity_id, is_published);

ALTER TABLE mundane_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_entity_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_forecasts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read; service_role has full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_entities'
      AND policyname = 'auth_read_entities'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "auth_read_entities" ON mundane_entities FOR SELECT TO authenticated USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_entities'
      AND policyname = 'service_role_entities'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_entities" ON mundane_entities FOR ALL TO service_role USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_entity_charts'
      AND policyname = 'auth_read_entity_charts'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "auth_read_entity_charts" ON mundane_entity_charts FOR SELECT TO authenticated USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_entity_charts'
      AND policyname = 'service_role_entity_charts'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_entity_charts" ON mundane_entity_charts FOR ALL TO service_role USING (true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_forecasts'
      AND policyname = 'auth_read_forecasts'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "auth_read_forecasts" ON mundane_forecasts FOR SELECT TO authenticated USING (is_published = true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'mundane_forecasts'
      AND policyname = 'service_role_forecasts'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "service_role_forecasts" ON mundane_forecasts FOR ALL TO service_role USING (true)
    $p$;
  END IF;
END $$;
