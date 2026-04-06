-- ============================================================
-- Training Sequential Lock + Role Access Settings
-- build: 2026-04-06
-- ============================================================

-- Add sequential lock to programs (category order is enforced)
ALTER TABLE training_programs
  ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN NOT NULL DEFAULT false;

-- Add sequential lock to categories (lesson order is enforced)
ALTER TABLE training_categories
  ADD COLUMN IF NOT EXISTS is_sequential BOOLEAN NOT NULL DEFAULT false;

-- Global training center settings (single-row config)
CREATE TABLE IF NOT EXISTS training_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   UUID
);

-- Seed one default row if empty
INSERT INTO training_settings (allowed_roles)
SELECT '{}'
WHERE NOT EXISTS (SELECT 1 FROM training_settings);

-- RLS: service_role manages, authenticated can read
ALTER TABLE training_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_training_settings"  ON training_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_training_settings" ON training_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
