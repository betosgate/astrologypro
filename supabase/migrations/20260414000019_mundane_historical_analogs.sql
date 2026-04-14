CREATE TABLE IF NOT EXISTS mundane_historical_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(200) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dominant_aspects TEXT[] DEFAULT '{}',
  dominant_planets TEXT[] DEFAULT '{}',
  notes TEXT,
  outcome_description TEXT,
  tags TEXT[] DEFAULT '{}',
  similarity_vectors JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mundane_analog_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_date DATE NOT NULL,
  historical_period_id UUID NOT NULL REFERENCES mundane_historical_periods(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  matching_factors JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_historical_periods_start ON mundane_historical_periods(period_start, period_end);
CREATE INDEX idx_analog_matches_date ON mundane_analog_matches(reference_date DESC);
CREATE INDEX idx_analog_matches_score ON mundane_analog_matches(similarity_score DESC);

ALTER TABLE mundane_historical_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_analog_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hp_admin" ON mundane_historical_periods FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "hp_service_role" ON mundane_historical_periods FOR ALL TO service_role USING (true);
CREATE POLICY "am_admin" ON mundane_analog_matches FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "am_service_role" ON mundane_analog_matches FOR ALL TO service_role USING (true);

-- Seed 8 key historical periods
INSERT INTO mundane_historical_periods (id, label, period_start, period_end, dominant_aspects, dominant_planets, notes, outcome_description, tags)
VALUES
  ('hp100000-0000-0000-0000-000000000001',
   'Great Depression Era', '1929-10-01', '1933-12-31',
   ARRAY['Saturn conjunct Pluto', 'Uranus square Pluto'], ARRAY['Saturn','Pluto','Uranus'],
   'Massive economic collapse, social upheaval, rise of authoritarian governments.',
   'Economic collapse, mass unemployment, political extremism.',
   ARRAY['economic','collapse','saturn-pluto']),

  ('hp100000-0000-0000-0000-000000000002',
   'World War II Onset', '1939-09-01', '1942-12-31',
   ARRAY['Saturn conjunct Jupiter in Taurus', 'Uranus in Taurus'], ARRAY['Saturn','Jupiter','Uranus'],
   'Global war, massive geopolitical realignment.',
   'Military conflict, geopolitical collapse, mass displacement.',
   ARRAY['war','military','saturn-jupiter']),

  ('hp100000-0000-0000-0000-000000000003',
   'Cold War Nuclear Crisis', '1962-10-01', '1963-12-31',
   ARRAY['Saturn opposite Pluto', 'Mars conjunct Pluto'], ARRAY['Saturn','Pluto','Mars'],
   'Cuban Missile Crisis — closest the world came to nuclear war.',
   'Brinkmanship, arms race escalation, diplomatic resolution.',
   ARRAY['war','nuclear','saturn-pluto','geopolitics']),

  ('hp100000-0000-0000-0000-000000000004',
   'Oil Crisis & Stagflation', '1973-10-01', '1975-06-30',
   ARRAY['Uranus conjunct Pluto', 'Saturn square Neptune'], ARRAY['Uranus','Pluto','Saturn','Neptune'],
   'OPEC embargo, energy crisis, Vietnam War end.',
   'Energy scarcity, economic stagflation, political disillusionment.',
   ARRAY['economic','energy','oil','uranus-pluto']),

  ('hp100000-0000-0000-0000-000000000005',
   'Soviet Collapse Era', '1989-11-01', '1992-12-31',
   ARRAY['Saturn conjunct Neptune', 'Uranus conjunct Neptune'], ARRAY['Saturn','Neptune','Uranus'],
   'Berlin Wall falls, USSR dissolves, end of Cold War.',
   'Empire dissolution, rapid political transformation, democratization.',
   ARRAY['geopolitics','collapse','saturn-neptune']),

  ('hp100000-0000-0000-0000-000000000006',
   'Dot-Com Collapse', '2000-03-01', '2002-10-31',
   ARRAY['Saturn opposite Pluto', 'Jupiter conjunct Saturn'], ARRAY['Saturn','Pluto','Jupiter'],
   'Technology bubble burst, 9/11, Afghanistan War.',
   'Market collapse, security crisis, geopolitical war response.',
   ARRAY['economic','technology','war','saturn-pluto']),

  ('hp100000-0000-0000-0000-000000000007',
   'Global Financial Crisis', '2008-09-01', '2010-06-30',
   ARRAY['Saturn opposite Uranus', 'Pluto ingress Capricorn'], ARRAY['Saturn','Uranus','Pluto'],
   'Lehman collapse, banking system near failure, global recession.',
   'Financial system collapse, austerity, populist backlash.',
   ARRAY['economic','financial','saturn-uranus']),

  ('hp100000-0000-0000-0000-000000000008',
   'Pandemic Restructuring', '2020-01-01', '2022-12-31',
   ARRAY['Saturn conjunct Pluto in Capricorn', 'Jupiter conjunct Saturn in Aquarius'], ARRAY['Saturn','Pluto','Jupiter'],
   'COVID-19 pandemic, global lockdowns, supply chain collapse.',
   'Health crisis, institutional restructuring, digital acceleration.',
   ARRAY['pandemic','health','saturn-pluto','jupiter-saturn'])

ON CONFLICT (id) DO NOTHING;
