-- Certificate Config table
-- Allows admin to manage certificate content (school name, programs, designation, head master)
-- without code deployments.

CREATE TABLE IF NOT EXISTS certificate_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name         text NOT NULL DEFAULT 'School of Our Divine Infinite Being',
  school_tagline      text NOT NULL DEFAULT 'Polytheistic Monism · Divine Theurgy · Oracle to the Gods',
  designation_title   text NOT NULL DEFAULT 'Certified Divination Consultant',
  program_title       text NOT NULL DEFAULT 'Astrology & Tarot Consulting Certification Course',
  head_master_name    text NOT NULL DEFAULT 'Eddie Paredes',
  study_hours         text NOT NULL DEFAULT '100+',
  live_classroom_hours text NOT NULL DEFAULT '30',
  live_readings        text NOT NULL DEFAULT '20+',
  certification_count  text NOT NULL DEFAULT '15',
  astrology_programs  jsonb NOT NULL DEFAULT '[]',
  tarot_programs      jsonb NOT NULL DEFAULT '[]',
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Only one active config at a time
CREATE UNIQUE INDEX certificate_config_active_idx ON certificate_config (is_active) WHERE is_active = true;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_certificate_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER certificate_config_updated_at
  BEFORE UPDATE ON certificate_config
  FOR EACH ROW EXECUTE FUNCTION update_certificate_config_updated_at();

-- Seed with the current hardcoded values from trainee/certificate/page.tsx
INSERT INTO certificate_config (
  school_name,
  school_tagline,
  designation_title,
  program_title,
  head_master_name,
  study_hours,
  live_classroom_hours,
  live_readings,
  certification_count,
  astrology_programs,
  tarot_programs,
  is_active
) VALUES (
  'School of Our Divine Infinite Being',
  'Polytheistic Monism · Divine Theurgy · Oracle to the Gods',
  'Certified Divination Consultant',
  'Astrology & Tarot Consulting Certification Course',
  'Eddie Paredes',
  '100+',
  '30',
  '20+',
  '15',
  '[
    "Natal Chart Reading",
    "Solar Return",
    "Monthly Transit & Lunar Return",
    "Weekly Transits",
    "Romantic Relationship Reading",
    "Friendship Relationship Reading",
    "Business Relationship Reading",
    "Predictive Event (Horary)"
  ]'::jsonb,
  '[
    "3-Card Basic Question Spread",
    "5-Card Complex Question Spread",
    "7-Card Six-Month Forward Review",
    "7-Card Horseshoe Spread",
    "10-Card Relationship Spread",
    "10-Card Celtic Cross",
    "12-Card Astrological Spread"
  ]'::jsonb,
  true
);

-- RLS: only admins (service role) can write; trainee page uses service role client
ALTER TABLE certificate_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON certificate_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_read" ON certificate_config
  FOR SELECT
  TO authenticated
  USING (true);
