-- ============================================================================
-- Seed global_pricing items and pricing_plans for:
--   1. Perennial Mandalism (Community) — 3 plans (Individual, Couple, Family)
--   2. Mystery School — 2 plans (Monthly, Monthly PM Discount) each with one-time enrollment built in
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

-- NOTE: No separate enrollment plan — one-time fee is configured as
-- onetime_amount on each monthly plan via the admin pricing UI.

INSERT INTO pricing_plans (plan_id, item_id, display_name, amount, mrp, stripe_price_id, currency, description, sort_order, custom_fields)
SELECT
  'plan_mystery_monthly',
  gp.id,
  'Monthly Subscription',
  27.00,
  97.00,
  'price_1TJryQBcRXKECv5fs770puzb',
  'USD',
  'Ongoing monthly access to all Mystery School content, live sessions, and advanced teachings. Includes $97 one-time enrollment fee.',
  1,
  '[
    {"label": "Type", "value": "Recurring Monthly", "slug": "type"},
    {"label": "Enrollment", "value": "$97 One-Time", "slug": "enrollment"},
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
  17.03,
  49.99,
  'price_1TJZCPBcRXKECv5fhwdSCyXL',
  'USD',
  'Discounted monthly rate for existing Perennial Mandalism members. Includes $97 one-time enrollment fee.',
  2,
  '[
    {"label": "Type", "value": "Recurring Monthly", "slug": "type"},
    {"label": "Enrollment", "value": "$97 One-Time", "slug": "enrollment"},
    {"label": "Eligibility", "value": "PM Members Only", "slug": "eligibility"},
    {"label": "Access", "value": "Full Library", "slug": "access"},
    {"label": "Live Classes", "value": "Unlimited", "slug": "live_classes"},
    {"label": "Exclusive Content", "value": "All Advanced Modules", "slug": "exclusive_content"},
    {"label": "Savings", "value": "Save 37% with PM membership", "slug": "savings"}
  ]'::jsonb
FROM global_pricing gp
WHERE gp.item_key = 'mystery_school'
ON CONFLICT (plan_id) DO NOTHING;
