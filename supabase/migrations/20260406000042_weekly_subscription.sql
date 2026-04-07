-- Weekly subscription product for diviners
CREATE TABLE weekly_subscription_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  stripe_price_id text, -- recurring price in Stripe
  stripe_product_id text,
  title text NOT NULL DEFAULT 'Weekly Personalized Updates',
  description text,
  price_cents integer NOT NULL DEFAULT 1000, -- $10/month
  currency text NOT NULL DEFAULT 'usd',
  is_active boolean NOT NULL DEFAULT false,
  subscriber_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(diviner_id)
);

CREATE INDEX IF NOT EXISTS weekly_sub_products_diviner_idx ON weekly_subscription_products(diviner_id);

ALTER TABLE weekly_subscription_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'weekly_subscription_products'
      AND policyname = 'diviners_manage_own_weekly_product'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_manage_own_weekly_product"
        ON weekly_subscription_products FOR ALL
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'weekly_subscription_products'
      AND policyname = 'public_read_active_weekly_products'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "public_read_active_weekly_products"
        ON weekly_subscription_products FOR SELECT
        USING (is_active = true)
    $p$;
  END IF;
END $$;

-- Subscriber records
CREATE TABLE weekly_subscription_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES weekly_subscription_products(id) ON DELETE CASCADE,
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  email text NOT NULL,
  name text,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','unpaid')),
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_sub_product_idx ON weekly_subscription_subscribers(product_id, status);
CREATE INDEX IF NOT EXISTS weekly_sub_subscribers_diviner_idx ON weekly_subscription_subscribers(diviner_id, status);
CREATE INDEX IF NOT EXISTS weekly_sub_email_idx ON weekly_subscription_subscribers(email);

ALTER TABLE weekly_subscription_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'weekly_subscription_subscribers'
      AND policyname = 'diviners_read_own_subscribers'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_own_subscribers"
        ON weekly_subscription_subscribers FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Weekly content deliveries
CREATE TABLE weekly_subscription_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES weekly_subscription_products(id) ON DELETE CASCADE,
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  subject text NOT NULL,
  content text NOT NULL,
  content_blocks jsonb DEFAULT '[]'::jsonb,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_delivery_product_idx ON weekly_subscription_deliveries(product_id, scheduled_for DESC);

ALTER TABLE weekly_subscription_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'weekly_subscription_deliveries'
      AND policyname = 'diviners_manage_own_deliveries'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_manage_own_deliveries"
        ON weekly_subscription_deliveries FOR ALL
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;
