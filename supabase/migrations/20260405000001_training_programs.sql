-- Training Programs: top-level training entity that groups categories
-- training_id is required on training_categories (NOT NULL)

CREATE TABLE IF NOT EXISTS training_programs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  priority    INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

-- Admins (service_role) can do everything; authenticated users can read active programs
CREATE POLICY "service_role_training_programs"
  ON training_programs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read_training_programs"
  ON training_programs FOR SELECT TO authenticated
  USING (is_active = true);

-- Add training_id to training_categories (required)
ALTER TABLE training_categories
  ADD COLUMN IF NOT EXISTS training_id UUID REFERENCES training_programs(id) ON DELETE RESTRICT;

-- Back-fill any existing categories into a "General" program
DO $$
DECLARE v_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM training_categories WHERE training_id IS NULL) THEN
    INSERT INTO training_programs (name, description, priority, is_active)
    VALUES ('General', 'Default training program for existing categories.', 0, true)
    RETURNING id INTO v_id;

    UPDATE training_categories SET training_id = v_id WHERE training_id IS NULL;
  END IF;
END $$;

-- Enforce NOT NULL now that all rows are back-filled
ALTER TABLE training_categories
  ALTER COLUMN training_id SET NOT NULL;

-- Index for fast lookup by program
CREATE INDEX IF NOT EXISTS idx_training_categories_training_id
  ON training_categories(training_id);
