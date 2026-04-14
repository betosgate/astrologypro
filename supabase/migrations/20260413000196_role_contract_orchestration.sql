ALTER TABLE signed_agreement_artifacts
  ADD COLUMN IF NOT EXISTS contract_template_id uuid,
  ADD COLUMN IF NOT EXISTS role_key text;

CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_key text NOT NULL UNIQUE,
  title text NOT NULL,
  role_scope text[] NOT NULL DEFAULT ARRAY[]::text[],
  template_body text NOT NULL,
  summary_text text,
  version text NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  legacy_document_type text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_templates_active_idx
  ON contract_templates (is_active, contract_key);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_templates'
      AND policyname = 'service_role_contract_templates_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_contract_templates_full"
      ON contract_templates
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS contract_template_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  variable_key text NOT NULL,
  label text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('system', 'user_profile', 'role_profile', 'runtime')),
  default_value text,
  is_required boolean NOT NULL DEFAULT true,
  help_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, variable_key)
);

ALTER TABLE contract_template_variables ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_template_variables'
      AND policyname = 'service_role_contract_template_variables_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_contract_template_variables_full"
      ON contract_template_variables
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS role_contract_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL,
  contract_template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT true,
  trigger_event text NOT NULL DEFAULT 'post_login' CHECK (trigger_event IN ('signup', 'post_login', 'before_role_activation', 'before_payout')),
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_key, contract_template_id, trigger_event)
);

CREATE INDEX IF NOT EXISTS role_contract_requirements_role_idx
  ON role_contract_requirements (role_key, is_active, priority);

ALTER TABLE role_contract_requirements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'role_contract_requirements'
      AND policyname = 'service_role_role_contract_requirements_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_role_contract_requirements_full"
      ON role_contract_requirements
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_contract_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_key text NOT NULL,
  contract_template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  requirement_source text NOT NULL DEFAULT 'role_requirement' CHECK (requirement_source IN ('role_requirement', 'admin_invite', 'system')),
  rendered_title text NOT NULL,
  rendered_content text NOT NULL,
  rendered_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'waived', 'superseded')),
  blocking boolean NOT NULL DEFAULT true,
  trigger_event text NOT NULL DEFAULT 'post_login' CHECK (trigger_event IN ('signup', 'post_login', 'before_role_activation', 'before_payout')),
  accepted_artifact_id uuid REFERENCES signed_agreement_artifacts(id) ON DELETE SET NULL,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_key, contract_template_id, trigger_event)
);

CREATE INDEX IF NOT EXISTS user_contract_requirements_user_idx
  ON user_contract_requirements (user_id, status, blocking, trigger_event, created_at DESC);

ALTER TABLE user_contract_requirements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_contract_requirements'
      AND policyname = 'service_role_user_contract_requirements_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_user_contract_requirements_full"
      ON user_contract_requirements
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

WITH customer_doc AS (
  SELECT id, title, content, version, effective_date
  FROM legal_documents
  WHERE document_type = 'customer_terms' AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
),
diviner_doc AS (
  SELECT id, title, content, version, effective_date
  FROM legal_documents
  WHERE document_type = 'diviner_agreement' AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
),
affiliate_doc AS (
  SELECT id, title, content, version, effective_date
  FROM legal_documents
  WHERE document_type = 'affiliate_agreement' AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
),
telephony_doc AS (
  SELECT id, title, content, version, effective_date
  FROM legal_documents
  WHERE document_type = 'telephony_consent' AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1
),
seed_templates AS (
  INSERT INTO contract_templates (
    contract_key,
    title,
    role_scope,
    template_body,
    summary_text,
    version,
    effective_date,
    is_active,
    legacy_document_type
  )
  SELECT
    'customer-access',
    coalesce((SELECT title FROM customer_doc), 'Customer Terms'),
    ARRAY['client','community','mystery_school']::text[],
    coalesce((SELECT content FROM customer_doc), 'Customer terms for {{signer_name}} with {{company_name}} effective {{effective_date}}.'),
    'Core customer access agreement for account holders and program members.',
    coalesce((SELECT version FROM customer_doc), '1.0'),
    coalesce((SELECT effective_date FROM customer_doc), CURRENT_DATE),
    true,
    'customer_terms'
  WHERE NOT EXISTS (SELECT 1 FROM contract_templates WHERE contract_key = 'customer-access')

  UNION ALL

  SELECT
    'diviner-services',
    coalesce((SELECT title FROM diviner_doc), 'Diviner Service Agreement'),
    ARRAY['diviner','trainee']::text[],
    coalesce((SELECT content FROM diviner_doc), 'Diviner agreement for {{signer_name}} with {{company_name}} effective {{effective_date}}.'),
    'Role agreement required before diviner or trainee capabilities are activated.',
    coalesce((SELECT version FROM diviner_doc), '1.0'),
    coalesce((SELECT effective_date FROM diviner_doc), CURRENT_DATE),
    true,
    'diviner_agreement'
  WHERE NOT EXISTS (SELECT 1 FROM contract_templates WHERE contract_key = 'diviner-services')

  UNION ALL

  SELECT
    'affiliate-program',
    coalesce((SELECT title FROM affiliate_doc), 'Affiliate Program Agreement'),
    ARRAY['advocate']::text[],
    coalesce((SELECT content FROM affiliate_doc), 'Affiliate agreement for {{signer_name}} with {{company_name}} effective {{effective_date}}.'),
    'Role agreement required before affiliate links and commissions are enabled.',
    coalesce((SELECT version FROM affiliate_doc), '1.0'),
    coalesce((SELECT effective_date FROM affiliate_doc), CURRENT_DATE),
    true,
    'affiliate_agreement'
  WHERE NOT EXISTS (SELECT 1 FROM contract_templates WHERE contract_key = 'affiliate-program')

  UNION ALL

  SELECT
    'telephony-consent',
    coalesce((SELECT title FROM telephony_doc), 'Phone Dial-In Terms'),
    ARRAY['diviner']::text[],
    coalesce((SELECT content FROM telephony_doc), 'Telephony consent for {{signer_name}} effective {{effective_date}}.'),
    'Consent required before telephony capabilities can be activated.',
    coalesce((SELECT version FROM telephony_doc), '1.0'),
    coalesce((SELECT effective_date FROM telephony_doc), CURRENT_DATE),
    true,
    'telephony_consent'
  WHERE NOT EXISTS (SELECT 1 FROM contract_templates WHERE contract_key = 'telephony-consent')
  RETURNING id, contract_key
)
SELECT 1;

INSERT INTO contract_template_variables (template_id, variable_key, label, source_type, default_value, is_required, help_text, sort_order)
SELECT id, 'signer_name', 'Signer Name', 'user_profile', NULL, true, 'Resolved from the current user profile or role record.', 10
FROM contract_templates
WHERE NOT EXISTS (
  SELECT 1 FROM contract_template_variables v
  WHERE v.template_id = contract_templates.id AND v.variable_key = 'signer_name'
)
UNION ALL
SELECT id, 'signer_email', 'Signer Email', 'user_profile', NULL, true, 'Resolved from the account email or role record.', 20
FROM contract_templates
WHERE NOT EXISTS (
  SELECT 1 FROM contract_template_variables v
  WHERE v.template_id = contract_templates.id AND v.variable_key = 'signer_email'
)
UNION ALL
SELECT id, 'company_name', 'Company Name', 'system', 'AstrologyPro', true, 'Organization display name used in contracts.', 30
FROM contract_templates
WHERE NOT EXISTS (
  SELECT 1 FROM contract_template_variables v
  WHERE v.template_id = contract_templates.id AND v.variable_key = 'company_name'
)
UNION ALL
SELECT id, 'effective_date', 'Effective Date', 'runtime', NULL, true, 'Render the active effective date for this contract version.', 40
FROM contract_templates
WHERE NOT EXISTS (
  SELECT 1 FROM contract_template_variables v
  WHERE v.template_id = contract_templates.id AND v.variable_key = 'effective_date'
);

INSERT INTO role_contract_requirements (role_key, contract_template_id, is_required, trigger_event, priority, is_active)
SELECT role_key, t.id, true, trigger_event, priority, true
FROM (
  VALUES
    ('client', 'customer-access', 'post_login', 10),
    ('community', 'customer-access', 'post_login', 20),
    ('mystery_school', 'customer-access', 'post_login', 20),
    ('diviner', 'diviner-services', 'post_login', 10),
    ('trainee', 'diviner-services', 'post_login', 10),
    ('advocate', 'affiliate-program', 'post_login', 10),
    ('diviner', 'telephony-consent', 'before_role_activation', 30)
) AS seed(role_key, contract_key, trigger_event, priority)
JOIN contract_templates t ON t.contract_key = seed.contract_key
WHERE NOT EXISTS (
  SELECT 1
  FROM role_contract_requirements r
  WHERE r.role_key = seed.role_key
    AND r.contract_template_id = t.id
    AND r.trigger_event = seed.trigger_event
);
