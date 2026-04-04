-- Affiliate agreement e-sign tracking on diviners
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS affiliate_agreement_signed     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_agreement_signed_at  timestamptz;
