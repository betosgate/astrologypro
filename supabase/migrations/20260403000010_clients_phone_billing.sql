-- Add Stripe fields to clients table for standalone phone call billing
-- Required to re-enable the card-on-file phone reading flow in twilio/voice/incoming

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS stripe_customer_id        text,
  ADD COLUMN IF NOT EXISTS default_payment_method_id text;

CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id
  ON clients(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
