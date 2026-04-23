# Task 01 — Schema & Migration

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: None
- Blocks: 02, 03, 04, 05, 06, 07

## Goal

Introduce the canonical `affiliate_accounts` identity table, add an `affiliate_invites` token table, and add `affiliate_account_id` + `invited_at` + `accepted_at` columns to `diviner_affiliates`. Backfill the 14 existing `diviner_affiliates` rows into the new model. Additive-first — no drops, no FK rewiring.

## Naming note

The table is `affiliate_accounts`, **not** `affiliates`. The name `affiliates` is taken by a legacy table with 6 seed rows and 5 live code callers (see README § Out of Scope). Do not rename or retire the legacy table in this sprint.

## Current State

- `diviner_affiliates` table ([supabase/migrations/20260407000063_affiliate_commission.sql:2-18](../../../../supabase/migrations/20260407000063_affiliate_commission.sql#L2-L18)) holds identity + relationship in one row. 14 rows in prod.
- `user_id` column on `diviner_affiliates` exists but is 0/14 populated — dead column.
- Downstream tables key off `diviner_affiliates.id`:
  - `affiliate_referral_links.affiliate_id` FK → `diviner_affiliates(id)`
  - `affiliate_commissions.affiliate_id` FK → `diviner_affiliates(id)`
  - `affiliate_payouts.affiliate_id` FK → `diviner_affiliates(id)`
  - `diviner_service_affiliates.affiliate_id` (polymorphic, not FK) — references `diviner_affiliates.id` when `affiliate_type='diviner_affiliate'`
  - `affiliate_campaigns.owner_affiliate_id` (polymorphic) — same
- RLS already enabled on `diviner_affiliates` (service_role full; diviner SELECT on own rows).
- Legacy `affiliates` table (6 rows) — **not our concern.** Different shape, not referenced by this refactor.

## Target Schema

### New table: `affiliate_accounts` (canonical diviner-affiliate identity)

```sql
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email           CITEXT NOT NULL UNIQUE,
  name            TEXT   NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  timezone        TEXT,
  -- payout profile is per-account; per-diviner payouts still exist per D1
  payout_method   TEXT CHECK (payout_method IN ('bank','paypal','check','other')),
  payout_details  JSONB,
  tax_form_status TEXT CHECK (tax_form_status IN ('not_collected','pending','verified','rejected')) DEFAULT 'not_collected',
  tax_form_url    TEXT,
  -- platform-wide status (blocked here = blocked for ALL diviners)
  status          TEXT NOT NULL DEFAULT 'unclaimed'
                  CHECK (status IN ('unclaimed','active','suspended','blocked')),
  notification_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_user_id
  ON affiliate_accounts(user_id)
  WHERE user_id IS NOT NULL;

-- CITEXT gives case-insensitive UNIQUE; this index helps LIKE queries
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_email_lower
  ON affiliate_accounts (LOWER(email));
```

Notes:

- `email CITEXT UNIQUE` — case-insensitive uniqueness at the DB layer.
- `user_id UUID UNIQUE` — at most one canonical account per auth user. Nullable for unclaimed rows.
- `status = 'blocked'` = blocked platform-wide (fixes the "no affiliate-wide block" concern).
- `payout_details` is JSONB for method flexibility. **Never log.** Add a logger filter in Task 06 audit.

### Reshape: `diviner_affiliates` (becomes a junction; additive only)

```sql
ALTER TABLE diviner_affiliates
  ADD COLUMN IF NOT EXISTS affiliate_account_id UUID REFERENCES affiliate_accounts(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS invited_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at          TIMESTAMPTZ;

-- One junction per (diviner, canonical account)
CREATE UNIQUE INDEX IF NOT EXISTS ux_diviner_affiliate_account
  ON diviner_affiliates (diviner_id, affiliate_account_id)
  WHERE affiliate_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_da_account ON diviner_affiliates(affiliate_account_id);
CREATE INDEX IF NOT EXISTS idx_da_status  ON diviner_affiliates(status);
```

**Legacy columns stay untouched** in this sprint:

- `diviner_affiliates.name`
- `diviner_affiliates.email`
- `diviner_affiliates.phone`
- `diviner_affiliates.user_id`
- `UNIQUE(diviner_id, email)` — stays as a fallback safety net

These get dropped in a separate follow-up migration one release after the refactor ships.

### New table: `affiliate_invites`

```sql
CREATE TABLE IF NOT EXISTS affiliate_invites (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id         UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  affiliate_account_id UUID NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
  junction_id        UUID NOT NULL REFERENCES diviner_affiliates(id) ON DELETE CASCADE,
  email              CITEXT NOT NULL,          -- frozen at invite time
  token_hash         TEXT NOT NULL UNIQUE,     -- SHA-256 of the raw token
  message            TEXT,
  invited_by         UUID NOT NULL,            -- diviner's auth user_id
  expires_at         TIMESTAMPTZ NOT NULL,
  consumed_at        TIMESTAMPTZ,
  consumed_by        UUID,                     -- auth.users.id of accepter
  revoked_at         TIMESTAMPTZ,
  resent_count       INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_account    ON affiliate_invites(affiliate_account_id);
CREATE INDEX IF NOT EXISTS idx_inv_diviner    ON affiliate_invites(diviner_id);
CREATE INDEX IF NOT EXISTS idx_inv_open
  ON affiliate_invites(email)
  WHERE consumed_at IS NULL AND revoked_at IS NULL;
```

Notes:

- Server never stores the raw token. Raw lives only in the email link. OWASP ASVS V3.2 alignment.
- `email` is frozen — the accept flow enforces logged-in user's email = invite's `email`.
- `expires_at` is server-set to `NOW() + INTERVAL '14 days'`.

### RLS

Enable on both new tables. Default deny.

```sql
ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_invites  ENABLE ROW LEVEL SECURITY;

-- service_role: full access for server endpoints
CREATE POLICY "svc_affiliate_accounts" ON affiliate_accounts FOR ALL TO service_role USING (true);
CREATE POLICY "svc_affiliate_invites"  ON affiliate_invites  FOR ALL TO service_role USING (true);

-- affiliate can SELECT / UPDATE their own canonical row (portal profile editing)
CREATE POLICY "account_self_select" ON affiliate_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "account_self_update" ON affiliate_accounts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- diviner can SELECT the canonical row for any affiliate they partner with
CREATE POLICY "diviner_sees_linked_accounts" ON affiliate_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diviner_affiliates da
      JOIN diviners d ON d.id = da.diviner_id
      WHERE da.affiliate_account_id = affiliate_accounts.id
        AND d.user_id = auth.uid()
    )
  );

-- No client-side policy on affiliate_invites — tokens are only handled by service_role
```

### Updated-at trigger

Reuse the existing `aff_updated_at()` function:

```sql
DROP TRIGGER IF EXISTS trg_acc_updated ON affiliate_accounts;
CREATE TRIGGER trg_acc_updated BEFORE UPDATE ON affiliate_accounts
  FOR EACH ROW EXECUTE FUNCTION aff_updated_at();
```

## Backfill Plan

Inside the same migration, after DDL, transaction-wrapped.

1. Create `_affiliate_backfill_audit` temp/retained table to log data-source decisions for each merge.
2. For each distinct `email` (case-insensitive) in `diviner_affiliates`:
   - Insert one `affiliate_accounts` row.
   - `user_id`: match to `auth.users` by `LOWER(email)`. If found, set; status becomes `'active'`. If not, NULL; status `'unclaimed'`.
   - `name` / `phone`: take from the most-recent `diviner_affiliates` row for that email (ORDER BY `created_at DESC, id DESC`). Log the source `diviner_affiliates.id` into `_affiliate_backfill_audit`.
3. `UPDATE diviner_affiliates da SET affiliate_account_id = (SELECT aa.id FROM affiliate_accounts aa WHERE aa.email = da.email)`.
4. Set `invited_at = created_at` for rows where `status='pending'` OR `notes LIKE 'Invitation:%'` OR `notes = 'Invited via dashboard'`.
5. Set `accepted_at = created_at` for `status='active'` rows that were direct-adds (no invite marker).
6. **Legacy pending rows get no `affiliate_invites` row.** Some grandfathered `diviner_affiliates` with `status='pending'` existed before this sprint — they have no token to honor. Do NOT create synthetic `affiliate_invites` rows during backfill. Task 02's `/resend` endpoint handles these by issuing a fresh token for a pending junction whose `affiliate_invites` table has no prior row. Task 04's UI shows a "Legacy invite — resend to reach this contact" badge for such rows.
7. End-of-migration assertion:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM diviner_affiliates WHERE affiliate_account_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill incomplete: diviner_affiliates rows with NULL affiliate_account_id';
  END IF;
  IF (SELECT COUNT(*) FROM affiliate_accounts) <>
     (SELECT COUNT(DISTINCT LOWER(email)) FROM diviner_affiliates) THEN
    RAISE EXCEPTION 'Backfill row count mismatch';
  END IF;
END $$;
```

## Implementation Steps

### 1. Migration file

Path: `supabase/migrations/20260423000001_affiliate_identity_refactor.sql`.

Order inside the file:

1. `CREATE EXTENSION IF NOT EXISTS citext;`
2. `CREATE TABLE affiliate_accounts ...`
3. `CREATE TABLE affiliate_invites ...`
4. `ALTER TABLE diviner_affiliates ADD COLUMN ...`
5. Indexes on all three tables.
6. RLS enable + policies.
7. Updated-at trigger on `affiliate_accounts`.
8. Create `_affiliate_backfill_audit` table.
9. Backfill: `WITH distinct_emails AS (...) INSERT INTO affiliate_accounts ... ON CONFLICT (email) DO NOTHING`.
10. Backfill audit rows.
11. `UPDATE diviner_affiliates SET affiliate_account_id = ...`.
12. Populate `invited_at` / `accepted_at` heuristically.
13. End-of-migration assertion block.

### 2. Do NOT

- Drop any column on `diviner_affiliates`.
- Drop the `UNIQUE(diviner_id, email)` constraint.
- Rename, drop, or alter `affiliate_referral_links`, `affiliate_commissions`, `affiliate_payouts`, `affiliate_payout_items`, `affiliate_clicks`.
- Rename, drop, or alter `diviner_service_affiliates`, `affiliate_campaigns`, `campaign_conversions`, `campaign_clicks`, `page_views`.
- Rename, drop, or alter the legacy `affiliates` / `affiliate_referrals` tables.
- Alter `social_advocates`.

### 3. Regenerate Supabase types

```bash
npx supabase gen types typescript --project-id wyluvclvtvwptsvvtgkv --schema public > src/types/supabase.ts
```

Commit in same PR.

### 4. Add a typed helper

File: `src/lib/affiliate-accounts.ts` (new). Exports:

- `getAffiliateAccountByUserId(admin, userId)`
- `getAffiliateAccountByEmail(admin, email)`
- `upsertAffiliateAccount(admin, { email, name, phone? })` — returns `{ account, created: boolean }`
- `linkUserToAffiliateAccount(admin, { accountId, userId })` — routes through the accept RPC (Task 03)

These are the only functions other tasks should use to touch `affiliate_accounts`.

### 5. Add a shared select constant

File: `src/lib/affiliate-queries.ts` (new). Exports:

```ts
export const DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT = `
  id,
  diviner_id,
  affiliate_account_id,
  status,
  notes,
  default_commission_type,
  default_commission_value,
  invited_at,
  accepted_at,
  created_at,
  updated_at,
  account:affiliate_accounts (
    id,
    user_id,
    email,
    name,
    phone,
    avatar_url,
    status,
    tax_form_status
  )
` as const;
```

Task 06 uses this when rewriting identity-reader endpoints.

## Verification Plan

### A. Local migration smoke

```bash
supabase db reset   # applies all migrations including the new one
# expect no errors; assertion block does not fire
```

### B. Against shared dev DB (do NOT run on prod)

```sql
-- expect 14
SELECT COUNT(*) FROM diviner_affiliates WHERE affiliate_account_id IS NOT NULL;

-- expect same count as COUNT(DISTINCT LOWER(email)) from diviner_affiliates
SELECT COUNT(*) FROM affiliate_accounts;

-- expect 0
SELECT COUNT(*) FROM diviner_affiliates WHERE affiliate_account_id IS NULL;

-- non-negative, not necessarily > 0
SELECT COUNT(*) FROM affiliate_accounts WHERE user_id IS NOT NULL;
```

### C. RLS tests

As an authenticated `affiliate_account` user:

```sql
SELECT * FROM affiliate_accounts WHERE id <> '<my account id>';  -- expect 0
SELECT * FROM affiliate_invites;                                  -- expect 0
```

As a diviner:

```sql
SELECT a.id FROM affiliate_accounts a
WHERE NOT EXISTS (
  SELECT 1 FROM diviner_affiliates da
  JOIN diviners d ON d.id = da.diviner_id
  WHERE da.affiliate_account_id = a.id AND d.user_id = auth.uid()
);
-- expect 0
```

### D. Downstream read parity

Hit these in staging before Task 06 ships:

- `GET /api/dashboard/affiliates`
- `GET /api/dashboard/affiliates/summary`
- `GET /api/dashboard/affiliates/[id]`
- `GET /api/dashboard/affiliate-commission/summary`
- `GET /api/admin/analytics/affiliates`

All must return the same response shape and row counts as before the migration. Legacy columns are still populated; nothing rewired yet.

### E. Polymorphic FK preservation

```sql
-- diviner_service_affiliates rows with affiliate_type='diviner_affiliate' must still resolve
SELECT dsa.id
FROM diviner_service_affiliates dsa
LEFT JOIN diviner_affiliates da ON da.id = dsa.affiliate_id
WHERE dsa.affiliate_type = 'diviner_affiliate' AND da.id IS NULL;
-- expect 0

-- affiliate_campaigns with owner_type='affiliate' AND owner_affiliate_type='diviner_affiliate' must still resolve
SELECT ac.id
FROM affiliate_campaigns ac
LEFT JOIN diviner_affiliates da ON da.id = ac.owner_affiliate_id
WHERE ac.owner_type = 'affiliate'
  AND ac.owner_affiliate_type = 'diviner_affiliate'
  AND da.id IS NULL;
-- expect 0
```

## Edge Cases

1. **Name / phone differs across rows for same email.** Backfill picks the most recent. Audit row records both for later manual reconciliation.
2. **Email already has uppercase in existing rows.** `CITEXT` collapses variants; the UNIQUE enforces one canonical row.
3. **Two auth users share an email** (legacy import). Should be impossible, but if it happens, pick the oldest `auth.users.id` and log a warning.
4. **FK validation fails on dangling `diviner_affiliates`.** Shouldn't happen because backfill runs before the FK is enforced at strict mode. Assertion catches it.
5. **Extension `citext` not enabled.** Guarded with `IF NOT EXISTS`. Supabase permits this for project owners.
6. **Migration runs twice.** Idempotent — all DDL uses `IF NOT EXISTS`; backfill uses `ON CONFLICT DO NOTHING`; `UPDATE ... SET affiliate_account_id = ...` re-joins by email.
7. **A diviner has already been made their own affiliate via direct-add** (one of the 14 rows where `email` matches a diviner's login email). Backfill treats them normally — canonical account gets linked to their auth user. Harmless; the accept flow (Task 03) won't re-prompt.
8. **`affiliate_accounts.user_id` already exists for a different person** (e.g., an admin wanted to pre-link). Covered by `user_id UNIQUE`. Backfill runs `ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email` — but we don't need this path because backfill creates rows with NULL user_id when no match.

## Out of Scope

- Dropping the legacy columns on `diviner_affiliates`. Follow-up migration.
- Reconciling spelling/case variants of the same name across backfilled rows.
- Making `affiliate_accounts.user_id` NOT NULL.
- Any change to `social_advocates`, `diviner_service_affiliates`, `affiliate_campaigns`, `campaign_*`, `page_views`, or the legacy `affiliates` / `affiliate_referrals` tables.

## Rollback Plan

1. `DELETE FROM affiliate_invites;`
2. `UPDATE diviner_affiliates SET affiliate_account_id = NULL, invited_at = NULL, accepted_at = NULL;`
3. `DROP TABLE affiliate_accounts CASCADE;`
4. `DROP TABLE affiliate_invites;`
5. `DROP TABLE _affiliate_backfill_audit;`
6. Revert the migration file commit.

No data loss: legacy columns on `diviner_affiliates` were never touched.
