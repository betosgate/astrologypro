CREATE TABLE IF NOT EXISTS signed_agreement_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id uuid NOT NULL UNIQUE REFERENCES legal_acceptances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_version text NOT NULL,
  title text NOT NULL,
  content_snapshot text NOT NULL,
  rendered_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  signer_email text,
  signer_name text,
  accepted_at timestamptz NOT NULL,
  content_hash text NOT NULL,
  pdf_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signed_agreement_artifacts_user_idx
  ON signed_agreement_artifacts (user_id, accepted_at DESC);

CREATE INDEX IF NOT EXISTS signed_agreement_artifacts_document_idx
  ON signed_agreement_artifacts (document_type, document_version, accepted_at DESC);

ALTER TABLE signed_agreement_artifacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signed_agreement_artifacts'
      AND policyname = 'service_role_signed_agreements_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_signed_agreements_full"
      ON signed_agreement_artifacts
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS signed_agreement_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES signed_agreement_artifacts(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by_role text NOT NULL CHECK (requested_by_role IN ('user', 'admin', 'system')),
  delivery_type text NOT NULL CHECK (delivery_type IN ('view', 'download', 'email')),
  target_email text,
  delivery_status text NOT NULL CHECK (delivery_status IN ('queued', 'sent', 'failed', 'viewed', 'downloaded')),
  internal_note text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signed_agreement_delivery_logs_artifact_idx
  ON signed_agreement_delivery_logs (artifact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS signed_agreement_delivery_logs_subject_idx
  ON signed_agreement_delivery_logs (subject_user_id, created_at DESC);

ALTER TABLE signed_agreement_delivery_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signed_agreement_delivery_logs'
      AND policyname = 'service_role_signed_agreement_logs_full'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "service_role_signed_agreement_logs_full"
      ON signed_agreement_delivery_logs
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true)
    $policy$;
  END IF;
END $$;

INSERT INTO signed_agreement_artifacts (
  acceptance_id,
  user_id,
  document_id,
  document_type,
  document_version,
  title,
  content_snapshot,
  rendered_variables,
  signer_email,
  signer_name,
  accepted_at,
  content_hash
)
SELECT
  la.id,
  la.user_id,
  la.document_id,
  la.document_type,
  la.document_version,
  ld.title,
  ld.content,
  '{}'::jsonb,
  NULL,
  NULL,
  la.accepted_at,
  md5(
    coalesce(ld.title, '') ||
    '|' ||
    coalesce(la.document_version, '') ||
    '|' ||
    coalesce(ld.content, '')
  )
FROM legal_acceptances la
JOIN legal_documents ld ON ld.id = la.document_id
LEFT JOIN signed_agreement_artifacts saa ON saa.acceptance_id = la.id
WHERE saa.id IS NULL;
