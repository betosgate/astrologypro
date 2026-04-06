-- Plan definitions (managed by admin)
CREATE TABLE diviner_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  billing_interval text NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month','year')),
  stripe_price_id text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb, -- list of feature keys included
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default plans
INSERT INTO diviner_plans (name, slug, description, price_cents, features, sort_order) VALUES
  ('Starter', 'starter', 'Basic access to diviner back office and public profile', 9900,
   '["public_profile","product_catalog","booking_system","customer_management","testimonials","media_gallery"]', 1),
  ('Professional', 'professional', 'Everything in Starter plus live stream tools and check-in system', 9900,
   '["public_profile","product_catalog","booking_system","customer_management","testimonials","media_gallery","live_sessions","check_in","giveaways","affiliate_management","analytics"]', 2)
ON CONFLICT (slug) DO NOTHING;

-- Add-ons
CREATE TABLE diviner_plan_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  billing_interval text NOT NULL DEFAULT 'month',
  stripe_price_id text,
  feature_key text NOT NULL, -- the feature this unlocks
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO diviner_plan_addons (name, slug, description, price_cents, feature_key) VALUES
  ('AI Question Helper', 'ai_question_helper', 'AI-powered question suggestions during live readings', 3000, 'ai_question_helper')
ON CONFLICT (slug) DO NOTHING;

-- Diviner plan subscriptions
CREATE TABLE diviner_plan_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES diviner_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','cancelled','suspended')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(diviner_id)
);

CREATE INDEX IF NOT EXISTS dps_diviner_idx ON diviner_plan_subscriptions(diviner_id, status);
CREATE INDEX IF NOT EXISTS dps_stripe_idx ON diviner_plan_subscriptions(stripe_subscription_id);

ALTER TABLE diviner_plan_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'diviner_plan_subscriptions'
      AND policyname = 'diviners_read_own_plan'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_own_plan"
        ON diviner_plan_subscriptions FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Active add-ons per diviner
CREATE TABLE diviner_active_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES diviner_plan_addons(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  stripe_subscription_item_id text,
  activated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  UNIQUE(diviner_id, addon_id)
);

ALTER TABLE diviner_active_addons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'diviner_active_addons'
      AND policyname = 'diviners_read_own_addons'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_own_addons"
        ON diviner_active_addons FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Invoices for diviner SaaS billing
CREATE TABLE diviner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  stripe_invoice_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  invoice_type text NOT NULL DEFAULT 'subscription' CHECK (invoice_type IN ('subscription','addon','telephony','manual')),
  description text,
  period_start timestamptz,
  period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  invoice_url text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS di_diviner_idx ON diviner_invoices(diviner_id, created_at DESC);

ALTER TABLE diviner_invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'diviner_invoices'
      AND policyname = 'diviners_read_own_invoices'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_own_invoices"
        ON diviner_invoices FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Telephony usage charges
CREATE TABLE telephony_usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  session_id uuid, -- optional reference to booking/video session
  duration_seconds integer NOT NULL DEFAULT 0,
  participant_count integer NOT NULL DEFAULT 1,
  rate_per_minute numeric(10,6) NOT NULL DEFAULT 0.022, -- pass-through rate
  amount_cents integer NOT NULL DEFAULT 0,
  billed_at timestamptz,
  invoice_id uuid REFERENCES diviner_invoices(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tur_diviner_idx ON telephony_usage_records(diviner_id, created_at DESC);

ALTER TABLE telephony_usage_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'telephony_usage_records'
      AND policyname = 'diviners_read_own_telephony'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_own_telephony"
        ON telephony_usage_records FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;
