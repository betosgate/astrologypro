-- ============================================================================
-- Affiliate Analytics Phase 3 — read-only helper functions
--
-- Phase 3 is dashboards + aggregations on top of Phase 2 data. No new
-- writes to existing tables. This migration adds the SQL helper functions
-- API routes call via PostgREST RPC. All functions are SECURITY INVOKER
-- (caller's RLS applies) — service-role admin routes call them.
--
-- Sprint plan:
--   docs/tasks/2026-05-05/affiliate-analytics-phase-3/
--
-- Hard prerequisite: Phase 2 schema (affiliate_payouts table,
-- campaign_conversions.payout_status, affiliate_accounts.first_*_at)
-- must already exist. Dies loudly otherwise.
-- ============================================================================

BEGIN;

-- ─── 0. Pre-flight: confirm Phase 2 + Task 10 columns exist ───────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='affiliate_payouts'
  ) THEN
    RAISE EXCEPTION
      'Phase 3 prerequisite missing: affiliate_payouts table (Phase 2). Apply 20260505000003 first.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='payout_status'
  ) THEN
    RAISE EXCEPTION
      'Phase 3 prerequisite missing: campaign_conversions.payout_status (Phase 2).';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='affiliate_accounts'
      AND column_name='first_payout_at'
  ) THEN
    RAISE EXCEPTION
      'Phase 3 prerequisite missing: affiliate_accounts.first_payout_at (Phase 2 Task 10).';
  END IF;
END
$check$;

-- ─── 1. Affiliate daily earnings (Task 01) ────────────────────────────────
CREATE OR REPLACE FUNCTION affiliate_daily_earnings(
  p_affiliate_account_id UUID,
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (
  day DATE,
  conversions BIGINT,
  commission_cents BIGINT,
  paid_cents BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    date_trunc('day', c.converted_at)::date AS day,
    COUNT(*)::bigint AS conversions,
    COALESCE(SUM(c.commission_amount_cents), 0)::bigint AS commission_cents,
    COALESCE(SUM(c.paid_amount_cents) FILTER (WHERE c.payout_status = 'paid'), 0)::bigint AS paid_cents
  FROM campaign_conversions c
  WHERE c.affiliate_account_id = p_affiliate_account_id
    AND c.reversed_at IS NULL
    AND c.converted_at >= p_cutoff
  GROUP BY 1
  ORDER BY 1;
$$;

-- ─── 2. Own-cohort retention for an affiliate (Task 01) ───────────────────
CREATE OR REPLACE FUNCTION affiliate_own_cohort_retention(
  p_affiliate_account_id UUID
)
RETURNS TABLE (
  cohort_month DATE,
  cohort_size BIGINT,
  retained_30d BIGINT,
  retained_90d BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH first_bookings AS (
    SELECT b.client_id, MIN(b.scheduled_at) AS first_at
      FROM bookings b
      JOIN campaign_conversions c ON c.booking_id = b.id
     WHERE c.affiliate_account_id = p_affiliate_account_id
       AND c.reversed_at IS NULL
     GROUP BY b.client_id
  ),
  cohorts AS (
    SELECT
      date_trunc('month', first_at)::date AS cohort_month,
      client_id,
      first_at
    FROM first_bookings
  ),
  retention AS (
    SELECT
      co.cohort_month,
      co.client_id,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = co.client_id
           AND b2.scheduled_at > co.first_at
           AND b2.scheduled_at <= co.first_at + INTERVAL '30 days'
      ) AS d30,
      EXISTS (
        SELECT 1 FROM bookings b2
         WHERE b2.client_id = co.client_id
           AND b2.scheduled_at > co.first_at
           AND b2.scheduled_at <= co.first_at + INTERVAL '90 days'
      ) AS d90
    FROM cohorts co
  )
  SELECT
    cohort_month,
    COUNT(*)::bigint AS cohort_size,
    COUNT(*) FILTER (WHERE d30)::bigint AS retained_30d,
    COUNT(*) FILTER (WHERE d90)::bigint AS retained_90d
  FROM retention
  GROUP BY cohort_month
  ORDER BY cohort_month DESC;
$$;

-- ─── 3. Median time-to-payout (Task 03) ───────────────────────────────────
CREATE OR REPLACE FUNCTION affiliate_median_time_to_payout_days(
  p_cutoff TIMESTAMPTZ
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (c.paid_at - c.converted_at)) / 86400.0
      ),
      0
    )::numeric
  FROM campaign_conversions c
  WHERE c.payout_status = 'paid'
    AND c.paid_at IS NOT NULL
    AND c.converted_at IS NOT NULL
    AND c.paid_at >= p_cutoff;
$$;

-- ─── 4. Payout velocity histogram (Task 03) ───────────────────────────────
CREATE OR REPLACE FUNCTION affiliate_payout_velocity_histogram(
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (days_band TEXT, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  WITH banded AS (
    SELECT
      CASE
        WHEN (paid_at - converted_at) < INTERVAL '1 day' THEN '<1d'
        WHEN (paid_at - converted_at) < INTERVAL '2 days' THEN '1-2d'
        WHEN (paid_at - converted_at) < INTERVAL '3 days' THEN '2-3d'
        WHEN (paid_at - converted_at) < INTERVAL '7 days' THEN '3-7d'
        WHEN (paid_at - converted_at) < INTERVAL '14 days' THEN '7-14d'
        ELSE '14d+'
      END AS days_band
    FROM campaign_conversions
    WHERE payout_status = 'paid'
      AND paid_at IS NOT NULL
      AND converted_at IS NOT NULL
      AND paid_at >= p_cutoff
  )
  SELECT days_band, COUNT(*)::bigint
  FROM banded
  GROUP BY days_band
  ORDER BY
    CASE days_band
      WHEN '<1d' THEN 0
      WHEN '1-2d' THEN 1
      WHEN '2-3d' THEN 2
      WHEN '3-7d' THEN 3
      WHEN '7-14d' THEN 4
      WHEN '14d+' THEN 5
    END;
$$;

-- ─── 5. Campaign ROI (Task 03) ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION affiliate_campaign_roi(
  p_cutoff TIMESTAMPTZ
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  conversion_count BIGINT,
  gross_cents BIGINT,
  commission_paid_cents BIGINT,
  platform_fee_cents BIGINT,
  net_to_platform_cents BIGINT,
  roi NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  -- platform_fee approximation: 15% of order_amount_cents (matches the
  -- global default in PRICING.platformFeePercent). Service-level overrides
  -- may differ; admin can cross-check against revenue_ledger_entries.
  SELECT
    cc.campaign_id,
    COALESCE(camp.name, camp.share_code)::text AS campaign_name,
    COUNT(*)::bigint AS conversion_count,
    COALESCE(SUM(cc.order_amount_cents), 0)::bigint AS gross_cents,
    COALESCE(SUM(cc.commission_amount_cents), 0)::bigint AS commission_paid_cents,
    COALESCE(SUM(cc.order_amount_cents), 0)::bigint * 15 / 100 AS platform_fee_cents,
    (COALESCE(SUM(cc.order_amount_cents), 0)::bigint * 15 / 100
      - COALESCE(SUM(cc.commission_amount_cents), 0)::bigint) AS net_to_platform_cents,
    CASE
      WHEN COALESCE(SUM(cc.commission_amount_cents), 0) = 0 THEN 0
      ELSE (
        (COALESCE(SUM(cc.order_amount_cents), 0)::numeric * 0.15
          - COALESCE(SUM(cc.commission_amount_cents), 0)::numeric)
        / NULLIF(COALESCE(SUM(cc.commission_amount_cents), 0)::numeric, 0)
      )
    END::numeric AS roi
  FROM campaign_conversions cc
  LEFT JOIN affiliate_campaigns camp ON camp.id = cc.campaign_id
  WHERE cc.reversed_at IS NULL
    AND cc.converted_at >= p_cutoff
  GROUP BY cc.campaign_id, camp.name, camp.share_code
  ORDER BY commission_paid_cents DESC
  LIMIT 20;
$$;

-- ─── 6. Referred-client retention cohort (Task 04) ────────────────────────
CREATE OR REPLACE FUNCTION affiliate_referred_client_retention()
RETURNS TABLE (
  cohort_month DATE,
  cohort_size BIGINT,
  retained_30d BIGINT,
  retained_60d BIGINT,
  retained_90d BIGINT,
  retained_180d BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH first_aff_bookings AS (
    SELECT b.client_id, MIN(b.scheduled_at) AS first_at
      FROM bookings b
      JOIN campaign_conversions c ON c.booking_id = b.id
     WHERE c.reversed_at IS NULL
     GROUP BY b.client_id
  ),
  cohorts AS (
    SELECT
      date_trunc('month', first_at)::date AS cohort_month,
      client_id,
      first_at
    FROM first_aff_bookings
  ),
  retention AS (
    SELECT
      co.cohort_month,
      co.client_id,
      EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.client_id = co.client_id
           AND b.scheduled_at > co.first_at
           AND b.scheduled_at <= co.first_at + INTERVAL '30 days'
      ) AS d30,
      EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.client_id = co.client_id
           AND b.scheduled_at > co.first_at
           AND b.scheduled_at <= co.first_at + INTERVAL '60 days'
      ) AS d60,
      EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.client_id = co.client_id
           AND b.scheduled_at > co.first_at
           AND b.scheduled_at <= co.first_at + INTERVAL '90 days'
      ) AS d90,
      EXISTS (
        SELECT 1 FROM bookings b
         WHERE b.client_id = co.client_id
           AND b.scheduled_at > co.first_at
           AND b.scheduled_at <= co.first_at + INTERVAL '180 days'
      ) AS d180
    FROM cohorts co
  )
  SELECT
    cohort_month,
    COUNT(*)::bigint AS cohort_size,
    COUNT(*) FILTER (WHERE d30)::bigint AS retained_30d,
    COUNT(*) FILTER (WHERE d60)::bigint AS retained_60d,
    COUNT(*) FILTER (WHERE d90)::bigint AS retained_90d,
    COUNT(*) FILTER (WHERE d180)::bigint AS retained_180d
  FROM retention
  GROUP BY cohort_month
  ORDER BY cohort_month DESC;
$$;

-- ─── 7. 1099-NEC YTD totals per affiliate (Task 05) ───────────────────────
-- Timezone: America/New_York (US tax-reporting standard).
CREATE OR REPLACE FUNCTION affiliate_1099_ytd_totals(p_year INTEGER)
RETURNS TABLE (
  affiliate_account_id UUID,
  affiliate_email TEXT,
  stripe_account_id TEXT,
  ytd_paid_cents BIGINT,
  conversion_count BIGINT,
  first_payout_at TIMESTAMPTZ,
  last_payout_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.affiliate_account_id,
    a.email::text AS affiliate_email,
    a.stripe_account_id,
    COALESCE(SUM(c.paid_amount_cents), 0)::bigint AS ytd_paid_cents,
    COUNT(*)::bigint AS conversion_count,
    MIN(c.paid_at) AS first_payout_at,
    MAX(c.paid_at) AS last_payout_at
  FROM campaign_conversions c
  JOIN affiliate_accounts a ON a.id = c.affiliate_account_id
  WHERE c.payout_status = 'paid'
    AND c.paid_at IS NOT NULL
    AND EXTRACT(YEAR FROM (c.paid_at AT TIME ZONE 'America/New_York'))::int = p_year
  GROUP BY c.affiliate_account_id, a.email, a.stripe_account_id
  HAVING COALESCE(SUM(c.paid_amount_cents), 0) > 0
  ORDER BY ytd_paid_cents DESC;
$$;

-- ─── 8. Sanity: confirm functions exist ───────────────────────────────────
DO $sanity$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'affiliate_daily_earnings') THEN
    RAISE EXCEPTION 'affiliate_daily_earnings() not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'affiliate_referred_client_retention') THEN
    RAISE EXCEPTION 'affiliate_referred_client_retention() not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'affiliate_1099_ytd_totals') THEN
    RAISE EXCEPTION 'affiliate_1099_ytd_totals() not created';
  END IF;
END
$sanity$;

COMMIT;
