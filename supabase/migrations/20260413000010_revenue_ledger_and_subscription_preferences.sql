ALTER TABLE public.weekly_subscription_subscribers
  ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opted_out_at timestamptz;

CREATE TABLE IF NOT EXISTS public.revenue_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('booking', 'weekly_subscription', 'weekly_subscription_invoice', 'gift_certificate', 'telephony')),
  source_reference text NOT NULL,
  source_id uuid,
  diviner_id uuid REFERENCES public.diviners(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  product_id uuid,
  gross_amount_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  diviner_gross_amount_cents integer NOT NULL DEFAULT 0,
  affiliate_commission_cents integer NOT NULL DEFAULT 0,
  diviner_net_amount_cents integer NOT NULL DEFAULT 0,
  platform_net_amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  recognized_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_reference)
);

CREATE INDEX IF NOT EXISTS revenue_ledger_diviner_idx
  ON public.revenue_ledger_entries(diviner_id, recognized_at DESC);

CREATE INDEX IF NOT EXISTS revenue_ledger_client_idx
  ON public.revenue_ledger_entries(client_id, recognized_at DESC);

ALTER TABLE public.revenue_ledger_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'revenue_ledger_entries'
      AND policyname = 'diviners_read_own_revenue_ledger'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "diviners_read_own_revenue_ledger"
      ON public.revenue_ledger_entries
      FOR SELECT
      USING (diviner_id IN (SELECT id FROM public.diviners WHERE user_id = auth.uid()))
    $policy$;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_revenue_ledger_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revenue_ledger_updated_at ON public.revenue_ledger_entries;
CREATE TRIGGER trg_revenue_ledger_updated_at
BEFORE UPDATE ON public.revenue_ledger_entries
FOR EACH ROW
EXECUTE FUNCTION public.touch_revenue_ledger_updated_at();
