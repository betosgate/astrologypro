// Mirror of supabase/migrations/20260428000010_fix_diviner_fields_length.sql
// Used by the admin migration runner UI.

export const MIGRATION_SQL = `-- Increase length of fields in diviners table to avoid truncation errors
-- Specifically plan_id was VARCHAR(20) while pricing_plans.plan_id are longer slugs.

ALTER TABLE diviners 
  ALTER COLUMN plan_id TYPE TEXT,
  ALTER COLUMN subscription_status TYPE TEXT,
  ALTER COLUMN twilio_phone_number TYPE VARCHAR(50),
  ALTER COLUMN phone TYPE VARCHAR(50),
  ALTER COLUMN username TYPE TEXT,
  ALTER COLUMN display_name TYPE TEXT;
`;
