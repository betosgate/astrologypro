-- Mundane entities (countries, cities, leaders, institutions, markets)
CREATE TABLE IF NOT EXISTS mundane_entities_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('country','city','leader','institution','market','commodity','event_entity')),
  also_known_as TEXT[],
  description TEXT,

  -- Birth/foundation data
  birth_date DATE,
  birth_time TIME,
  birth_datetime_utc TIMESTAMPTZ,
  birth_location TEXT,
  birth_lat NUMERIC(9,6),
  birth_lon NUMERIC(9,6),
  birth_timezone TEXT,
  birth_data_source TEXT,        -- citation/reference
  birth_data_confidence TEXT CHECK (birth_data_confidence IN ('AA','A','B','C','X')),

  -- Chart data (cached JSON from astrology calculation API)
  natal_chart_data JSONB,
  chart_calculated_at TIMESTAMPTZ,

  -- Classification
  country_code TEXT,             -- ISO 3166 for countries
  region TEXT,
  tags TEXT[] DEFAULT '{}',

  owner_user_id UUID,            -- researcher who created this
  is_public BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mundane_entities_v2_type ON mundane_entities_v2(entity_type, is_active);
CREATE INDEX IF NOT EXISTS idx_mundane_entities_v2_name ON mundane_entities_v2 USING gin(to_tsvector('english', name));

-- Mundane events (historical and forecast)
CREATE TABLE IF NOT EXISTS mundane_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('historical','forecast','ingress','eclipse','return','transit_hit','election','conflict','economic','weather','other')),
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_datetime_utc TIMESTAMPTZ,
  location TEXT,
  lat NUMERIC(9,6),
  lon NUMERIC(9,6),

  -- Linked entities
  primary_entity_id UUID REFERENCES mundane_entities(id),
  secondary_entity_ids UUID[] DEFAULT '{}',

  -- Astrological context
  astrological_factors JSONB,   -- relevant transits, aspects, ingresses at event time

  -- Forecast vs historical
  is_forecast BOOLEAN DEFAULT FALSE,
  forecast_confidence TEXT CHECK (forecast_confidence IN ('high','medium','low','speculative')),
  outcome_verified BOOLEAN,     -- for past forecasts: was the prediction correct?
  outcome_notes TEXT,

  -- Metadata
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mundane_events_date ON mundane_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_mundane_events_entity ON mundane_events(primary_entity_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_mundane_events_type ON mundane_events(event_type, event_date DESC);

-- Mundane research notes / interpretations
CREATE TABLE IF NOT EXISTS mundane_research_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES mundane_entities(id),
  event_id UUID REFERENCES mundane_events(id),
  title TEXT,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION mundane_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_mundane_entities_v2_upd ON mundane_entities_v2;
CREATE TRIGGER trg_mundane_entities_v2_upd BEFORE UPDATE ON mundane_entities_v2 FOR EACH ROW EXECUTE FUNCTION mundane_updated_at();
DROP TRIGGER IF EXISTS trg_mundane_events_upd ON mundane_events;
CREATE TRIGGER trg_mundane_events_upd BEFORE UPDATE ON mundane_events FOR EACH ROW EXECUTE FUNCTION mundane_updated_at();
DROP TRIGGER IF EXISTS trg_mundane_research_notes_upd ON mundane_research_notes;
CREATE TRIGGER trg_mundane_research_notes_upd BEFORE UPDATE ON mundane_research_notes FOR EACH ROW EXECUTE FUNCTION mundane_updated_at();

-- RLS
ALTER TABLE mundane_entities_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_research_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_entities_v2' AND policyname='mundane_entities_v2_public_read') THEN
    CREATE POLICY mundane_entities_v2_public_read ON mundane_entities_v2 FOR SELECT USING (is_public = true OR owner_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_entities_v2' AND policyname='mundane_entities_v2_service_role') THEN
    CREATE POLICY mundane_entities_v2_service_role ON mundane_entities_v2 FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_events' AND policyname='mundane_events_public_read') THEN
    CREATE POLICY mundane_events_public_read ON mundane_events FOR SELECT USING (is_public = true OR created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_events' AND policyname='mundane_events_service_role') THEN
    CREATE POLICY mundane_events_service_role ON mundane_events FOR ALL TO service_role USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_research_notes' AND policyname='mundane_research_notes_public_read') THEN
    CREATE POLICY mundane_research_notes_public_read ON mundane_research_notes FOR SELECT USING (is_public = true OR created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_research_notes' AND policyname='mundane_research_notes_service_role') THEN
    CREATE POLICY mundane_research_notes_service_role ON mundane_research_notes FOR ALL TO service_role USING (true);
  END IF;
END $$;
