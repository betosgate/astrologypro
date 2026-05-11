-- Align PM plan tiers with the public Perennial Mandalism three-plan catalog.
--
-- Context:
-- - pricing_plans has plan_pm_individual, plan_pm_couple, and plan_pm_family.
-- - pm_plan_tiers originally seeded only Individual and Family, so
--   /api/community/plan.available_tiers could only return two entries.
-- - community_members.plan_type only supports "individual" and "family";
--   Couple is household-capable, so it maps to the legacy "family" flag.
--
-- Idempotent: updates existing named tiers and inserts any missing tier.

WITH plan_source AS (
  SELECT
    'individual'::text AS tier_key,
    'Individual'::text AS tier_name,
    COALESCE(pp.description, 'Single member access to the Perennial Mandalism community.') AS description,
    COALESCE(pp.recurring_amount, pp.amount, 19.95)::numeric(10,2) AS base_price_usd,
    1::integer AS base_member_limit,
    0::numeric(10,2) AS extra_per_member_usd,
    1::integer AS max_total_members,
    pp.stripe_price_id,
    1::integer AS display_order
  FROM pricing_plans pp
  WHERE pp.plan_id = 'plan_pm_individual'

  UNION ALL

  SELECT
    'couple'::text AS tier_key,
    'Couple'::text AS tier_name,
    COALESCE(pp.description, 'Two members sharing one household - joint access to the community.') AS description,
    COALESCE(pp.recurring_amount, pp.amount, 29.95)::numeric(10,2) AS base_price_usd,
    2::integer AS base_member_limit,
    0::numeric(10,2) AS extra_per_member_usd,
    2::integer AS max_total_members,
    pp.stripe_price_id,
    2::integer AS display_order
  FROM pricing_plans pp
  WHERE pp.plan_id = 'plan_pm_couple'

  UNION ALL

  SELECT
    'family'::text AS tier_key,
    'Family'::text AS tier_name,
    COALESCE(pp.description, 'Up to 5 family members - full household access to the community.') AS description,
    COALESCE(pp.recurring_amount, pp.amount, 39.95)::numeric(10,2) AS base_price_usd,
    5::integer AS base_member_limit,
    0::numeric(10,2) AS extra_per_member_usd,
    5::integer AS max_total_members,
    pp.stripe_price_id,
    3::integer AS display_order
  FROM pricing_plans pp
  WHERE pp.plan_id = 'plan_pm_family'
),
updated AS (
  UPDATE pm_plan_tiers tier
     SET name = source.tier_name,
         description = source.description,
         base_price_usd = source.base_price_usd,
         base_member_limit = source.base_member_limit,
         extra_per_member_usd = source.extra_per_member_usd,
         max_total_members = source.max_total_members,
         stripe_price_id = COALESCE(source.stripe_price_id, tier.stripe_price_id),
         is_active = true,
         display_order = source.display_order,
         updated_at = NOW()
    FROM plan_source source
   WHERE LOWER(TRIM(tier.name)) = source.tier_key
   RETURNING LOWER(TRIM(tier.name)) AS tier_key
)
INSERT INTO pm_plan_tiers (
  name,
  description,
  base_price_usd,
  base_member_limit,
  extra_per_member_usd,
  max_total_members,
  stripe_price_id,
  is_active,
  display_order
)
SELECT
  source.tier_name,
  source.description,
  source.base_price_usd,
  source.base_member_limit,
  source.extra_per_member_usd,
  source.max_total_members,
  source.stripe_price_id,
  true,
  source.display_order
FROM plan_source source
WHERE NOT EXISTS (
  SELECT 1
  FROM updated
  WHERE updated.tier_key = source.tier_key
)
  AND NOT EXISTS (
    SELECT 1
    FROM pm_plan_tiers existing
    WHERE LOWER(TRIM(existing.name)) = source.tier_key
  );

UPDATE community_members member
   SET plan_type = CASE
     WHEN LOWER(TRIM(tier.name)) IN ('couple', 'family') THEN 'family'
     ELSE 'individual'
   END
  FROM pm_plan_tiers tier
 WHERE member.pm_tier_id = tier.id
   AND member.plan_type IS DISTINCT FROM CASE
     WHEN LOWER(TRIM(tier.name)) IN ('couple', 'family') THEN 'family'
     ELSE 'individual'
   END;
