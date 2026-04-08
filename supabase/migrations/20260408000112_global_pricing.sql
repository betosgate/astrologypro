-- ============================================================================
-- Global pricing — admin-managed prices for purchasable items across the app
--
-- Storage shape: one row per purchasable item, keyed on a stable item_key.
-- Replaces hardcoded prices in signup pages and lets admins update them via
-- the new /admin/pricing UI.
--
-- Initial seed: professional_divination_course = 25969 INR (per the
-- diviner-signup spec).
--
-- Idempotent / additive only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_pricing (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key    TEXT        NOT NULL UNIQUE,
  item_name   TEXT        NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency    TEXT        NOT NULL DEFAULT 'INR',
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT global_pricing_currency_check CHECK (currency IN ('USD', 'INR'))
);

CREATE INDEX IF NOT EXISTS idx_global_pricing_active
  ON global_pricing (is_active);

-- updated_at trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions' AND p.proname = 'moddatetime'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_global_pricing
               BEFORE UPDATE ON global_pricing
               FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- RLS
ALTER TABLE global_pricing ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'global_pricing' AND policyname = 'global_pricing_public_read'
  ) THEN
    -- Public read so signup pages can fetch the price without auth.
    -- The values are not secrets; they're advertised on the marketing site.
    CREATE POLICY global_pricing_public_read
      ON global_pricing FOR SELECT
      USING (is_active = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'global_pricing' AND policyname = 'global_pricing_service_role'
  ) THEN
    CREATE POLICY global_pricing_service_role
      ON global_pricing FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

-- Seed the initial item.
INSERT INTO global_pricing (item_key, item_name, price, currency, description)
VALUES (
  'professional_divination_course',
  'Professional Divination Course',
  25969.00,
  'INR',
  'Full Professional Divination Course — 100+ hours of training, live readings, and recordings.'
)
ON CONFLICT (item_key) DO NOTHING;

COMMENT ON TABLE global_pricing IS
  'Admin-managed prices for purchasable items across the app. Read by signup pages, edited via /admin/pricing.';
