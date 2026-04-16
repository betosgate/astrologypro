// Bundled mirror of supabase/migrations/20260416000001_tarot_dynamic_system.sql
export const MIGRATION_SQL = `-- ============================================================
-- Tarot Dynamic System Migration
-- Adds missing columns, creates junction table for card-spread linking
-- ============================================================

-- Add missing columns to tarot_cards
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE tarot_cards ADD COLUMN IF NOT EXISTS related_spread_ids UUID[];

-- Add image_url to tarot_spreads for spread thumbnail
ALTER TABLE tarot_spreads ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Junction table: tarot_spread_cards (many-to-many card-to-spread linking)
CREATE TABLE IF NOT EXISTS tarot_spread_cards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spread_id  UUID NOT NULL REFERENCES tarot_spreads(id) ON DELETE CASCADE,
  card_id    UUID NOT NULL REFERENCES tarot_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(spread_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_tarot_spread_cards_spread ON tarot_spread_cards(spread_id);
CREATE INDEX IF NOT EXISTS idx_tarot_spread_cards_card   ON tarot_spread_cards(card_id);

ALTER TABLE tarot_spread_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tarot_spread_cards' AND policyname = 'service_tarot_spread_cards') THEN
    CREATE POLICY service_tarot_spread_cards ON tarot_spread_cards FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tarot_spread_cards' AND policyname = 'public_read_tarot_spread_cards') THEN
    CREATE POLICY public_read_tarot_spread_cards ON tarot_spread_cards FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tarot_spread_cards' AND policyname = 'anon_read_tarot_spread_cards') THEN
    CREATE POLICY anon_read_tarot_spread_cards ON tarot_spread_cards FOR SELECT TO anon USING (true);
  END IF;
END $$;
`;
