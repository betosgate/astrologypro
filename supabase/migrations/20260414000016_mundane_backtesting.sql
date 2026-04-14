CREATE TABLE IF NOT EXISTS mundane_backtest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  hypothesis TEXT NOT NULL,
  entity_ids UUID[] DEFAULT '{}',
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  event_types TEXT[] DEFAULT '{}',
  scoring_model_id UUID REFERENCES scoring_models(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  results JSONB,
  accuracy_score DECIMAL(5,2),
  total_forecasts_tested INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backtest_runs_created_at ON mundane_backtest_runs(created_at DESC, id DESC);
ALTER TABLE mundane_backtest_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt_admin" ON mundane_backtest_runs FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "bt_service_role" ON mundane_backtest_runs FOR ALL TO service_role USING (true);
