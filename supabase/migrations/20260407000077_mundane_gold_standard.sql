-- Leader/person registry (separate from entities)
CREATE TABLE IF NOT EXISTS mundane_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  office_title TEXT,
  country_entity_id UUID REFERENCES mundane_entities_v2(id),
  office_start_date DATE,
  office_end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,

  -- Birth data
  birth_date DATE,
  birth_time TIME,
  birth_location TEXT,
  birth_lat NUMERIC(9,6),
  birth_lon NUMERIC(9,6),
  birth_timezone TEXT,
  birth_data_source TEXT,
  birth_data_confidence TEXT CHECK (birth_data_confidence IN ('AA','A','B','C','X')),

  -- Chart data
  natal_chart_data JSONB,
  chart_calculated_at TIMESTAMPTZ,

  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ml_country ON mundane_leaders(country_entity_id, is_current);
CREATE INDEX IF NOT EXISTS idx_ml_name ON mundane_leaders USING gin(to_tsvector('english', full_name));

-- Forecast journal enhancements (mundane_forecasts already exists from migration 031)
-- Add gold-standard columns additively
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES mundane_leaders(id);
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS astrology_basis TEXT;
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS narrative_summary TEXT;
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS event_categories TEXT[] DEFAULT '{}';
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS confidence_level TEXT CHECK (confidence_level IN ('high','medium','low','speculative'));
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS outcome_status TEXT NOT NULL DEFAULT 'open' CHECK (outcome_status IN ('open','confirmed','partially_confirmed','invalidated','expired'));
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS outcome_notes TEXT;
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS outcome_reviewed_at TIMESTAMPTZ;
ALTER TABLE mundane_forecasts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
-- forecast_period_start / forecast_period_end already exist; alias via index
CREATE INDEX IF NOT EXISTS idx_mf_entity ON mundane_forecasts(entity_id, forecast_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_mf_status ON mundane_forecasts(outcome_status, forecast_period_start DESC);

-- Watchlists
CREATE TABLE IF NOT EXISTS mundane_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  entity_ids UUID[] DEFAULT '{}',
  leader_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Research projects
CREATE TABLE IF NOT EXISTS mundane_research_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'general' CHECK (project_type IN ('country_forecast','election','geopolitical','commodity','weather','retrospective','general')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','completed')),
  entity_ids UUID[] DEFAULT '{}',
  leader_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mrp_user ON mundane_research_projects(created_by, status);

-- Research project notes (rich notes within a project)
CREATE TABLE IF NOT EXISTS mundane_project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES mundane_research_projects(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general','hypothesis','observation','conclusion','reference')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mpn_project ON mundane_project_notes(project_id, created_at DESC);

-- Astronomical events calendar (ingresses, lunations, eclipses, etc.)
CREATE TABLE IF NOT EXISTS mundane_astro_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ingress','lunation','eclipse','conjunction','opposition','station','retrograde','direct','great_conjunction','return','solar_arc','custom')),
  planet_primary TEXT,        -- e.g. 'Sun', 'Jupiter'
  planet_secondary TEXT,      -- for aspects/conjunctions
  sign TEXT,                  -- zodiac sign for ingress
  event_datetime_utc TIMESTAMPTZ NOT NULL,
  timezone_display TEXT DEFAULT 'UTC',
  notes TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mae_datetime ON mundane_astro_events(event_datetime_utc DESC);
CREATE INDEX IF NOT EXISTS idx_mae_type ON mundane_astro_events(event_type, event_datetime_utc DESC);

-- RLS
ALTER TABLE mundane_leaders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_leaders' AND policyname='ml_readable') THEN
    CREATE POLICY "ml_readable" ON mundane_leaders FOR SELECT USING (is_public = TRUE OR auth.uid() IS NOT NULL);
  END IF;
END $$;
ALTER TABLE mundane_forecasts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_forecasts' AND policyname='mf_readable') THEN
    CREATE POLICY "mf_readable" ON mundane_forecasts FOR SELECT USING (is_public = TRUE OR auth.uid() IS NOT NULL);
  END IF;
END $$;
ALTER TABLE mundane_watchlists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_watchlists' AND policyname='own_watchlist') THEN
    CREATE POLICY "own_watchlist" ON mundane_watchlists FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;
ALTER TABLE mundane_research_projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_research_projects' AND policyname='mrp_access') THEN
    CREATE POLICY "mrp_access" ON mundane_research_projects FOR ALL USING (created_by = auth.uid() OR is_public = TRUE);
  END IF;
END $$;
ALTER TABLE mundane_project_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_project_notes' AND policyname='mpn_access') THEN
    CREATE POLICY "mpn_access" ON mundane_project_notes FOR ALL USING (created_by = auth.uid());
  END IF;
END $$;
ALTER TABLE mundane_astro_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='mundane_astro_events' AND policyname='mae_readable') THEN
    CREATE POLICY "mae_readable" ON mundane_astro_events FOR SELECT USING (TRUE);
  END IF;
END $$;

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_mundane_gold_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_ml_updated_at ON mundane_leaders;
CREATE TRIGGER trg_ml_updated_at BEFORE UPDATE ON mundane_leaders FOR EACH ROW EXECUTE FUNCTION update_mundane_gold_updated_at();
DROP TRIGGER IF EXISTS trg_mf_updated_at ON mundane_forecasts;
CREATE TRIGGER trg_mf_updated_at BEFORE UPDATE ON mundane_forecasts FOR EACH ROW EXECUTE FUNCTION update_mundane_gold_updated_at();
DROP TRIGGER IF EXISTS trg_mrp_updated_at ON mundane_research_projects;
CREATE TRIGGER trg_mrp_updated_at BEFORE UPDATE ON mundane_research_projects FOR EACH ROW EXECUTE FUNCTION update_mundane_gold_updated_at();
