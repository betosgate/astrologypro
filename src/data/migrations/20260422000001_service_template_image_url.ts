export const MIGRATION_SQL = `
ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS image_url TEXT;
`;
