-- Backfill legacy `community_members.plan_type` from canonical `pm_tier_id`.
--
-- Context: tasks/23.04.2026/community-pm-entitlement-state-sync
-- Canonical rule (audit note §2):
--   pm_plan_tiers.name ILIKE 'Family'   → plan_type = 'family'
--   everything else                     → plan_type = 'individual'
--
-- This repair updates ONLY rows where:
--   - pm_tier_id IS NOT NULL (the member has a canonical tier)
--   - the canonical mapping disagrees with the stored plan_type
--
-- Rows with NULL pm_tier_id are skipped — for them, plan_type is already
-- the best available signal (e.g. admin-provisioned households).
-- Rows where tier cannot be looked up (FK broken / tier deleted) are
-- skipped and logged via the RAISE NOTICE below.
--
-- Additive + idempotent. Running twice is a no-op after the first run
-- (the WHERE filter returns zero rows). Safe to re-run.

DO $$
DECLARE
  updated_count integer;
  unresolved_count integer;
BEGIN
  -- Count how many rows reference a pm_tier_id that does NOT exist in
  -- pm_plan_tiers. We don't update these — they're surfaced for manual review.
  SELECT COUNT(*)
    INTO unresolved_count
  FROM public.community_members cm
  WHERE cm.pm_tier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.pm_plan_tiers t WHERE t.id = cm.pm_tier_id
    );

  IF unresolved_count > 0 THEN
    RAISE NOTICE
      '[backfill_plan_type] % community_members rows reference a pm_tier_id that does not exist in pm_plan_tiers. These are skipped — review manually.',
      unresolved_count;
  END IF;

  -- Apply the fix. Using a CTE so the canonical column is explicit and the
  -- WHERE filter only touches rows that are actually out of sync.
  WITH canonical AS (
    SELECT
      cm.id AS member_id,
      CASE
        WHEN LOWER(TRIM(t.name)) = 'family' THEN 'family'::text
        ELSE 'individual'::text
      END AS canonical_plan_type
    FROM public.community_members cm
    JOIN public.pm_plan_tiers t ON t.id = cm.pm_tier_id
    WHERE cm.pm_tier_id IS NOT NULL
  )
  UPDATE public.community_members cm
     SET plan_type = canonical.canonical_plan_type
    FROM canonical
   WHERE cm.id = canonical.member_id
     AND cm.plan_type IS DISTINCT FROM canonical.canonical_plan_type;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE
    '[backfill_plan_type] repaired % community_members rows where plan_type disagreed with canonical pm_plan_tiers.name mapping.',
    updated_count;
END $$;
