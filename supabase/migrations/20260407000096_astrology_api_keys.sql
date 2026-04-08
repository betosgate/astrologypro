-- Astrology API key management
-- Stores multiple API key pairs for json.astrologyapi.com
-- Enables round-robin / least-recently-used key rotation

CREATE TABLE IF NOT EXISTS astrology_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL DEFAULT 'Default',
  access_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requests_today INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE astrology_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "svc_astro_keys" ON astrology_api_keys FOR ALL TO service_role USING (true);

-- Seed the 4 keys
INSERT INTO astrology_api_keys (label, access_key, secret_key) VALUES
  ('Key 1', '645549', '742ab7a3fa64cbd96f790cdd1597220239a6306e'),
  ('Key 2', '645550', '0ff42a42f36ca0d37d68ac6575c5ad827698637b'),
  ('Key 3', '645551', '697790fbb9bdde14c281f0bc980a68b57413110c'),
  ('Key 4', '645552', '233ef6be8f96ef7dc158ecd9bbbdc85ff4d7f30b')
ON CONFLICT DO NOTHING;
