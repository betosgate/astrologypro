-- Track which plan (tarot | astrology | both) a diviner is subscribed to
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS plan_id VARCHAR(20);
