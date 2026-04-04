-- Certified Diviner Badge
-- Tracks whether a diviner has been manually certified by admin
-- (activation is manual until the training school graduation triggers it automatically)

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS is_certified    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS certified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certified_by    TEXT;  -- admin email who awarded it

CREATE INDEX IF NOT EXISTS diviners_is_certified_idx ON diviners(is_certified) WHERE is_certified = true;
