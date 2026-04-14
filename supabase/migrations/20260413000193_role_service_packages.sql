CREATE TABLE IF NOT EXISTS role_service_packages (
  package_code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  allows_astrology BOOLEAN NOT NULL DEFAULT false,
  allows_tarot BOOLEAN NOT NULL DEFAULT false,
  applies_to_roles TEXT[] NOT NULL DEFAULT ARRAY['diviner', 'trainee'],
  default_for_roles TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT role_service_packages_category_guard CHECK (
    allows_astrology = true OR allows_tarot = true
  )
);

INSERT INTO role_service_packages (
  package_code,
  display_name,
  description,
  allows_astrology,
  allows_tarot,
  applies_to_roles,
  default_for_roles,
  is_active,
  sort_order
)
VALUES
  (
    'both',
    'Astrology + Tarot',
    'Allows both astrology and tarot service categories.',
    true,
    true,
    ARRAY['diviner', 'trainee'],
    ARRAY['diviner', 'trainee'],
    true,
    10
  ),
  (
    'astrology_only',
    'Astrology Only',
    'Allows astrology services only.',
    true,
    false,
    ARRAY['diviner', 'trainee'],
    ARRAY[]::TEXT[],
    true,
    20
  ),
  (
    'tarot_only',
    'Tarot Only',
    'Allows tarot services only.',
    false,
    true,
    ARRAY['diviner', 'trainee'],
    ARRAY[]::TEXT[],
    true,
    30
  )
ON CONFLICT (package_code) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  allows_astrology = EXCLUDED.allows_astrology,
  allows_tarot = EXCLUDED.allows_tarot,
  applies_to_roles = EXCLUDED.applies_to_roles,
  default_for_roles = EXCLUDED.default_for_roles,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS service_package_code TEXT REFERENCES role_service_packages(package_code) ON DELETE SET NULL;

ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS service_package_code TEXT REFERENCES role_service_packages(package_code) ON DELETE SET NULL;

ALTER TABLE diviners
  ALTER COLUMN service_package_code SET DEFAULT 'both';

ALTER TABLE trainees
  ALTER COLUMN service_package_code SET DEFAULT 'both';

UPDATE diviners
SET service_package_code = 'both'
WHERE service_package_code IS NULL;

UPDATE trainees
SET service_package_code = 'both'
WHERE service_package_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_diviners_service_package_code
  ON diviners(service_package_code);

CREATE INDEX IF NOT EXISTS idx_trainees_service_package_code
  ON trainees(service_package_code);
