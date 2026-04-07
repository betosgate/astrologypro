-- Migration: reading history tracking
-- Creates astro_toolkit_readings and patches tarot_readings + birth_chart_results

-- ─── New table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS astro_toolkit_readings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diviner_id   uuid REFERENCES diviners(id) ON DELETE SET NULL,
  booking_id   uuid REFERENCES bookings(id) ON DELETE SET NULL,
  reading_type text NOT NULL CHECK (reading_type IN (
    'horoscope','planet_return','solar_return','saturn_return',
    'jupiter_return','transit','natal_chart','custom'
  )),
  input_data   jsonb NOT NULL DEFAULT '{}',
  result_data  jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS atr_user_idx    ON astro_toolkit_readings(user_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS atr_diviner_idx ON astro_toolkit_readings(diviner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS atr_type_idx    ON astro_toolkit_readings(reading_type, created_at DESC);

ALTER TABLE astro_toolkit_readings ENABLE ROW LEVEL SECURITY;

-- RLS: users can read and insert their own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'astro_toolkit_readings'
      AND policyname = 'users_own_astro_readings'
  ) THEN
    CREATE POLICY "users_own_astro_readings"
      ON astro_toolkit_readings
      FOR ALL
      TO authenticated
      USING     (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS: service_role bypass (needed for server-side inserts via admin client)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'astro_toolkit_readings'
      AND policyname = 'service_role_astro_readings'
  ) THEN
    CREATE POLICY "service_role_astro_readings"
      ON astro_toolkit_readings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─── Patch tarot_readings (additive, nullable) ────────────────────────────────

ALTER TABLE tarot_readings
  ADD COLUMN IF NOT EXISTS diviner_id uuid REFERENCES diviners(id) ON DELETE SET NULL;

ALTER TABLE tarot_readings
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tr_diviner_idx ON tarot_readings(diviner_id, created_at DESC);

-- RLS: service_role bypass for tarot_readings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'tarot_readings'
      AND policyname = 'service_role_tarot_readings'
  ) THEN
    CREATE POLICY "service_role_tarot_readings"
      ON tarot_readings
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─── Patch birth_chart_results (additive, nullable) ──────────────────────────

ALTER TABLE birth_chart_results
  ADD COLUMN IF NOT EXISTS diviner_id uuid REFERENCES diviners(id) ON DELETE SET NULL;

ALTER TABLE birth_chart_results
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bcr_diviner_idx ON birth_chart_results(diviner_id, created_at DESC);

-- RLS: service_role bypass for birth_chart_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'birth_chart_results'
      AND policyname = 'service_role_birth_chart_results'
  ) THEN
    CREATE POLICY "service_role_birth_chart_results"
      ON birth_chart_results
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
