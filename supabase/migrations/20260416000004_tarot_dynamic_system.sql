-- ============================================================
-- Tarot Dynamic System Migration
-- Adds missing columns, creates junction table, cleans old data
-- ============================================================

-- ── Add missing columns to tarot_cards ──────────────────────────────────────
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS related_spread_ids UUID[];

-- ── Add missing columns to tarot_spreads ────────────────────────────────────
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── Junction table: tarot_spread_cards ───────────────────────────────────────
-- Links specific cards to specific spreads (many-to-many)
CREATE TABLE IF NOT EXISTS tarot_spread_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spread_id  UUID NOT NULL REFERENCES tarot_spreads(id) ON DELETE CASCADE,
  card_id    UUID NOT NULL REFERENCES tarot_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(spread_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_tarot_spread_cards_spread ON tarot_spread_cards(spread_id);
CREATE INDEX IF NOT EXISTS idx_tarot_spread_cards_card   ON tarot_spread_cards(card_id);

-- RLS for junction table
ALTER TABLE tarot_spread_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_tarot_spread_cards" ON tarot_spread_cards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_read_tarot_spread_cards" ON tarot_spread_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_read_tarot_spread_cards" ON tarot_spread_cards FOR SELECT TO anon USING (true);
