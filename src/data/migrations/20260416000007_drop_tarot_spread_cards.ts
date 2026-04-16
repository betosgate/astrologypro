// Drop unused tarot_spread_cards junction table
// Relationship now uses related_spread_ids UUID[] array on tarot_cards
export const MIGRATION_SQL = `
DROP TABLE IF EXISTS tarot_spread_cards;
`;
