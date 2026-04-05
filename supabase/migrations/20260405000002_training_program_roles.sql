-- Add role-based access control to training programs
-- allowed_roles TEXT[] — empty = unrestricted (all authenticated users)
--                        populated = only users whose role slug is in the array

ALTER TABLE training_programs
  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_training_programs_allowed_roles
  ON training_programs USING GIN(allowed_roles);

-- Seed standard platform roles into the roles table (upsert-safe)
INSERT INTO roles (role_name, slug, description, priority, status) VALUES
  ('Trainee',               'is_trainee',              'Apprentices enrolled in training under a diviner mentor.',         1,  'active'),
  ('Astrologer / Diviner',  'is_astrologer',            'Certified diviners and astrologers on the platform.',              2,  'active'),
  ('Tarot Reader',          'is_tarotreader',           'Certified tarot readers on the platform.',                         3,  'active'),
  ('Astrologer & Tarot',    'is_astrologer_tarotreader','Practitioners certified in both astrology and tarot.',             4,  'active'),
  ('Customer',              'is_customer',              'Clients who book sessions with diviners.',                         5,  'active'),
  ('Social Advocate',       'is_social_advo',           'Social advocates who promote diviners and earn commissions.',      6,  'active'),
  ('Customer + Advocate',   'is_customer_socialadvo',   'Users who are both a client and a social advocate.',               7,  'active'),
  ('Affiliate',             'is_affiliate',             'Affiliate partners linked to a diviner.',                          8,  'active'),
  ('Perennial Mandalism',   'is_Perennial_Mandalism',   'Members enrolled in the Perennial Mandalism community program.',   9,  'active'),
  ('Mystery School',        'is_mystery_school',        'Members enrolled in the Mystery School community program.',        10, 'active'),
  ('Admin',                 'is_admin',                 'Platform administrators.',                                         0,  'active')
ON CONFLICT (slug) DO NOTHING;
