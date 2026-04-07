-- Versioned legal documents managed by admin
CREATE TABLE legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN (
    'customer_terms','diviner_agreement','affiliate_agreement',
    'telephony_consent','marketing_consent','privacy_policy','refund_policy'
  )),
  version text NOT NULL, -- e.g. "1.0", "2.1"
  title text NOT NULL,
  content text NOT NULL, -- markdown or HTML
  is_active boolean NOT NULL DEFAULT false, -- only one active per type
  effective_date date NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_type, version)
);

CREATE INDEX IF NOT EXISTS ld_type_active_idx ON legal_documents(document_type, is_active);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_documents' AND policyname='public_read_active_legal') THEN
    EXECUTE $p$
      CREATE POLICY "public_read_active_legal" ON legal_documents FOR SELECT USING (is_active = true)
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_documents' AND policyname='service_role_legal_full') THEN
    EXECUTE $p$
      CREATE POLICY "service_role_legal_full" ON legal_documents FOR ALL TO service_role USING (true) WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- User acceptance records
CREATE TABLE legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES legal_documents(id),
  document_type text NOT NULL,
  document_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(user_id, document_id)
);

CREATE INDEX IF NOT EXISTS la_user_idx ON legal_acceptances(user_id, document_type);
CREATE INDEX IF NOT EXISTS la_document_idx ON legal_acceptances(document_id);

ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_acceptances' AND policyname='users_own_acceptances') THEN
    EXECUTE $p$
      CREATE POLICY "users_own_acceptances" ON legal_acceptances FOR SELECT
      USING (user_id = auth.uid())
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_acceptances' AND policyname='users_insert_acceptance') THEN
    EXECUTE $p$
      CREATE POLICY "users_insert_acceptance" ON legal_acceptances FOR INSERT
      WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='legal_acceptances' AND policyname='service_role_acceptances') THEN
    EXECUTE $p$
      CREATE POLICY "service_role_acceptances" ON legal_acceptances FOR ALL TO service_role USING (true) WITH CHECK (true)
    $p$;
  END IF;
END $$;

-- Seed initial placeholder documents (admins will edit these)
INSERT INTO legal_documents (document_type, version, title, content, is_active, effective_date) VALUES
  ('customer_terms', '1.0', 'Customer Terms of Service', '# Customer Terms of Service\n\nContent to be added by administrator.', true, CURRENT_DATE),
  ('diviner_agreement', '1.0', 'Diviner Service Agreement', '# Diviner Service Agreement\n\nContent to be added by administrator.', true, CURRENT_DATE),
  ('affiliate_agreement', '1.0', 'Affiliate Program Agreement', '# Affiliate Program Agreement\n\nContent to be added by administrator.', true, CURRENT_DATE),
  ('telephony_consent', '1.0', 'Phone Dial-In Terms', '# Phone Dial-In Terms\n\nBy enabling phone dial-in, you agree that usage costs will be billed at the pass-through rate.', true, CURRENT_DATE),
  ('privacy_policy', '1.0', 'Privacy Policy', '# Privacy Policy\n\nContent to be added by administrator.', true, CURRENT_DATE)
ON CONFLICT (document_type, version) DO NOTHING;
