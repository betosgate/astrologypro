-- Migration: stripe_saas_billing
-- Adds stripe_customer_id to diviners for SaaS plan billing linkage.
-- All SaaS plan tables (diviner_plans, diviner_plan_subscriptions, etc.)
-- already exist from migration 044.

ALTER TABLE diviners ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS diviners_stripe_customer_idx ON diviners(stripe_customer_id);
