-- ============================================================================
-- pricing_plan_custom_fields — flexible metadata array on each pricing plan
--
-- Adds a JSONB column to pricing_plans for storing an array of custom
-- key-value fields: [{ label, value, slug }, ...].
-- Used by signup pages to display plan-specific details (duration, sessions,
-- support level, etc.).
--
-- Idempotent / additive only.
-- ============================================================================

-- 1. Add column
ALTER TABLE pricing_plans
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. CHECK constraint: must be a JSON array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pricing_plans_custom_fields_is_array'
  ) THEN
    ALTER TABLE pricing_plans
      ADD CONSTRAINT pricing_plans_custom_fields_is_array
      CHECK (jsonb_typeof(custom_fields) = 'array');
  END IF;
END $$;

COMMENT ON COLUMN pricing_plans.custom_fields IS
  'Array of {label, value, slug} objects — flexible plan metadata displayed on signup pages.';
