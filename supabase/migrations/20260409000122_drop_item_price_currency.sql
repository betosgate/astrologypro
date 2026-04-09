-- ============================================================================
-- Drop price and currency from global_pricing
--
-- Pricing now lives exclusively on pricing_plans. The item-level price and
-- currency columns are no longer read or written by any code path.
--
-- This is a destructive migration — the columns are dropped permanently.
-- All consumer code has already been updated to read from pricing_plans.
-- ============================================================================

ALTER TABLE global_pricing DROP COLUMN IF EXISTS price;
ALTER TABLE global_pricing DROP COLUMN IF EXISTS currency;

-- Also drop the now-irrelevant currency CHECK constraint if it exists
ALTER TABLE global_pricing DROP CONSTRAINT IF EXISTS global_pricing_currency_check;
