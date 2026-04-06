-- Tarot reading history
CREATE TABLE IF NOT EXISTS tarot_readings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  spread_id    TEXT NOT NULL,           -- matches id from tarot-spreads.ts
  spread_name  TEXT NOT NULL,
  cards        JSONB NOT NULL,          -- array of { position, position_name, card_name, is_reversed, keywords, meaning }
  notes        TEXT,                    -- user's personal notes on this reading
  share_token  TEXT UNIQUE,             -- for shareable link (generated on share)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarot_readings_user    ON tarot_readings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_share   ON tarot_readings(share_token) WHERE share_token IS NOT NULL;

ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tarot_readings_select" ON tarot_readings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own_tarot_readings_insert" ON tarot_readings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own_tarot_readings_update" ON tarot_readings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "public_shared_reading"     ON tarot_readings FOR SELECT TO anon USING (share_token IS NOT NULL);
CREATE POLICY "service_tarot_readings"    ON tarot_readings FOR ALL    TO service_role USING (true) WITH CHECK (true);
