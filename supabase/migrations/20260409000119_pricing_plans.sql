-- ============================================================================
-- pricing_plans — multiple plans per global_pricing item
--
-- One global_pricing row (e.g. "Professional Divination Course") can have
-- several purchasable plans (monthly, one-time, etc.), each with its own
-- amount, MRP, Stripe Price ID, currency, and description.
--
-- Also improves the global_pricing index: replaces the low-cardinality
-- boolean-only idx_global_pricing_active with a composite index matching
-- the actual public lookup pattern (is_active, item_key).
--
-- Idempotent / additive only.
-- ============================================================================

-- -------------------------------------------------------
-- 1. pricing_plans table
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS pricing_plans (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           TEXT          NOT NULL UNIQUE DEFAULT 'plan_' || replace(gen_random_uuid()::text, '-', ''),
  item_id           UUID          NOT NULL REFERENCES global_pricing(id) ON DELETE CASCADE,
  display_name      TEXT          NOT NULL,
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp               NUMERIC(12,2),
  stripe_price_id   TEXT,
  currency          TEXT          NOT NULL DEFAULT 'INR',
  description       TEXT,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order        INT           NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT pricing_plans_currency_check CHECK (currency IN ('USD', 'INR')),
  CONSTRAINT pricing_plans_amount_non_negative CHECK (amount >= 0),
  CONSTRAINT pricing_plans_mrp_non_negative CHECK (mrp IS NULL OR mrp >= 0)
);

COMMENT ON TABLE pricing_plans IS
  'Multiple purchasable plans per global_pricing item. Each plan has its own amount, MRP, Stripe Price ID, and currency.';

-- -------------------------------------------------------
-- 2. Indexes (designed for actual query patterns)
-- -------------------------------------------------------

-- Plans lookup: active plans for a given item, ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_pricing_plans_item_active
  ON pricing_plans (item_id, is_active, sort_order);

-- Stripe webhook lookup: find plan by stripe_price_id
CREATE INDEX IF NOT EXISTS idx_pricing_plans_stripe_price
  ON pricing_plans (stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;

-- Unique plan_id lookup (already covered by UNIQUE constraint but explicit)
-- The UNIQUE on plan_id creates its own index automatically.

-- Improve global_pricing index: composite replaces low-cardinality boolean
DROP INDEX IF EXISTS idx_global_pricing_active;

CREATE INDEX IF NOT EXISTS idx_global_pricing_active_item_key
  ON global_pricing (is_active, item_key);

-- -------------------------------------------------------
-- 3. updated_at trigger
-- -------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions' AND p.proname = 'moddatetime'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_pricing_plans
               BEFORE UPDATE ON pricing_plans
               FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- -------------------------------------------------------
-- 4. RLS
-- -------------------------------------------------------

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Public read for active plans (signup pages need to list plan options)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pricing_plans' AND policyname = 'pricing_plans_public_read'
  ) THEN
    CREATE POLICY pricing_plans_public_read
      ON pricing_plans FOR SELECT
      USING (is_active = TRUE);
  END IF;

  -- Service role full access (admin operations)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pricing_plans' AND policyname = 'pricing_plans_service_role'
  ) THEN
    CREATE POLICY pricing_plans_service_role
      ON pricing_plans FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

-- -------------------------------------------------------
-- 5. Seed: migrate existing global_pricing row as a plan
-- -------------------------------------------------------

INSERT INTO pricing_plans (item_id, display_name, amount, mrp, currency, description, plan_id)
SELECT
  gp.id,
  gp.item_name,
  gp.price,
  gp.price,
  gp.currency,
  gp.description,
  'plan_professional_divination_course_default'
FROM global_pricing gp
WHERE gp.item_key = 'professional_divination_course'
ON CONFLICT (plan_id) DO NOTHING;
