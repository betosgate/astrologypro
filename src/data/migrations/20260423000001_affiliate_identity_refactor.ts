export const MIGRATION_SQL = `
-- ============================================================================
-- Affiliate Identity Refactor — 2026-04-23
-- Sprint plan: docs/tasks/2026-04-23/affiliate-identity-refactor/
--
-- Introduces canonical \`affiliate_accounts\` identity table + \`affiliate_invites\`
-- token table. Reshapes \`diviner_affiliates\` into a junction by adding
-- \`affiliate_account_id\`, \`invited_at\`, \`accepted_at\` columns.
--
-- Additive-first: no DROPs. Legacy columns (name/email/phone/user_id) stay
-- populated for one release. Follow-up migration retires them.
--
-- Backfills the existing 14 diviner_affiliates rows into the new model.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS citext;

-- ─── 1. affiliate_accounts — canonical identity ───────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email           CITEXT NOT NULL UNIQUE,
  name            TEXT   NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  timezone        TEXT,
  -- Payout profile is per-account; per-diviner payouts still exist per D1
  payout_method   TEXT CHECK (payout_method IN ('bank','paypal','check','other')),
  payout_details  JSONB,
  tax_form_status TEXT
    CHECK (tax_form_status IN ('not_collected','pending','verified','rejected'))
    DEFAULT 'not_collected',
  tax_form_url    TEXT,
  -- Platform-wide status: 'blocked' here = blocked for ALL diviners
  status          TEXT NOT NULL DEFAULT 'unclaimed'
                  CHECK (status IN ('unclaimed','active','suspended','blocked')),
  notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_user_id
  ON affiliate_accounts(user_id)
  WHERE user_id IS NOT NULL;

-- CITEXT gives case-insensitive UNIQUE for \`email\` natively; this helps LIKE
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_email_lower
  ON affiliate_accounts (LOWER(email));

-- ─── 2. affiliate_invites — hashed invite tokens ──────────────────────────────
CREATE TABLE IF NOT EXISTS affiliate_invites (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id           UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  affiliate_account_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  junction_id          UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE CASCADE,
  email                CITEXT NOT NULL,         -- frozen at invite time
  token_hash           TEXT NOT NULL UNIQUE,    -- SHA-256 hex of the raw token
  message              TEXT,
  invited_by           UUID NOT NULL,           -- diviner's auth.users.id
  expires_at           TIMESTAMPTZ NOT NULL,
  consumed_at          TIMESTAMPTZ,
  consumed_by          UUID,                    -- accepter's auth.users.id
  revoked_at           TIMESTAMPTZ,
  resent_count         INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_account ON affiliate_invites(affiliate_account_id);
CREATE INDEX IF NOT EXISTS idx_inv_diviner ON affiliate_invites(diviner_id);
CREATE INDEX IF NOT EXISTS idx_inv_open
  ON affiliate_invites(email)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;

-- ─── 3. ALTER diviner_affiliates — additive only ──────────────────────────────
ALTER TABLE diviner_affiliates
  ADD COLUMN IF NOT EXISTS affiliate_account_id UUID
    REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS invited_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Post-backfill: one junction per (diviner, account)
CREATE UNIQUE INDEX IF NOT EXISTS ux_diviner_affiliate_account
  ON diviner_affiliates (diviner_id, affiliate_account_id)
  WHERE affiliate_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_da_account ON diviner_affiliates(affiliate_account_id);
CREATE INDEX IF NOT EXISTS idx_da_status  ON diviner_affiliates(status);

-- NOTE: legacy columns (name, email, phone, user_id) and UNIQUE(diviner_id, email)
-- are intentionally left untouched. They are retired in a follow-up migration
-- one release after this refactor ships.

-- ─── 4. RLS on new tables ─────────────────────────────────────────────────────
ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_invites  ENABLE ROW LEVEL SECURITY;

-- service_role: full access. Guards against missing policy + re-runs.
DO $plpol$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_accounts' AND policyname='svc_affiliate_accounts') THEN
    EXECUTE $p$ CREATE POLICY "svc_affiliate_accounts" ON affiliate_accounts FOR ALL TO service_role USING (true) WITH CHECK (true) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_invites' AND policyname='svc_affiliate_invites') THEN
    EXECUTE $p$ CREATE POLICY "svc_affiliate_invites" ON affiliate_invites FOR ALL TO service_role USING (true) WITH CHECK (true) $p$;
  END IF;

  -- Affiliate can SELECT / UPDATE their own canonical row (portal profile editing)
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_accounts' AND policyname='account_self_select') THEN
    EXECUTE $p$ CREATE POLICY "account_self_select" ON affiliate_accounts FOR SELECT USING (auth.uid() = user_id) $p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_accounts' AND policyname='account_self_update') THEN
    EXECUTE $p$ CREATE POLICY "account_self_update" ON affiliate_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id) $p$;
  END IF;

  -- Diviner can SELECT the canonical row for any affiliate they partner with
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_accounts' AND policyname='diviner_sees_linked_accounts') THEN
    EXECUTE $p$
      CREATE POLICY "diviner_sees_linked_accounts" ON affiliate_accounts FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM diviner_affiliates da
          JOIN diviners d ON d.id = da.diviner_id
          WHERE da.affiliate_account_id = affiliate_accounts.id
            AND d.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  -- No client-side policy on affiliate_invites — tokens are only handled by service_role
END
$plpol$;

-- ─── 5. Updated-at trigger (reuse shipped aff_updated_at() function) ──────────
DROP TRIGGER IF EXISTS trg_acc_updated ON affiliate_accounts;
CREATE TRIGGER trg_acc_updated
  BEFORE UPDATE ON affiliate_accounts
  FOR EACH ROW EXECUTE FUNCTION aff_updated_at();

-- ─── 6. Backfill audit table (retained for 30 days post-deploy) ───────────────
CREATE TABLE IF NOT EXISTS _affiliate_backfill_audit (
  id                     BIGSERIAL PRIMARY KEY,
  source_da_id           UUID,
  source_email           CITEXT,
  source_name            TEXT,
  source_phone           TEXT,
  source_status          TEXT,
  source_notes           TEXT,
  source_user_id         UUID,
  resolved_account_id    UUID,
  resolved_user_id       UUID,
  decision               TEXT,                  -- e.g. 'created', 'reused', 'linked_auth_user'
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. Backfill: canonical accounts from distinct diviner_affiliates emails ──
-- For each distinct LOWER(email), pick the most-recent row's name/phone.
-- Attempt to link user_id via auth.users.email match. If no match, leave NULL.
WITH src AS (
  SELECT DISTINCT ON (LOWER(da.email))
         da.id         AS source_da_id,
         LOWER(da.email)::citext AS norm_email,
         da.name       AS norm_name,
         da.phone      AS norm_phone,
         da.status     AS source_status,
         da.notes      AS source_notes,
         da.user_id    AS source_user_id
  FROM diviner_affiliates da
  WHERE da.affiliate_account_id IS NULL            -- idempotent re-runs
  ORDER BY LOWER(da.email), da.created_at DESC, da.id DESC
),
auth_match AS (
  SELECT s.*,
         (SELECT u.id FROM auth.users u
          WHERE LOWER(u.email) = LOWER(s.norm_email)
          ORDER BY u.created_at ASC LIMIT 1) AS matched_user_id
  FROM src s
),
inserted AS (
  INSERT INTO affiliate_accounts (email, name, phone, user_id, status)
  SELECT am.norm_email,
         COALESCE(NULLIF(TRIM(am.norm_name), ''), am.norm_email),   -- name fallback
         am.norm_phone,
         am.matched_user_id,
         CASE WHEN am.matched_user_id IS NULL THEN 'unclaimed' ELSE 'active' END
  FROM auth_match am
  ON CONFLICT (email) DO NOTHING
  RETURNING id, email, user_id
)
INSERT INTO _affiliate_backfill_audit (
  source_da_id, source_email, source_name, source_phone, source_status,
  source_notes, source_user_id, resolved_account_id, resolved_user_id, decision
)
SELECT am.source_da_id, am.norm_email, am.norm_name, am.norm_phone, am.source_status,
       am.source_notes, am.source_user_id,
       (SELECT aa.id FROM affiliate_accounts aa WHERE aa.email = am.norm_email),
       (SELECT aa.user_id FROM affiliate_accounts aa WHERE aa.email = am.norm_email),
       CASE
         WHEN (SELECT id FROM inserted i WHERE i.email = am.norm_email) IS NOT NULL
           THEN CASE WHEN am.matched_user_id IS NOT NULL THEN 'created_and_linked' ELSE 'created_unclaimed' END
         ELSE 'reused_existing'
       END
FROM auth_match am;

-- Wire every diviner_affiliates row to its canonical account
UPDATE diviner_affiliates da
SET affiliate_account_id = aa.id
FROM affiliate_accounts aa
WHERE aa.email = LOWER(da.email)::citext
  AND da.affiliate_account_id IS NULL;

-- Timestamps (verified-report correction: use simple status-based rule)
UPDATE diviner_affiliates
SET invited_at = created_at
WHERE status IN ('pending','suspended')
  AND invited_at IS NULL;

UPDATE diviner_affiliates
SET accepted_at = created_at
WHERE status = 'active'
  AND accepted_at IS NULL;

-- ─── 8. End-of-migration assertion ────────────────────────────────────────────
DO $assert$
DECLARE
  v_orphans INTEGER;
  v_accounts INTEGER;
  v_distinct_emails INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphans
    FROM diviner_affiliates WHERE affiliate_account_id IS NULL;
  IF v_orphans > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % diviner_affiliates rows with NULL affiliate_account_id', v_orphans;
  END IF;

  SELECT COUNT(*) INTO v_accounts FROM affiliate_accounts;
  SELECT COUNT(DISTINCT LOWER(email)) INTO v_distinct_emails FROM diviner_affiliates;
  IF v_accounts <> v_distinct_emails THEN
    RAISE EXCEPTION 'Backfill row count mismatch: affiliate_accounts=% vs distinct LOWER(email) in diviner_affiliates=%',
      v_accounts, v_distinct_emails;
  END IF;
END
$assert$;

-- ============================================================================
-- NOT INCLUDED (handled by later migrations in the same sprint):
--   * create_affiliate_invite(...) RPC            → Task 02
--   * consume_invite_and_activate_junction(...)   → Task 03
--   * guard_affiliate_account_user_link trigger   → Task 03
-- ============================================================================
`;
