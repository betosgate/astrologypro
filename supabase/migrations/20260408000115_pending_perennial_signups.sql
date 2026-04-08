-- ============================================================================
-- pending_perennial_signups — temporary storage for in-flight household
-- signups between Stripe Checkout creation and Stripe webhook receipt.
--
-- The Perennial signup page collects 1-5 household members and submits the
-- whole household to /api/perennial-signup/checkout, which creates a Stripe
-- Checkout session and stores the household payload here keyed on the
-- session id. After Stripe completes payment, the
-- handlePerennialSignupCheckoutCompleted webhook reads the row, provisions
-- 1-5 Supabase auth users + community_members rows, generates passwords,
-- emails each member, then marks the row processed.
--
-- Why a table instead of cookies / Stripe metadata:
--   - Stripe metadata is capped at 500 chars per value and 50 values; a
--     household of 5 with the optional questionnaire blows past both limits.
--   - Cookies don't survive the Stripe redirect for cross-site flows.
--   - A real table gives us an audit trail and a place to retry on failure.
--
-- Idempotent / additive only.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pending_perennial_signups (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id      TEXT        NOT NULL UNIQUE,
  plan_key               TEXT        NOT NULL,
  household              JSONB       NOT NULL,
  primary_email          TEXT        NOT NULL,
  status                 TEXT        NOT NULL DEFAULT 'pending',
  provisioned_user_ids   UUID[]      DEFAULT '{}',
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at           TIMESTAMPTZ,

  CONSTRAINT pending_perennial_signups_plan_key_check
    CHECK (plan_key IN ('single', 'couple', 'family')),
  CONSTRAINT pending_perennial_signups_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_pending_perennial_signups_status
  ON pending_perennial_signups (status, created_at);
CREATE INDEX IF NOT EXISTS idx_pending_perennial_signups_email
  ON pending_perennial_signups (primary_email);

-- updated_at trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'extensions' AND p.proname = 'moddatetime'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER set_updated_at_pending_perennial_signups
               BEFORE UPDATE ON pending_perennial_signups
               FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at)';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- RLS — service_role only. The household payload contains personal data
-- (DOBs, birth places, optional questionnaire answers) and emails. No
-- public read, no authenticated read; only the webhook + admin tools touch it.
ALTER TABLE pending_perennial_signups ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pending_perennial_signups'
      AND policyname = 'pending_perennial_signups_service_role'
  ) THEN
    CREATE POLICY pending_perennial_signups_service_role
      ON pending_perennial_signups FOR ALL
      TO service_role
      USING (TRUE) WITH CHECK (TRUE);
  END IF;
END $$;

COMMENT ON TABLE pending_perennial_signups IS
  'Temporary storage for in-flight Perennial household signups between Stripe Checkout creation and webhook receipt. The household JSONB holds the full member array (1-5 entries). Rows are marked completed after the webhook provisions accounts.';
