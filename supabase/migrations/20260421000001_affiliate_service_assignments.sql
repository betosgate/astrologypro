-- =============================================================================
-- Task 01: Affiliate Service Assignments + URL Attribution — Schema Foundation
-- Sprint: 2026-04-21 (affiliate-service-assignment)
-- =============================================================================
-- Data foundation for the new service-scoped affiliate model:
--   - diviner_service_affiliates (source of truth for assignments)
--   - affiliate_campaigns.owner_type (diviner vs affiliate ownership)
--   - campaign_clicks / campaign_conversions / page_views affiliate attribution
--   - bookings.ref_code for click → booking → conversion chain
--   - auto-pause trigger on assignment revocation
--   - RLS policies for per-role access
-- STRICTLY ADDITIVE: no DROPs, no destructive ALTERs. Idempotent — the admin
-- runner may re-execute this migration safely.
-- =============================================================================

-- ─── 1. diviner_service_affiliates ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diviner_service_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,

  -- Scope
  destination_type TEXT NOT NULL CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  destination_id   UUID,

  -- Affiliate identity
  affiliate_id   UUID NOT NULL,
  affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),

  -- Commercial terms
  commission_type  TEXT NOT NULL CHECK (commission_type IN ('percent', 'flat')) DEFAULT 'percent',
  commission_value NUMERIC(10,4) NOT NULL CHECK (commission_value >= 0),

  -- Lifecycle
  is_active    BOOLEAN NOT NULL DEFAULT true,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by  UUID REFERENCES auth.users(id),
  revoked_at   TIMESTAMPTZ,
  revoked_by   UUID REFERENCES auth.users(id),
  notes        TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT diviner_service_affiliates_scope_valid CHECK (
    (destination_type = 'PROFILE' AND destination_id IS NULL)
    OR (destination_type = 'SERVICE' AND destination_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_diviner_service_affiliates_scope_active
  ON diviner_service_affiliates (diviner_id, destination_type, destination_id, affiliate_id, affiliate_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_diviner_service_affiliates_affiliate
  ON diviner_service_affiliates (affiliate_id, affiliate_type, is_active);

CREATE INDEX IF NOT EXISTS idx_diviner_service_affiliates_diviner
  ON diviner_service_affiliates (diviner_id, is_active);

-- ─── 2. Extend affiliate_campaigns ───────────────────────────────────────────
ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS owner_type           TEXT NOT NULL DEFAULT 'diviner'
    CHECK (owner_type IN ('diviner', 'affiliate')),
  ADD COLUMN IF NOT EXISTS owner_affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS owner_affiliate_type TEXT
    CHECK (owner_affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS commission_value_snapshot NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS commission_type_snapshot  TEXT
    CHECK (commission_type_snapshot IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS source_assignment_id UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL;

-- Owner-consistency constraint — guarded so re-runs don't error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'affiliate_campaigns_owner_consistency'
  ) THEN
    ALTER TABLE affiliate_campaigns
      ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
        (owner_type = 'diviner'
          AND owner_affiliate_id IS NULL
          AND owner_affiliate_type IS NULL
          AND commission_value_snapshot IS NULL)
        OR (owner_type = 'affiliate'
          AND owner_affiliate_id IS NOT NULL
          AND owner_affiliate_type IS NOT NULL
          AND commission_value_snapshot IS NOT NULL
          AND source_assignment_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaigns_owner_affiliate
  ON affiliate_campaigns (owner_affiliate_id, owner_affiliate_type, status)
  WHERE owner_type = 'affiliate';

-- ─── 3. Extend campaign_clicks ───────────────────────────────────────────────
ALTER TABLE campaign_clicks
  ADD COLUMN IF NOT EXISTS affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS affiliate_type TEXT
    CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS commission_value_snapshot NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS commission_type_snapshot  TEXT
    CHECK (commission_type_snapshot IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_affiliate
  ON campaign_clicks (affiliate_id, affiliate_type)
  WHERE affiliate_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_ref_code
  ON campaign_clicks (ref_code)
  WHERE ref_code IS NOT NULL;

-- ─── 4. Extend campaign_conversions ──────────────────────────────────────────
ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ref_code_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS commission_source TEXT NOT NULL DEFAULT 'campaign_assignment'
    CHECK (commission_source IN ('campaign_assignment', 'legacy_campaign_affiliates', 'manual_override')),
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reversal_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_conversions_booking
  ON campaign_conversions (booking_id) WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_campaign_conversions_booking
  ON campaign_conversions (booking_id) WHERE booking_id IS NOT NULL;

-- ─── 5. bookings.ref_code ────────────────────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_ref_code
  ON bookings (ref_code) WHERE ref_code IS NOT NULL;

-- ─── 6. Extend page_views (analytics funnel support) ─────────────────────────
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS affiliate_type TEXT
    CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_ref_code
  ON page_views (ref_code) WHERE ref_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_page_views_affiliate
  ON page_views (affiliate_id, affiliate_type)
  WHERE affiliate_id IS NOT NULL;

-- ─── 7. Auto-pause trigger: assignment revoked → pause matching campaigns ───
CREATE OR REPLACE FUNCTION auto_pause_affiliate_campaigns_on_revoke()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND (OLD.is_active = true OR OLD.is_active IS NULL) THEN
    UPDATE affiliate_campaigns
       SET status = 'paused',
           auto_pause_reason = 'assignment_revoked',
           auto_paused_at = now()
     WHERE owner_type = 'affiliate'
       AND owner_affiliate_id = NEW.affiliate_id
       AND owner_affiliate_type = NEW.affiliate_type
       AND diviner_id = NEW.diviner_id
       AND status = 'active'
       AND (
            (NEW.destination_type = 'PROFILE' AND destination_type = 'PROFILE')
         OR (NEW.destination_type = 'SERVICE'
             AND destination_type = 'SERVICE'
             AND destination_service_template_id = NEW.destination_id)
       );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_pause_affiliate_campaigns ON diviner_service_affiliates;
CREATE TRIGGER trg_auto_pause_affiliate_campaigns
  AFTER UPDATE OF is_active ON diviner_service_affiliates
  FOR EACH ROW EXECUTE FUNCTION auto_pause_affiliate_campaigns_on_revoke();

-- ─── 8. RLS policies ─────────────────────────────────────────────────────────
ALTER TABLE diviner_service_affiliates ENABLE ROW LEVEL SECURITY;

-- Diviner can see + manage their own assignments
DROP POLICY IF EXISTS diviner_service_affiliates_select_diviner ON diviner_service_affiliates;
CREATE POLICY diviner_service_affiliates_select_diviner
  ON diviner_service_affiliates FOR SELECT
  USING (
    diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );

-- Affiliate can see assignments naming them (affiliate_id is auth.users.id)
DROP POLICY IF EXISTS diviner_service_affiliates_select_affiliate ON diviner_service_affiliates;
CREATE POLICY diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates FOR SELECT
  USING (affiliate_id = auth.uid());

-- Only the owning diviner (or admin) can insert/update/delete
DROP POLICY IF EXISTS diviner_service_affiliates_write_diviner ON diviner_service_affiliates;
CREATE POLICY diviner_service_affiliates_write_diviner
  ON diviner_service_affiliates FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

-- Service role has full access (admin dashboard, backfill scripts)
DROP POLICY IF EXISTS diviner_service_affiliates_service_role ON diviner_service_affiliates;
CREATE POLICY diviner_service_affiliates_service_role
  ON diviner_service_affiliates FOR ALL TO service_role
  USING (true) WITH CHECK (true);
