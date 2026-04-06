CREATE TABLE training_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('program', 'category', 'lesson')),
  entity_id   UUID        NOT NULL,
  content     TEXT        NOT NULL,
  created_by  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX training_notes_entity_idx ON training_notes (entity_type, entity_id);

ALTER TABLE training_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_training_notes"
  ON training_notes FOR ALL TO service_role
  USING (true) WITH CHECK (true);
