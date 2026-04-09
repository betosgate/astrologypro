-- ============================================================================
-- Add Stripe product fields to global_pricing and price name to pricing_plans
--
-- global_pricing: stripe_product_id, stripe_product_name
-- pricing_plans:  stripe_price_name
--
-- Idempotent / additive only.
-- ============================================================================

ALTER TABLE global_pricing
  ADD COLUMN IF NOT EXISTS stripe_product_id   TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_name TEXT;

ALTER TABLE pricing_plans
  ADD COLUMN IF NOT EXISTS stripe_price_name TEXT;

-- Index for looking up items by stripe product
CREATE INDEX IF NOT EXISTS idx_global_pricing_stripe_product
  ON global_pricing (stripe_product_id)
  WHERE stripe_product_id IS NOT NULL;

COMMENT ON COLUMN global_pricing.stripe_product_id IS
  'Stripe Product ID (prod_xxx) — one product per pricing item.';
COMMENT ON COLUMN global_pricing.stripe_product_name IS
  'Product name as it appears in Stripe (may differ from item_name).';
COMMENT ON COLUMN pricing_plans.stripe_price_name IS
  'Price nickname/name as it appears in Stripe.';

-- -------------------------------------------------------
-- Backfill existing items with Stripe product IDs
-- -------------------------------------------------------

UPDATE global_pricing
SET stripe_product_id = 'prod_SpR5ZxnOxiW80x',
    stripe_product_name = 'Perennial Mandalism Dashboard Single'
WHERE item_key = 'perennial_mandalism_community'
  AND stripe_product_id IS NULL;

UPDATE global_pricing
SET stripe_product_id = 'prod_SpR54cIddD0uy7',
    stripe_product_name = 'Mystery School dashboard'
WHERE item_key = 'mystery_school'
  AND stripe_product_id IS NULL;

-- -------------------------------------------------------
-- Backfill existing plans with Stripe price names
-- -------------------------------------------------------

-- Perennial Mandalism plans (amounts synced from Stripe)
UPDATE pricing_plans
SET stripe_price_name = 'PM Individual Monthly',
    amount = 19.95
WHERE plan_id = 'plan_pm_individual';

UPDATE pricing_plans
SET stripe_price_name = 'PM Couple Monthly',
    amount = 29.95
WHERE plan_id = 'plan_pm_couple';

UPDATE pricing_plans
SET stripe_price_name = 'PM Family Monthly',
    amount = 39.95
WHERE plan_id = 'plan_pm_family';

-- Mystery School plans (amounts synced from Stripe)
UPDATE pricing_plans
SET stripe_price_name = 'Mystery School Enrollment (One-Time)',
    amount = 97.00
WHERE plan_id = 'plan_mystery_enrollment';

UPDATE pricing_plans
SET stripe_price_name = 'Mystery School Monthly 27 USD',
    amount = 27.00
WHERE plan_id = 'plan_mystery_monthly';

UPDATE pricing_plans
SET stripe_price_name = 'Mystery School Monthly - PM Discount',
    amount = 17.03
WHERE plan_id = 'plan_mystery_monthly_pm_discount';
