-- Cancel / refund audit fields on bookings.
--
-- The `bookings` table already tracks canceled_at, cancellation_reason,
-- refund_amount, refunded_at, refund_reason. Surface the rest of the
-- audit so the booking drawer can answer "who cancelled, who refunded,
-- which Stripe refund was it" without joining `refund_events`.
--
-- Additive only. No existing columns are dropped or renamed.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS canceled_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canceled_by_role text,
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refunded_by_role text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'bookings_canceled_by_role_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_canceled_by_role_check
      CHECK (canceled_by_role IS NULL OR canceled_by_role IN ('admin', 'diviner', 'client', 'system'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'bookings_refunded_by_role_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_refunded_by_role_check
      CHECK (refunded_by_role IS NULL OR refunded_by_role IN ('admin', 'diviner', 'system'));
  END IF;
END $$;
