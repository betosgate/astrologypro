-- Ensure astrology API keys are seeded (idempotent)
-- Adds a unique constraint on access_key to support ON CONFLICT

-- Add unique constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'astrology_api_keys_access_key_key'
  ) THEN
    ALTER TABLE astrology_api_keys ADD CONSTRAINT astrology_api_keys_access_key_key UNIQUE (access_key);
  END IF;
END $$;

-- Upsert the 4 key pairs
INSERT INTO astrology_api_keys (label, access_key, secret_key, is_active) VALUES
  ('Key 1', '645549', '742ab7a3fa64cbd96f790cdd1597220239a6306e', true),
  ('Key 2', '645550', '0ff42a42f36ca0d37d68ac6575c5ad827698637b', true),
  ('Key 3', '645551', '697790fbb9bdde14c281f0bc980a68b57413110c', true),
  ('Key 4', '645552', '233ef6be8f96ef7dc158ecd9bbbdc85ff4d7f30b', true)
ON CONFLICT (access_key) DO UPDATE SET
  secret_key = EXCLUDED.secret_key,
  is_active = true,
  updated_at = now();
