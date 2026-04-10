-- ============================================================================
-- Add recurring_interval to pricing_plans
--
-- Stores the billing interval (month/year) for subscription plans.
-- Idempotent / additive only.
-- ============================================================================

ALTER TABLE pricing_plans
  ADD COLUMN IF NOT EXISTS recurring_interval TEXT;

COMMENT ON COLUMN pricing_plans.recurring_interval IS
  'Billing interval for recurring plans (month or year). NULL for one-time only.';
