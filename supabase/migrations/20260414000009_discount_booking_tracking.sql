-- Add discount tracking fields to bookings
-- Allows diviners to see which discount rule was applied and how much was saved

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS discount_rule_id UUID REFERENCES discount_rules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount_saved DECIMAL(10,2) DEFAULT 0;

-- Index for fast per-rule usage queries
CREATE INDEX IF NOT EXISTS idx_bookings_discount_rule
  ON bookings(discount_rule_id)
  WHERE discount_rule_id IS NOT NULL;

-- Index for diviner + discount queries (filter + group by pattern)
CREATE INDEX IF NOT EXISTS idx_bookings_diviner_discount
  ON bookings(diviner_id, discount_rule_id)
  WHERE discount_rule_id IS NOT NULL;
