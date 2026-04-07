-- ─────────────────────────────────────────────────────────────────────────────
-- Platform seed data
-- Idempotent: all inserts use ON CONFLICT DO NOTHING
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- Diviner SaaS Plans
-- diviner_plans has no diviner_id — safe to seed as a public product catalog.
-- The original migration already seeded Starter and Professional with
-- price_cents=9900. We upsert all three tiers here with the correct prices
-- and feature sets as defined in the product spec.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO diviner_plans (name, slug, description, price_cents, features, billing_interval, is_active, sort_order)
VALUES
  (
    'Starter',
    'starter',
    'Get started with a public profile, bookings, and basic analytics.',
    0,
    '["5_bookings_per_month","basic_analytics","public_profile"]'::jsonb,
    'month',
    true,
    1
  ),
  (
    'Professional',
    'professional',
    'Everything in Starter plus video sessions, intake builder, and weekly subscriptions.',
    4900,
    '["unlimited_bookings","advanced_analytics","video_sessions","intake_builder","weekly_subscriptions"]'::jsonb,
    'month',
    true,
    2
  ),
  (
    'Elite',
    'elite',
    'Everything in Professional plus phone readings, priority support, and white-label.',
    9900,
    '["unlimited_bookings","advanced_analytics","video_sessions","intake_builder","weekly_subscriptions","phone_readings","priority_support","white_label"]'::jsonb,
    'month',
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Diviner Plan Add-ons
-- diviner_plan_addons has no diviner_id — safe to seed.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO diviner_plan_addons (name, slug, description, price_cents, feature_key, billing_interval, is_active)
VALUES
  (
    'Phone Readings',
    'phone-readings',
    'Enable phone-based readings billed per minute with automatic invoicing.',
    1900,
    'phone_readings',
    'month',
    true
  ),
  (
    'Priority Support',
    'priority-support',
    'Get priority email and chat support with a guaranteed 4-hour response SLA.',
    900,
    'priority_support',
    'month',
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Giveaways
-- giveaways.diviner_id is NOT NULL REFERENCES diviners(id).
-- There are no seeded diviner rows in this environment, so inserting here
-- would violate the foreign-key constraint. Seed skipped.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- Media Items
-- media_items.diviner_id is NOT NULL REFERENCES diviners(id).
-- Seed skipped per spec: "If media_items has diviner_id as NOT NULL, skip."
-- ─────────────────────────────────────────────────────────────────────────────
