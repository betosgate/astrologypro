export const MIGRATION_SQL = `-- ============================================================================
-- Add platform_fee_percent to services
-- ============================================================================
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) DEFAULT NULL;
`;

export const MIGRATION_ID = "20260413000008_services_platform_fee_percent";
export const MIGRATION_DESCRIPTION = "Add platform_fee_percent column to services table";
