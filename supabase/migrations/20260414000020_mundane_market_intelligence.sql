-- External data sources configuration
CREATE TABLE IF NOT EXISTS mundane_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('market','weather','agriculture','social','news','custom')),
  provider VARCHAR(50),
  api_url TEXT,
  api_key_env_var VARCHAR(100),
  fetch_interval_hours INTEGER DEFAULT 24,
  last_fetched_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External data points for correlation
CREATE TABLE IF NOT EXISTS mundane_external_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES mundane_data_sources(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL,
  symbol VARCHAR(50),
  entity_id UUID REFERENCES mundane_entities(id) ON DELETE SET NULL,
  recorded_at DATE NOT NULL,
  value DECIMAL(15,4),
  change_percent DECIMAL(8,4),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, data_type, symbol, recorded_at)
);

-- Astrological correlations (computed)
CREATE TABLE IF NOT EXISTS mundane_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID REFERENCES mundane_data_sources(id) ON DELETE CASCADE,
  astro_event_type VARCHAR(50) NOT NULL,
  planet VARCHAR(30),
  sign VARCHAR(30),
  correlation_coefficient DECIMAL(5,4),
  sample_count INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  significance_level DECIMAL(5,4),
  notes TEXT,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_data_date ON mundane_external_data(recorded_at DESC);
CREATE INDEX idx_external_data_source_type ON mundane_external_data(source_id, data_type, recorded_at DESC);
CREATE INDEX idx_correlations_astro ON mundane_correlations(astro_event_type, planet);

ALTER TABLE mundane_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_external_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mundane_correlations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ds_admin" ON mundane_data_sources FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "ds_service_role" ON mundane_data_sources FOR ALL TO service_role USING (true);
CREATE POLICY "ed_admin" ON mundane_external_data FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "ed_service_role" ON mundane_external_data FOR ALL TO service_role USING (true);
CREATE POLICY "mc_admin" ON mundane_correlations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mc_service_role" ON mundane_correlations FOR ALL TO service_role USING (true);

-- Seed: default data sources
INSERT INTO mundane_data_sources (id, name, source_type, provider, fetch_interval_hours, is_active, config)
VALUES
  ('ds100000-0000-0000-0000-000000000001', 'S&P 500 Index',       'market',      'Yahoo Finance',  24, TRUE, '{"symbol":"^GSPC","currency":"USD"}'),
  ('ds100000-0000-0000-0000-000000000002', 'Gold Spot Price',     'market',      'Yahoo Finance',  24, TRUE, '{"symbol":"GC=F","currency":"USD"}'),
  ('ds100000-0000-0000-0000-000000000003', 'Crude Oil (WTI)',     'market',      'Yahoo Finance',  24, TRUE, '{"symbol":"CL=F","currency":"USD"}'),
  ('ds100000-0000-0000-0000-000000000004', 'Bitcoin (BTC/USD)',   'market',      'CoinGecko',      12, TRUE, '{"symbol":"BTC","currency":"USD"}'),
  ('ds100000-0000-0000-0000-000000000005', 'US Drought Monitor',  'agriculture', 'USDA',           168, FALSE, '{"region":"continental_us"}'),
  ('ds100000-0000-0000-0000-000000000006', 'Global Wheat Prices', 'agriculture', 'FAO',            168, FALSE, '{"commodity":"wheat"}')
ON CONFLICT (id) DO NOTHING;

-- Seed: sample market data for S&P 500 (last 90 days, weekly)
INSERT INTO mundane_external_data (source_id, data_type, symbol, recorded_at, value, change_percent)
SELECT
  'ds100000-0000-0000-0000-000000000001',
  'index_close',
  'SPX',
  (CURRENT_DATE - (n * 7 || ' days')::INTERVAL)::DATE,
  4800 + (random() * 800 - 400),
  (random() * 6 - 3)
FROM generate_series(1, 13) AS n
ON CONFLICT DO NOTHING;

-- Seed: sample gold data
INSERT INTO mundane_external_data (source_id, data_type, symbol, recorded_at, value, change_percent)
SELECT
  'ds100000-0000-0000-0000-000000000002',
  'spot_close',
  'GOLD',
  (CURRENT_DATE - (n * 7 || ' days')::INTERVAL)::DATE,
  1900 + (random() * 400 - 200),
  (random() * 4 - 2)
FROM generate_series(1, 13) AS n
ON CONFLICT DO NOTHING;
