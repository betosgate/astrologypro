-- PayPal Connect fields on diviners
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS paypal_merchant_id   text,
  ADD COLUMN IF NOT EXISTS paypal_email         text,
  ADD COLUMN IF NOT EXISTS paypal_onboarded     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS paypal_onboarded_at  timestamptz;
