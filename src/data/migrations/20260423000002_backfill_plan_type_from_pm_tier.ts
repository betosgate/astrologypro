// Bundled mirror of supabase/migrations/20260423000002_backfill_plan_type_from_pm_tier.sql
//
// Backfill repair — brings community_members.plan_type in line with the
// canonical pm_tier_id → pm_plan_tiers.name mapping. Idempotent.
//
// See tasks/23.04.2026/community-pm-entitlement-state-sync/00-audit-note.md §2.
export const MIGRATION_SQL = `
DO $$
DECLARE
  updated_count integer;
  unresolved_count integer;
BEGIN
  SELECT COUNT(*)
    INTO unresolved_count
  FROM public.community_members cm
  WHERE cm.pm_tier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.pm_plan_tiers t WHERE t.id = cm.pm_tier_id
    );

  IF unresolved_count > 0 THEN
    RAISE NOTICE
      '[backfill_plan_type] % community_members rows reference a pm_tier_id that does not exist in pm_plan_tiers. Skipped — review manually.',
      unresolved_count;
  END IF;

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
`;
