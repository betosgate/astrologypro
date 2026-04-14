CREATE TABLE IF NOT EXISTS forecast_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES mundane_forecasts(id) ON DELETE CASCADE,
  chart_calc_id UUID,
  astro_event_id UUID REFERENCES mundane_astro_events(id) ON DELETE SET NULL,
  entity_id UUID REFERENCES mundane_entities(id) ON DELETE SET NULL,
  evidence_type VARCHAR(30) NOT NULL DEFAULT 'note' CHECK (evidence_type IN ('chart', 'transit', 'eclipse', 'ingress', 'note', 'other')),
  note TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forecast_evidence_forecast ON forecast_evidence(forecast_id);
ALTER TABLE forecast_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fe_admin" ON forecast_evidence FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "fe_service_role" ON forecast_evidence FOR ALL TO service_role USING (true);
