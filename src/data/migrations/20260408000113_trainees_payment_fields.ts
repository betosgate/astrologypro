// AUTO-GENERATED bundled mirror of supabase/migrations/20260408000113_trainees_payment_fields.sql
// Used by /api/admin/db/migrate so the deployed function does not need filesystem access.

export const MIGRATION_SQL = `-- ============================================================================
-- Diviner signup payment tracking columns on the trainees table.
--
-- The Stripe webhook (handleDivinerSignupPaymentSucceeded) writes
-- payment_intent_id and paid_at after a successful one-time charge for the
-- Professional Divination Course. The new diviner-signup payment modal
-- expects these fields to exist.
--
-- Additive only — every column is nullable so existing rows are unaffected.
-- The webhook logs a warning instead of failing if the fields are missing,
-- but applying this migration removes that warning and lets the data flow
-- end-to-end.
-- ============================================================================

ALTER TABLE public.trainees
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affiliate_id      TEXT;

CREATE INDEX IF NOT EXISTS idx_trainees_payment_intent_id
  ON public.trainees (payment_intent_id);

COMMENT ON COLUMN public.trainees.payment_intent_id IS
  'Stripe PaymentIntent id for the Professional Divination Course one-time charge. Set by the diviner-signup webhook handler.';
COMMENT ON COLUMN public.trainees.paid_at IS
  'Timestamp when the diviner-signup payment was confirmed by Stripe.';
COMMENT ON COLUMN public.trainees.affiliate_id IS
  'Optional affiliate id captured at signup time from the affiliatid query param.';
`;
