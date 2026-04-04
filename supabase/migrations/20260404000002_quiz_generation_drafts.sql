-- Stores AI-generated quiz drafts before admin reviews and saves them.
CREATE TABLE IF NOT EXISTS quiz_generation_drafts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID        REFERENCES training_lessons(id) ON DELETE SET NULL,
  filename      TEXT        NOT NULL,
  slide_text    TEXT        NOT NULL,            -- extracted text from PPTX
  draft_json    JSONB       NOT NULL DEFAULT '[]', -- array of {question, options:[{text,correct}]}
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'discarded')),
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

ALTER TABLE quiz_generation_drafts ENABLE ROW LEVEL SECURITY;

-- Only service_role (admin API routes) can access
CREATE POLICY "service_role_quiz_drafts" ON quiz_generation_drafts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS quiz_drafts_lesson_idx ON quiz_generation_drafts (lesson_id);
CREATE INDEX IF NOT EXISTS quiz_drafts_status_idx ON quiz_generation_drafts (status);
