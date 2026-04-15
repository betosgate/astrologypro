// AUTO-GENERATED bundled mirror of supabase/migrations/20260410000124_pricing_onetime_recurring_html.sql
// Used by /api/admin/db/migrate so the deployed function does not need fs.

export const MIGRATION_SQL = `-- ============================================================================
-- Split amount/currency into onetime and recurring fields + add html_description
--
-- pricing_plans: onetime_amount, onetime_currency, recurring_amount, recurring_currency
-- global_pricing + pricing_plans: html_description
--
-- Stage 1 (additive): add new columns, copy data. Old columns kept for now.
-- Stage 2 (separate migration): drop old amount/currency after code is updated.
--
-- Idempotent / additive only.
-- ============================================================================

-- -------------------------------------------------------
-- 1. New columns on pricing_plans
-- -------------------------------------------------------

ALTER TABLE pricing_plans
  ADD COLUMN IF NOT EXISTS onetime_amount    NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS onetime_currency  TEXT,
  ADD COLUMN IF NOT EXISTS recurring_amount  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS recurring_currency TEXT,
  ADD COLUMN IF NOT EXISTS html_description  TEXT;

-- -------------------------------------------------------
-- 2. html_description on global_pricing
-- -------------------------------------------------------

ALTER TABLE global_pricing
  ADD COLUMN IF NOT EXISTS html_description TEXT;

-- -------------------------------------------------------
-- 3. Migrate existing data
-- -------------------------------------------------------

-- Subscription plans (with stripe_price_id): copy amount → recurring fields only.
-- onetime_amount is admin-managed — never auto-populated from the legacy amount column.
UPDATE pricing_plans
SET recurring_amount = amount,
    recurring_currency = currency
WHERE stripe_price_id IS NOT NULL
  AND recurring_amount IS NULL
  AND amount IS NOT NULL;

-- -------------------------------------------------------
-- 4. Currency check constraints on new columns
-- -------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pricing_plans_onetime_currency_check'
  ) THEN
    ALTER TABLE pricing_plans
      ADD CONSTRAINT pricing_plans_onetime_currency_check
      CHECK (onetime_currency IS NULL OR onetime_currency IN ('USD', 'INR'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pricing_plans_recurring_currency_check'
  ) THEN
    ALTER TABLE pricing_plans
      ADD CONSTRAINT pricing_plans_recurring_currency_check
      CHECK (recurring_currency IS NULL OR recurring_currency IN ('USD', 'INR'));
  END IF;
END $$;

-- -------------------------------------------------------
-- 5. Comments
-- -------------------------------------------------------

COMMENT ON COLUMN pricing_plans.onetime_amount IS
  'One-time payment amount (manually set by admin). No Stripe price needed.';
COMMENT ON COLUMN pricing_plans.onetime_currency IS
  'Currency for one-time payment (USD or INR).';
COMMENT ON COLUMN pricing_plans.recurring_amount IS
  'Recurring subscription amount (auto-filled from Stripe price). Read-only.';
COMMENT ON COLUMN pricing_plans.recurring_currency IS
  'Currency for recurring payment (auto-filled from Stripe price). Read-only.';
COMMENT ON COLUMN pricing_plans.html_description IS
  'Rich HTML description for the plan, shown on signup/pricing pages.';
COMMENT ON COLUMN global_pricing.html_description IS
  'Rich HTML description for the item, shown on signup/pricing pages.';
`;
