ALTER TABLE contract_templates
  ADD COLUMN IF NOT EXISTS family_key text,
  ADD COLUMN IF NOT EXISTS version_kind text NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS amends_template_id uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applicability_mode text NOT NULL DEFAULT 'all_users',
  ADD COLUMN IF NOT EXISTS is_current_consolidated boolean NOT NULL DEFAULT false;

UPDATE contract_templates
SET
  family_key = COALESCE(NULLIF(family_key, ''), contract_key),
  version_kind = COALESCE(NULLIF(version_kind, ''), 'base'),
  applicability_mode = COALESCE(NULLIF(applicability_mode, ''), 'all_users'),
  is_current_consolidated = COALESCE(is_current_consolidated, true)
WHERE family_key IS NULL
   OR family_key = ''
   OR version_kind IS NULL
   OR applicability_mode IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contract_templates_version_kind_check'
  ) THEN
    ALTER TABLE contract_templates
      ADD CONSTRAINT contract_templates_version_kind_check
      CHECK (version_kind IN ('base', 'amendment', 'consolidated'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contract_templates_applicability_mode_check'
  ) THEN
    ALTER TABLE contract_templates
      ADD CONSTRAINT contract_templates_applicability_mode_check
      CHECK (applicability_mode IN ('all_users', 'existing_users_snapshot', 'future_users_only'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS contract_templates_family_idx
  ON contract_templates (family_key, is_current_consolidated, is_active, version_kind);

CREATE TABLE IF NOT EXISTS contract_amendment_rollouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amendment_template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  target_roles text[] NOT NULL DEFAULT ARRAY[]::text[],
  rollout_state text NOT NULL DEFAULT 'draft' CHECK (rollout_state IN ('draft', 'active', 'paused', 'superseded')),
  audience_mode text NOT NULL DEFAULT 'existing_users_snapshot' CHECK (audience_mode IN ('existing_users_snapshot')),
  activated_at timestamptz,
  activated_by uuid REFERENCES auth.users(id),
  paused_at timestamptz,
  superseded_at timestamptz,
  consolidated_template_id uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  affected_user_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_amendment_rollouts_state_idx
  ON contract_amendment_rollouts (rollout_state, created_at DESC);

ALTER TABLE contract_amendment_rollouts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contract_amendment_rollouts'
      AND policyname = 'service_role_contract_amendment_rollouts_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_contract_amendment_rollouts_full"
      ON contract_amendment_rollouts
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

ALTER TABLE user_contract_requirements
  ADD COLUMN IF NOT EXISTS rollout_id uuid REFERENCES contract_amendment_rollouts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS upgrades_prior_requirement_id uuid REFERENCES user_contract_requirements(id) ON DELETE SET NULL;

ALTER TABLE user_contract_requirements
  DROP CONSTRAINT IF EXISTS user_contract_requirements_requirement_source_check;

ALTER TABLE user_contract_requirements
  ADD CONSTRAINT user_contract_requirements_requirement_source_check
  CHECK (requirement_source IN ('role_requirement', 'admin_invite', 'system', 'amendment_rollout'));

UPDATE contract_templates
SET
  family_key = contract_key,
  version_kind = 'base',
  applicability_mode = 'all_users',
  is_current_consolidated = true
WHERE contract_key IN ('customer-access', 'diviner-services', 'affiliate-program', 'telephony-consent');
