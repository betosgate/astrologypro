// Bundled mirror of supabase/migrations/20260505000002_booking_affiliate_commission_cents.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- ============================================================================
-- Booking affiliate commission cents — carve-out persistence
--
-- The booking-payment route computes affiliate commission cents from the
-- stamp at PaymentIntent creation time and increases application_fee_amount
-- to retain the affiliate's share on platform balance. This column persists
-- the exact cents value so:
--   1. The webhook + confirm-payment + sync-booking credit paths all read
--      the same source of truth (no off-by-one rounding mismatches against
--      what was actually carved out at PaymentIntent time).
--   2. Refund flow can subtract the exact carved-out amount.
--   3. revenue_ledger_entries.affiliate_commission_cents matches the
--      actual money flow.
--
-- Sprint plan:
--   docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/
-- ============================================================================

BEGIN;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS affiliate_commission_amount_cents INTEGER
    CHECK (affiliate_commission_amount_cents IS NULL
           OR affiliate_commission_amount_cents >= 0);

-- No backfill: pre-existing bookings keep NULL. Code branches on the
-- column being non-null to distinguish post-deploy bookings from
-- pre-deploy ones. Refund flow for pre-deploy bookings continues to
-- use the legacy path (no carve-out to undo because there wasn't one).

DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'affiliate_commission_amount_cents'
  ) THEN
    RAISE EXCEPTION 'bookings.affiliate_commission_amount_cents not added';
  END IF;
  -- Verify the CHECK constraint went down too.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints cc
    WHERE cc.constraint_schema = 'public'
      AND cc.check_clause LIKE '%affiliate_commission_amount_cents%'
  ) THEN
    RAISE EXCEPTION 'CHECK constraint on affiliate_commission_amount_cents not added';
  END IF;
END
$check$;

COMMIT;
`;
