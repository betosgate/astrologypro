CREATE TABLE IF NOT EXISTS public.refund_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  diviner_id uuid REFERENCES public.diviners(id) ON DELETE SET NULL,
  order_reference text,
  payment_intent_id text,
  provider_refund_id text,
  initiated_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  initiated_by_role text NOT NULL CHECK (initiated_by_role IN ('admin', 'diviner', 'system')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  reason text,
  status text NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed', 'reversed')),
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS refund_events_booking_idx
  ON public.refund_events(booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refund_events_diviner_idx
  ON public.refund_events(diviner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refund_events_created_idx
  ON public.refund_events(created_at DESC);

ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'refund_events'
      AND policyname = 'service_role_refund_events'
  ) THEN
    CREATE POLICY "service_role_refund_events"
      ON public.refund_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_refund_events_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refund_events_updated_at ON public.refund_events;
CREATE TRIGGER trg_refund_events_updated_at
BEFORE UPDATE ON public.refund_events
FOR EACH ROW
EXECUTE FUNCTION public.touch_refund_events_updated_at();
