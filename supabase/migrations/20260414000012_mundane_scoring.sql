-- Scoring model definitions (admin-configured)
CREATE TABLE IF NOT EXISTS scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  weights JSONB NOT NULL DEFAULT '{
    "eclipse_hit": 1.5,
    "ingress_angular": 1.2,
    "leader_chart_hit": 1.0,
    "forecast_open": 0.8,
    "multiple_planets": 1.3
  }',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stress scores per entity per date
CREATE TABLE IF NOT EXISTS entity_stress_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES mundane_entities(id) ON DELETE CASCADE,
  scoring_model_id UUID NOT NULL REFERENCES scoring_models(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  stress_score DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (stress_score >= 0 AND stress_score <= 10),
  contributing_factors JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, scoring_model_id, score_date)
);

CREATE INDEX idx_stress_scores_entity_date ON entity_stress_scores(entity_id, score_date);
CREATE INDEX idx_stress_scores_date ON entity_stress_scores(score_date);

ALTER TABLE scoring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_stress_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_admin" ON scoring_models FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "sm_service_role" ON scoring_models FOR ALL TO service_role USING (true);
CREATE POLICY "ess_admin" ON entity_stress_scores FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "ess_service_role" ON entity_stress_scores FOR ALL TO service_role USING (true);

-- Seed one default scoring model
INSERT INTO scoring_models (id, name, description, version, is_active)
VALUES ('sm100000-0000-0000-0000-000000000001', 'Default Western Model', 'Standard western mundane scoring weights', '1.0', TRUE)
ON CONFLICT DO NOTHING;
