-- Drop unused tarot_spread_cards junction table
-- Relationship now uses related_spread_ids UUID[] array on tarot_cards
DROP TABLE IF EXISTS tarot_spread_cards;
