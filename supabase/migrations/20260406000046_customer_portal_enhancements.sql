-- Customer portal enhancements: orders v2 columns, intake submissions, client subscriptions
-- The orders table already exists from 20260404000022_new_admin_modules.sql with a simpler schema.
-- We add new columns needed by the portal and create companion tables.

-- Add portal-specific columns to orders if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_title text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'one_time' CHECK (product_type IN ('one_time','subscription','recurring'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS intake_submitted_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Ensure client_id and diviner_id are NOT NULL for portal queries
-- (original schema has them nullable; we cannot change constraint without data risk, leave as-is)

-- Portal-specific indexes
CREATE INDEX IF NOT EXISTS orders_client_id_created_idx ON orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_diviner_status_created_idx ON orders(diviner_id, status, created_at DESC);

-- Portal status values expected by the UI — we cannot modify the existing CHECK constraint
-- without dropping and recreating it. Instead, we document the extended status values and
-- rely on application-layer enforcement. The existing check allows: 'pending','completed','refunded','cancelled'.
-- The portal uses additional values; remove the constraint and replace with a broader one.
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending','completed','refunded','cancelled',
    'pending_payment','paid','awaiting_intake','intake_submitted','in_progress','scheduled','delivered'
  )
);

-- Add client-readable RLS policy for orders (admin policy exists; add client policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'clients_read_own_orders'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "clients_read_own_orders"
        ON orders FOR SELECT
        USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'orders'
      AND policyname = 'diviners_read_their_orders'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_their_orders"
        ON orders FOR SELECT
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Intake submissions for orders
CREATE TABLE IF NOT EXISTS order_intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE order_intake_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'order_intake_submissions'
      AND policyname = 'clients_manage_own_intake'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "clients_manage_own_intake"
        ON order_intake_submissions FOR ALL
        USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'order_intake_submissions'
      AND policyname = 'diviners_read_order_intake'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_read_order_intake"
        ON order_intake_submissions FOR SELECT
        USING (order_id IN (
          SELECT id FROM orders WHERE diviner_id IN (
            SELECT id FROM diviners WHERE user_id = auth.uid()
          )
        ))
    $p$;
  END IF;
END $$;

-- Client subscriptions (tracks active weekly/recurring subscriptions per client)
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  product_id uuid REFERENCES weekly_subscription_products(id) ON DELETE SET NULL,
  subscription_type text NOT NULL DEFAULT 'weekly_updates' CHECK (subscription_type IN ('weekly_updates','other')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','paused')),
  stripe_subscription_id text,
  stripe_customer_id text,
  amount_cents integer NOT NULL DEFAULT 1000,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cs_client_idx ON client_subscriptions(client_id, status);
CREATE INDEX IF NOT EXISTS cs_diviner_idx ON client_subscriptions(diviner_id, status);

ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'client_subscriptions'
      AND policyname = 'clients_read_own_subscriptions'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "clients_read_own_subscriptions"
        ON client_subscriptions FOR SELECT
        USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;
