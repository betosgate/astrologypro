-- ============================================================================
-- Seed global_pricing items and pricing_plans for:
--   1. Perennial Mandalism (Community) — 3 plans (Individual, Couple, Family)
--   2. Mystery School — 3 plans (Enrollment, Monthly, Monthly PM Discount)
--
-- Existing: professional_divination_course (already seeded in 000112)
--
-- Idempotent: ON CONFLICT DO NOTHING on all inserts.
-- ============================================================================

-- -------------------------------------------------------
-- 1. Global pricing items
-- -------------------------------------------------------

INSERT INTO global_pricing (item_key, item_name, description)
VALUES
  (
    'perennial_mandalism_community',
    'Perennial Mandalism Community',
    'Perennial Mandalism community membership — access to sacred teachings, live ceremonies, and community forums.'
  ),
  (
    'mystery_school',
    'Mystery School',
    'Mystery School enrollment and subscription — advanced esoteric training, live classes, and exclusive content.'
  )
ON CONFLICT (item_key) DO NOTHING;

-- -------------------------------------------------------
-- 2. Perennial Mandalism plans
-- -------------------------------------------------------

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_pm_individual',
  gp.id,
  'Individual Plan',
  29.99,
  39.99,
  'price_1RtmCrBcRXKECv5fhg6KUun3',
  'USD',
  'Single member access to the Perennial Mandalism community.',
  1,
  '[
    {"label": "Members", "value": "1", "slug": "members"},
    {"label": "Billing", "value": "Monthly", "slug": "billing"},
    {"label": "Live Ceremonies", "value": "Included", "slug": "live_ceremonies"},
    {"label": "Community Forum", "value": "Full Access", "slug": "community_forum"},
    {"label": "Sacred Teachings", "value": "All Modules", "slug": "sacred_teachings"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'perennial_mandalism_community'
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_pm_couple',
  gp.id,
  'Couple Plan',
  49.99,
  69.99,
  'price_1RtmCKBcRXKECv5fCP1Radka',
  'USD',
  'Two members sharing one household — joint access to the community.',
  2,
  '[
    {"label": "Members", "value": "2", "slug": "members"},
    {"label": "Billing", "value": "Monthly", "slug": "billing"},
    {"label": "Live Ceremonies", "value": "Included", "slug": "live_ceremonies"},
    {"label": "Community Forum", "value": "Full Access", "slug": "community_forum"},
    {"label": "Sacred Teachings", "value": "All Modules", "slug": "sacred_teachings"},
    {"label": "Savings", "value": "Save 17% vs 2x Individual", "slug": "savings"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'perennial_mandalism_community'
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_pm_family',
  gp.id,
  'Family Plan',
  69.99,
  99.99,
  'price_1RtmBbBcRXKECv5fun9Xjjwi',
  'USD',
  'Up to 5 family members — full household access to the community.',
  3,
  '[
    {"label": "Members", "value": "Up to 5", "slug": "members"},
    {"label": "Billing", "value": "Monthly", "slug": "billing"},
    {"label": "Live Ceremonies", "value": "Included", "slug": "live_ceremonies"},
    {"label": "Community Forum", "value": "Full Access", "slug": "community_forum"},
    {"label": "Sacred Teachings", "value": "All Modules", "slug": "sacred_teachings"},
    {"label": "Savings", "value": "Save 53% vs 5x Individual", "slug": "savings"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'perennial_mandalism_community'
ON CONFLICT (plan_id) DO NOTHING;

-- -------------------------------------------------------
-- 3. Mystery School plans
-- -------------------------------------------------------

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_mystery_enrollment',
  gp.id,
  'Enrollment (One-Time)',
  149.99,
  199.99,
  'price_1TJOXjBcRXKECv5fQ4dz7W4z',
  'USD',
  'One-time enrollment fee for Mystery School — grants lifetime access to foundational content.',
  1,
  '[
    {"label": "Type", "value": "One-Time Payment", "slug": "type"},
    {"label": "Access", "value": "Lifetime Foundation", "slug": "access"},
    {"label": "Live Classes", "value": "Included", "slug": "live_classes"},
    {"label": "Exclusive Content", "value": "Foundational Library", "slug": "exclusive_content"},
    {"label": "Certificate", "value": "Upon Completion", "slug": "certificate"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'mystery_school'
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_mystery_monthly',
  gp.id,
  'Monthly Subscription',
  49.99,
  69.99,
  'price_1TJryQBcRXKECv5fs770puzb',
  'USD',
  'Ongoing monthly access to all Mystery School content, live sessions, and advanced teachings.',
  2,
  '[
    {"label": "Type", "value": "Recurring Monthly", "slug": "type"},
    {"label": "Access", "value": "Full Library", "slug": "access"},
    {"label": "Live Classes", "value": "Unlimited", "slug": "live_classes"},
    {"label": "Exclusive Content", "value": "All Advanced Modules", "slug": "exclusive_content"},
    {"label": "Mentorship", "value": "Group Sessions", "slug": "mentorship"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'mystery_school'
ON CONFLICT (plan_id) DO NOTHING;

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_mystery_monthly_pm_discount',
  gp.id,
  'Monthly (PM Member Discount)',
  34.99,
  49.99,
  'price_1TJZCPBcRXKECv5fhwdSCyXL',
  'USD',
  'Discounted monthly rate for existing Perennial Mandalism members.',
  3,
  '[
    {"label": "Type", "value": "Recurring Monthly", "slug": "type"},
    {"label": "Eligibility", "value": "PM Members Only", "slug": "eligibility"},
    {"label": "Access", "value": "Full Library", "slug": "access"},
    {"label": "Live Classes", "value": "Unlimited", "slug": "live_classes"},
    {"label": "Exclusive Content", "value": "All Advanced Modules", "slug": "exclusive_content"},
    {"label": "Savings", "value": "Save 30% with PM membership", "slug": "savings"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'mystery_school'
ON CONFLICT (plan_id) DO NOTHING;
