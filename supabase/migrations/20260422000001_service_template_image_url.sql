ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS image_url TEXT;
