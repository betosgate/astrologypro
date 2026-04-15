-- pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search index on mundane_entities
ALTER TABLE mundane_entities
  ADD COLUMN IF NOT EXISTS fts_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(name, '') || ' ' ||
        coalesce(notes, '') || ' ' ||
        coalesce(type, '') || ' ' ||
        coalesce(region, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_mundane_entities_fts ON mundane_entities USING GIN(fts_vector);
CREATE INDEX IF NOT EXISTS idx_mundane_entities_trgm ON mundane_entities USING GIN(name gin_trgm_ops);

-- Full-text search on mundane_forecasts
ALTER TABLE mundane_forecasts
  ADD COLUMN IF NOT EXISTS fts_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(narrative_summary, '') || ' ' ||
        coalesce(astrological_basis, '')
      )
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_mundane_forecasts_fts ON mundane_forecasts USING GIN(fts_vector);

-- Saved searches table
CREATE TABLE IF NOT EXISTS mundane_saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  result_types TEXT[] DEFAULT ARRAY['entities', 'forecasts', 'events', 'leaders'],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON mundane_saved_searches(user_id, created_at DESC);

ALTER TABLE mundane_saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_owner" ON mundane_saved_searches
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "ss_service_role" ON mundane_saved_searches
  FOR ALL TO service_role USING (true);
