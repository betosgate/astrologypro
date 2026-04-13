ALTER TABLE public.weekly_subscription_deliveries
  ADD COLUMN IF NOT EXISTS attempted_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS failed_recipient_count integer NOT NULL DEFAULT 0;

DO $$
DECLARE
  current_constraint text;
BEGIN
  SELECT conname
  INTO current_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.weekly_subscription_deliveries'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF current_constraint IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.weekly_subscription_deliveries DROP CONSTRAINT %I',
      current_constraint
    );
  END IF;

  ALTER TABLE public.weekly_subscription_deliveries
    ADD CONSTRAINT weekly_subscription_deliveries_status_check
    CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled', 'failed'));
END $$;
