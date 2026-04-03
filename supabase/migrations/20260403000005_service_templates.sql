-- diviner_services: stores each diviner's selected service templates with custom prices
-- service_templates already exists (seeded in 20260331000003_seed_services.sql)

CREATE TABLE IF NOT EXISTS diviner_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES service_templates(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(diviner_id, template_id)
);

ALTER TABLE diviner_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviner_services_owner" ON diviner_services FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
