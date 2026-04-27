# Task 01 — Schema Migrations

- Status: 01a applied; 01b drafted (not yet applied — run via /admin/db/migrations)
- Priority: P0
- Depends on: —
- Blocks: 02, 03, 04, 05, 06, 07
- Spec: v1.2 (§3.1, §3.3, §3.4, §3.5, §3.8, §5 Flow K)

## Goal

Establish the database shape Phase 1 needs. Additive changes land before
any code change; destructive changes land at the end of the sprint in a
separate migration (after task 02 has removed all writers of retired
columns / tables).

## Migrations (in this order)

### 01a — Additive (ships first, before code changes)

**File:** `supabase/migrations/<YYYYMMDD>0001_affiliate_commission_v2_additive.sql`

1. **`diviner_service_affiliate_rate_history` (new table)**:
   ```
   id UUID PK
   assignment_id UUID NOT NULL REFERENCES diviner_service_affiliates(id) ON DELETE CASCADE
   old_commission_type TEXT NOT NULL
   old_commission_value NUMERIC(10,4) NOT NULL
   new_commission_type TEXT NOT NULL
   new_commission_value NUMERIC(10,4) NOT NULL
   changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   changed_by UUID REFERENCES auth.users(id)
   reason TEXT
   ```
   Index on `(assignment_id, changed_at DESC)`.

2. **`bookings` — add stamp columns** (spec §3.8):
   ```
   ALTER TABLE bookings
     ADD COLUMN IF NOT EXISTS commission_source_assignment_id UUID
       REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL,
     ADD COLUMN IF NOT EXISTS commission_rate_type_stamp TEXT
       CHECK (commission_rate_type_stamp IN ('percent','flat')),
     ADD COLUMN IF NOT EXISTS commission_rate_value_stamp NUMERIC(10,4);
   ```
   All nullable — existing bookings pre-migration stay NULL (no retroactive
   commission). Index on `commission_source_assignment_id` for reporting.

3. **`campaign_conversions` — add audit + reversal columns** used by tasks 04, 05:
   - `rate_type_used TEXT` (records which rate was actually used — copy of
     the stamp at webhook time)
   - `rate_value_used NUMERIC(10,4)`
   - `reversed_at TIMESTAMPTZ` (if not already present — verify against
     migration 20260421000001 which mentions "reversal columns")
   - `reversed_by UUID REFERENCES auth.users(id)`
   - `reversed_reason TEXT`

4. **`admin_action_log` (new table — Flow K audit)**:
   ```
   id UUID PK
   admin_user_id UUID NOT NULL REFERENCES auth.users(id)
   action_kind TEXT NOT NULL CHECK (action_kind IN (
     'affiliate_assignment_revoked',
     'affiliate_campaign_archived',
     'affiliate_conversion_reversed'
   ))
   target_resource_type TEXT NOT NULL  -- e.g. 'diviner_service_affiliates'
   target_resource_id UUID NOT NULL
   reason TEXT NOT NULL
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   ```
   Indexes on `(admin_user_id, created_at DESC)` and `(target_resource_type, target_resource_id)`.

5. **`affiliate_campaigns.status` — extend CHECK**: add `'archived'`
   (other trimming happens in 01b).

6. **`campaign_conversions.campaign_id` — FK hardening**: swap from
   `ON DELETE CASCADE` to `ON DELETE RESTRICT` via
   `DROP CONSTRAINT ... ADD CONSTRAINT ... REFERENCES ... ON DELETE RESTRICT`.
   Wrap in a DO block with a `pg_constraint` existence check so the
   migration is idempotent.

7. **RLS policies (new tables + extensions)**:
   - `diviner_service_affiliate_rate_history`: service_role ALL; diviner
     SELECT where assignment's `diviner_id = me`; affiliate SELECT where
     assignment's `affiliate_id IN my_junctions`.
   - `admin_action_log`: service_role ALL; admin SELECT (gate through
     `admin_users` lookup); no other roles.
   - Audit existing RLS on `campaign_clicks`, `campaign_conversions`,
     `diviner_service_affiliates`, `affiliate_campaigns` against spec §8.
     Add missing policies; do NOT drop existing ones — the 2026-04-23
     refactor added self-select policies that stay.

### 01b — Destructive (ships LAST, after tasks 02 and 04)

**File:** `supabase/migrations/<YYYYMMDD>9001_affiliate_commission_v2_destructive.sql`

1. **Defensive data migration first:**
   ```sql
   UPDATE affiliate_accounts SET status = 'blocked' WHERE status = 'suspended';
   ```
   Project isn't live so this should be a no-op; still run it to be safe.

2. **`affiliate_accounts.status` — swap CHECK** (drop `suspended`):
   ```sql
   ALTER TABLE affiliate_accounts DROP CONSTRAINT <existing_status_check>;
   ALTER TABLE affiliate_accounts ADD CONSTRAINT affiliate_accounts_status_check
     CHECK (status IN ('unclaimed','active','blocked'));
   ```

3. **`affiliate_campaigns.status` — trim enum** to `'active'|'paused'|'archived'|'expired'`:
   - Defensive: update any `status IN ('draft','completed')` rows to
     reasonable targets (`draft → active`? `completed → archived`?
     Decide based on dev data — project not live, so likely zero rows).
   - Swap the CHECK constraint accordingly.

4. **`affiliate_campaigns` — drop columns**:
   - `commission_value_snapshot`
   - `commission_type_snapshot`
   - Any `owner_consistency` CHECK referencing these — replace with a
     looser check (affiliate-owned still must carry `owner_affiliate_id`,
     `owner_affiliate_type`, `source_assignment_id`).

5. **Drop System A tables** (in order, each `DROP TABLE IF EXISTS ... CASCADE`):
   - `affiliate_commission_history`
   - `affiliate_commissions`
   - `affiliate_payouts`
   - `affiliate_clicks`
   - `affiliate_referral_links`

   These must be dropped AFTER task 02 has removed all writers and AFTER
   task 04 has removed all snapshot-based readers. Running this too early
   will break the Stripe webhook.

6. **Drop System A functions / triggers** if any exist (grep migrations
   for references to the dropped tables).

## Acceptance

- Dev Supabase accepts both migrations idempotently (re-run safe).
- `\d diviner_service_affiliate_rate_history` shows expected columns +
  indexes.
- `\d bookings` shows the three new stamp columns + FK.
- `\d campaign_conversions` shows new audit + reversal columns.
- `\d admin_action_log` shows expected shape.
- `\d affiliate_campaigns` no longer lists snapshot columns AND status
  enum is trimmed after 01b.
- `\d affiliate_accounts` status CHECK lists only `unclaimed|active|blocked` after 01b.
- `SELECT * FROM affiliate_commissions` errors `relation does not exist`
  after 01b.
- RLS test (task 08): impersonated diviner sees only their own rate
  history rows.

## Verification commands

```bash
npm run migrate   # runs scripts/run-migration.js against dev
# manual SQL in psql:
#   \d+ diviner_service_affiliate_rate_history
#   \d+ admin_action_log
#   SELECT status, COUNT(*) FROM affiliate_accounts GROUP BY status;
```

## Suggested files

- `supabase/migrations/<date>0001_affiliate_commission_v2_additive.sql`
- `supabase/migrations/<date>9001_affiliate_commission_v2_destructive.sql`
- Mirror `.ts` migration files under `src/data/migrations/` if the
  project also registers migrations there (check existing pattern).
- Update `src/lib/db/migrations.ts` if used for registration.
- Spec update: no behavior changes, but bump §12 Changelog with
  "Migrations 01a + 01b applied YYYY-MM-DD".
