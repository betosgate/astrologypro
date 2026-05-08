-- ============================================================================
-- Diviner-Owned Campaign Commission — schema addendum
--
-- Diviner-owned campaigns (affiliate_campaigns.owner_type = 'diviner') now
-- participate in the commission pipeline. When a member books via a diviner's
-- own campaign link, the platform carves out the configured commission and
-- records a campaign_conversion row so the diviner can see conversion counts
-- and earned commission in their dashboard.
--
-- This migration adds:
--   1. bookings.commission_source_campaign_id — populated by resolveStampForBooking
--      when the referral code resolves to a diviner-owned campaign. Mutually
--      exclusive in practice with commission_source_assignment_id /
--      commission_source_template_id (those are the affiliate-owned paths).
--   2. campaign_conversions.is_diviner_self_referral — boolean flag so
--      reporting can distinguish diviner self-conversions from third-party
--      affiliate conversions without a JOIN.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

BEGIN;

-- ─── 1. bookings: diviner-owned campaign stamp source ──────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_source_campaign_id UUID
    REFERENCES affiliate_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_commission_source_campaign
  ON bookings (commission_source_campaign_id)
  WHERE commission_source_campaign_id IS NOT NULL;

COMMENT ON COLUMN bookings.commission_source_campaign_id IS
  'Set when a booking was referred via a diviner-owned campaign (owner_type=''diviner'').
   Mutually exclusive with commission_source_assignment_id (per-diviner affiliate path)
   and commission_source_template_id (general-program path).
   Populated by resolveStampForBooking; read by the Stripe webhook to credit the
   diviner campaign_conversions row.';

-- ─── 2. campaign_conversions: diviner self-referral flag ───────────────────
ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS is_diviner_self_referral BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN campaign_conversions.is_diviner_self_referral IS
  'TRUE when the conversion came from a diviner-owned campaign (the diviner promoted
   their own service). Allows reporting to filter / group self-referral vs third-party
   affiliate conversions without a JOIN to affiliate_campaigns.';

-- ─── 3. Sanity check ───────────────────────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings'
      AND column_name='commission_source_campaign_id'
  ) THEN
    RAISE EXCEPTION 'bookings.commission_source_campaign_id not added';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='is_diviner_self_referral'
  ) THEN
    RAISE EXCEPTION 'campaign_conversions.is_diviner_self_referral not added';
  END IF;
END
$check$;

COMMIT;
