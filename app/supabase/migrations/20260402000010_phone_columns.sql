-- Fix services.category constraint to allow phone readings
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;
ALTER TABLE services ADD CONSTRAINT services_category_check
  CHECK (category IN ('astrology', 'tarot', 'phone', 'freelance'));

-- Add phone answer mode columns to diviners
ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS phone_mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone_answer_mode VARCHAR(20) DEFAULT 'both'
    CHECK (phone_answer_mode IN ('mobile', 'browser', 'both'));
