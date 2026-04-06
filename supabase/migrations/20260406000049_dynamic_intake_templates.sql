-- Intake templates — one per product/service type
CREATE TABLE IF NOT EXISTS intake_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- fields shape: [{ id, type, label, placeholder, required, options, help_text, sort_order }]
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS it_diviner_idx ON intake_templates(diviner_id);

ALTER TABLE intake_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='intake_templates' AND policyname='diviners_manage_own_templates') THEN
    EXECUTE $p$
      CREATE POLICY "diviners_manage_own_templates" ON intake_templates FOR ALL
      USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

-- Link services/products to intake templates
ALTER TABLE services ADD COLUMN IF NOT EXISTS intake_template_id uuid REFERENCES intake_templates(id) ON DELETE SET NULL;

-- updated_at trigger for intake_templates
CREATE OR REPLACE FUNCTION update_intake_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_intake_templates_updated_at ON intake_templates;
CREATE TRIGGER set_intake_templates_updated_at
  BEFORE UPDATE ON intake_templates
  FOR EACH ROW EXECUTE FUNCTION update_intake_templates_updated_at();

-- Field types reference (comment only — not a DB table):
-- text, textarea, email, date, time, select, checkbox, birth_details (composite), partner_birth_details
-- birth_details expands to: birth_date + birth_time + birth_city
-- partner_birth_details expands to: partner_birth_date + partner_birth_time + partner_birth_city
