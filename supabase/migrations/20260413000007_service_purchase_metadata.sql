-- Phase 1 purchase/intake normalization metadata for services/products

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS product_kind text NOT NULL DEFAULT 'session'
    CHECK (product_kind IN ('session', 'report', 'subscription', 'digital', 'bundle', 'other'));

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_subscription boolean NOT NULL DEFAULT false;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS requires_birth_time boolean NOT NULL DEFAULT false;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS requires_birth_city boolean NOT NULL DEFAULT false;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS requires_partner_data boolean NOT NULL DEFAULT false;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS pre_checkout_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS post_checkout_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE services
SET
  product_kind = COALESCE(product_kind, 'session'),
  requires_birth_time = CASE
    WHEN requires_birth_data THEN true
    ELSE requires_birth_time
  END,
  requires_birth_city = CASE
    WHEN requires_birth_data THEN true
    ELSE requires_birth_city
  END,
  pre_checkout_fields = CASE
    WHEN jsonb_typeof(pre_checkout_fields) = 'array' AND jsonb_array_length(pre_checkout_fields) > 0
      THEN pre_checkout_fields
    ELSE '["full_name","email","phone"]'::jsonb
  END,
  post_checkout_fields = CASE
    WHEN jsonb_typeof(post_checkout_fields) = 'array' AND jsonb_array_length(post_checkout_fields) > 0
      THEN post_checkout_fields
    WHEN requires_birth_data
      THEN '["birth_details","focus_question","additional_notes"]'::jsonb
    ELSE '["focus_question","additional_notes"]'::jsonb
  END;
