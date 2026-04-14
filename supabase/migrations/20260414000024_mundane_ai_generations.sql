-- mundane_ai_generations
-- Tracks every AI generation made in the mundane astrology module.
-- Supports universal audit trail, saved generations, and cross-subject linking.

CREATE TABLE IF NOT EXISTS mundane_ai_generations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  aspect_type     TEXT        NOT NULL DEFAULT 'general',

  -- what was generated against
  subject_type    TEXT,        -- 'entity' | 'forecast' | 'leader' | 'event' | 'chart' | 'report' | 'general'
  subject_id      UUID,        -- optional FK to the subject record
  subject_label   TEXT,        -- human readable label e.g. "Entity: United States"

  -- the generation
  prompt          TEXT        NOT NULL,
  context_used    TEXT,        -- context string fed to the AI
  response        TEXT        NOT NULL,

  -- metadata
  model           TEXT,
  tokens_used     INTEGER,
  duration_ms     INTEGER,

  -- save state
  is_saved        BOOLEAN     NOT NULL DEFAULT FALSE,
  saved_to_type   TEXT,        -- 'forecast_narrative' | 'entity_notes' | 'report_block' | etc.
  saved_to_id     UUID,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_gen_user
  ON mundane_ai_generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_gen_subject
  ON mundane_ai_generations(subject_type, subject_id)
  WHERE subject_id IS NOT NULL;

ALTER TABLE mundane_ai_generations ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own generations
CREATE POLICY "ai_gen_owner"
  ON mundane_ai_generations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role has unrestricted access (for admin APIs)
CREATE POLICY "ai_gen_service"
  ON mundane_ai_generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
