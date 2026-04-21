# Task 01 — Schema Foundation

- Status: Not Started
- Priority: P0
- Depends On: Sprint 2026-04-17 (all tables)
- Blocks: Tasks 02, 03, 04, 05, 06

## Goal

Lay the full data foundation for the new affiliate model in one migration:

- New `diviner_service_affiliates` table (the source of truth for affiliate assignments).
- Extend `affiliate_campaigns` with owner-type columns so a campaign can be owned by a diviner or an affiliate.
- Extend `campaign_clicks` and `campaign_conversions` to capture affiliate attribution + frozen commission snapshots.
- Add `ref_code` column to `bookings` so the URL attribution chain survives to conversion.
- Indexes aligned with the real queries the UI will run.
- RLS policies for per-role access.

## Current State

- `affiliate_campaigns` has `diviner_id, destination_type, destination_service_template_id, destination_profile_id, status, commission_type, commission_value, budget_cap_cents, spent_cents, start_date, end_date, channel`.
- `campaign_affiliates` maps campaign → affiliate with `custom_commission_value`. UNIQUE on `(campaign_id, affiliate_id, affiliate_type)`.
- `campaign_clicks` has campaign, tracking_link, destination fields, click metadata, but **no `affiliate_id`**.
- `campaign_conversions` has `campaign_id, affiliate_id, affiliate_type, order_reference, order_amount_cents, commission_amount_cents`.
- `bookings` has no `ref_code` or attribution link.

## Migration delivery pattern (read first)

This project uses a custom **in-app migration runner** at `/admin/db/migrations`. Migrations are NOT applied via `supabase db push` against prod — they're deployed as code and then triggered by an admin clicking **Run migration** on that page. Full guide: `docs/db-migrations.md`.

Every migration produced by this task requires **three files** (not one):

| # | File | Purpose |
|---|---|---|
| 1 | `supabase/migrations/<id>.sql` | Canonical SQL. Idempotent. Source of truth. |
| 2 | `src/data/migrations/<id>.ts` | Bundled mirror — the same SQL as a template literal so the deployed Vercel function has the SQL in memory (no `fs` at runtime). |
| 3 | An entry in `src/lib/db/migrations.ts` | Registers the migration in the allowlist that `/admin/db/migrations` reads. |

### Idempotency rules (NON-NEGOTIABLE — the runner may be re-clicked)

| Operation | Required form |
|---|---|
| Create table | `CREATE TABLE IF NOT EXISTS …` |
| Add column | `ADD COLUMN IF NOT EXISTS …` |
| Create index | `CREATE INDEX IF NOT EXISTS …` / `CREATE UNIQUE INDEX IF NOT EXISTS …` |
| Create function | `CREATE OR REPLACE FUNCTION …` |
| Create trigger | `DROP TRIGGER IF EXISTS … ; CREATE TRIGGER …` |
| Create RLS policy | Guard with `DO $$ IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE …) …` |
| Insert seed | `INSERT … ON CONFLICT … DO NOTHING` |

### No DROPs in this migration

This is an additive-only migration. Any DROP (dropping `campaign_affiliates`, dropping deprecated columns) lives in a **follow-up migration** shipped in a separate sprint, after all consumers have been updated and the feature flag has been on in prod for 30+ days.

### After deploying — how to run

1. Commit all three files.
2. `git push origin master` → Vercel auto-deploys (~2 min).
3. Open `/admin/db/migrations` as admin.
4. Find the new entry (`20260421000001 — Affiliate Service Assignments`).
5. Click **Run migration**. The result panel renders inline.
6. Success = green `ok: true` badge + Supabase Management API response in the body.

## Implementation Steps

### 1. SQL file

Create `supabase/migrations/20260421000001_affiliate_service_assignments.sql`.

### 2. `diviner_service_affiliates` table

```sql
CREATE TABLE IF NOT EXISTS diviner_service_affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,

  -- Scope: the destination the affiliate is authorized to promote
  destination_type TEXT NOT NULL CHECK (destination_type IN ('PROFILE', 'SERVICE')),
  destination_id   UUID,  -- NULL when PROFILE, template_id when SERVICE

  -- Affiliate identity
  affiliate_id   UUID NOT NULL,
  affiliate_type TEXT NOT NULL CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),

  -- Commercial terms
  commission_type  TEXT NOT NULL CHECK (commission_type IN ('percent', 'flat')) DEFAULT 'percent',
  commission_value NUMERIC(10,4) NOT NULL CHECK (commission_value >= 0),

  -- Lifecycle
  is_active    BOOLEAN NOT NULL DEFAULT true,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by  UUID REFERENCES auth.users(id),
  revoked_at   TIMESTAMPTZ,
  revoked_by   UUID REFERENCES auth.users(id),
  notes        TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Two scopes per (diviner, affiliate) max: PROFILE and one SERVICE row per template
  CONSTRAINT diviner_service_affiliates_scope_valid CHECK (
    (destination_type = 'PROFILE' AND destination_id IS NULL)
    OR (destination_type = 'SERVICE' AND destination_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX ux_diviner_service_affiliates_scope_active
  ON diviner_service_affiliates (diviner_id, destination_type, destination_id, affiliate_id, affiliate_type)
  WHERE is_active = true;

CREATE INDEX idx_diviner_service_affiliates_affiliate
  ON diviner_service_affiliates (affiliate_id, affiliate_type, is_active);

CREATE INDEX idx_diviner_service_affiliates_diviner
  ON diviner_service_affiliates (diviner_id, is_active);
```

### 3. Extend `affiliate_campaigns`

```sql
ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS owner_type           TEXT NOT NULL DEFAULT 'diviner'
    CHECK (owner_type IN ('diviner', 'affiliate')),
  ADD COLUMN IF NOT EXISTS owner_affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS owner_affiliate_type TEXT
    CHECK (owner_affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS commission_value_snapshot NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS commission_type_snapshot  TEXT
    CHECK (commission_type_snapshot IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS source_assignment_id UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL;

-- Constraint: affiliate-owned campaigns MUST have owner info + snapshot
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
    (owner_type = 'diviner'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_type IS NULL
      AND commission_value_snapshot IS NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_id IS NOT NULL
      AND owner_affiliate_type IS NOT NULL
      AND commission_value_snapshot IS NOT NULL
      AND source_assignment_id IS NOT NULL)
  );

CREATE INDEX idx_campaigns_owner_affiliate
  ON affiliate_campaigns (owner_affiliate_id, owner_affiliate_type, status)
  WHERE owner_type = 'affiliate';
```

### 4. Extend `campaign_clicks`

```sql
ALTER TABLE campaign_clicks
  ADD COLUMN IF NOT EXISTS affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS affiliate_type TEXT
    CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS commission_value_snapshot NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS commission_type_snapshot  TEXT
    CHECK (commission_type_snapshot IN ('percent', 'flat')),
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX idx_campaign_clicks_affiliate
  ON campaign_clicks (affiliate_id, affiliate_type)
  WHERE affiliate_id IS NOT NULL;

CREATE INDEX idx_campaign_clicks_ref_code
  ON campaign_clicks (ref_code)
  WHERE ref_code IS NOT NULL;
```

### 5. Extend `campaign_conversions`

```sql
ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ref_code_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS commission_source TEXT NOT NULL DEFAULT 'campaign_assignment'
    CHECK (commission_source IN ('campaign_assignment', 'legacy_campaign_affiliates', 'manual_override')),
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reversed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reversal_reason TEXT;

CREATE INDEX idx_campaign_conversions_booking
  ON campaign_conversions (booking_id) WHERE booking_id IS NOT NULL;

-- Idempotency: one conversion row per booking (Task 03 relies on this)
CREATE UNIQUE INDEX IF NOT EXISTS ux_campaign_conversions_booking
  ON campaign_conversions (booking_id) WHERE booking_id IS NOT NULL;
```

### 6. `bookings.ref_code`

```sql
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX idx_bookings_ref_code
  ON bookings (ref_code) WHERE ref_code IS NOT NULL;
```

### 6a. Extend `page_views` (analytics funnel support)

Without these columns the click → view → book funnel cannot be joined at the view layer. Low-cost, high-analytical-value addition — required for per-view affiliate attribution in future analytics.

```sql
ALTER TABLE page_views
  ADD COLUMN IF NOT EXISTS affiliate_id   UUID,
  ADD COLUMN IF NOT EXISTS affiliate_type TEXT
    CHECK (affiliate_type IN ('diviner_affiliate', 'social_advocate')),
  ADD COLUMN IF NOT EXISTS ref_code TEXT;

CREATE INDEX idx_page_views_ref_code
  ON page_views (ref_code) WHERE ref_code IS NOT NULL;

CREATE INDEX idx_page_views_affiliate
  ON page_views (affiliate_id, affiliate_type)
  WHERE affiliate_id IS NOT NULL;
```

The `page_views` table is defined in `supabase/migrations/20260401000002_analytics.sql`.

### 7. Trigger — auto-sync assignment → campaigns

When an assignment is revoked (is_active = false), pause all affiliate-owned campaigns pointing at the same destination:

```sql
CREATE OR REPLACE FUNCTION auto_pause_affiliate_campaigns_on_revoke()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND (OLD.is_active = true OR OLD.is_active IS NULL) THEN
    UPDATE affiliate_campaigns
       SET status = 'paused',
           auto_pause_reason = 'assignment_revoked',
           auto_paused_at = now()
     WHERE owner_type = 'affiliate'
       AND owner_affiliate_id = NEW.affiliate_id
       AND owner_affiliate_type = NEW.affiliate_type
       AND diviner_id = NEW.diviner_id
       AND status = 'active'
       AND (
            (NEW.destination_type = 'PROFILE' AND destination_type = 'PROFILE')
         OR (NEW.destination_type = 'SERVICE'
             AND destination_type = 'SERVICE'
             AND destination_service_template_id = NEW.destination_id)
       );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_pause_affiliate_campaigns
  AFTER UPDATE OF is_active ON diviner_service_affiliates
  FOR EACH ROW EXECUTE FUNCTION auto_pause_affiliate_campaigns_on_revoke();
```

### 8. RLS policies

```sql
ALTER TABLE diviner_service_affiliates ENABLE ROW LEVEL SECURITY;

-- Diviner can see their own assignments
CREATE POLICY diviner_service_affiliates_select_diviner
  ON diviner_service_affiliates FOR SELECT
  USING (
    diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
  );

-- Affiliate can see assignments naming them
CREATE POLICY diviner_service_affiliates_select_affiliate
  ON diviner_service_affiliates FOR SELECT
  USING (
    affiliate_id = auth.uid()  -- adjust if affiliate_id maps differently
  );

-- Only the owning diviner (or admin) can insert/update/delete
CREATE POLICY diviner_service_affiliates_write_diviner
  ON diviner_service_affiliates FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
  WITH CHECK (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));
```

### 9. TypeScript types

Add `src/types/affiliate-assignment.ts` exporting `DivinerServiceAffiliate`, `AffiliateCampaignOwnerType`, and extending existing `AffiliateCampaign` type.

### 10. Bundle the SQL as a TS module

Create `src/data/migrations/20260421000001_affiliate_service_assignments.ts` using the repo's Python helper (from `docs/db-migrations.md` walkthrough):

```bash
python3 - <<'PY'
sql = open('supabase/migrations/20260421000001_affiliate_service_assignments.sql').read()
escaped = sql.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
header = (
  '// AUTO-GENERATED bundled mirror of '
  'supabase/migrations/20260421000001_affiliate_service_assignments.sql\n'
  '// Used by /api/admin/db/migrate so the deployed function does not need fs.\n'
  '\n'
  'export const MIGRATION_SQL = `'
)
open('src/data/migrations/20260421000001_affiliate_service_assignments.ts','w').write(header + escaped + '`;\n')
PY
```

Verify the mirror:
```bash
# Count must match between the two files
grep -c "CREATE TABLE" supabase/migrations/20260421000001_affiliate_service_assignments.sql
grep -c "CREATE TABLE" src/data/migrations/20260421000001_affiliate_service_assignments.ts
# expect: both report the same integer
```

### 11. Register in the allowlist

Open `src/lib/db/migrations.ts` and add (preserve alphabetical/chronological ordering of existing imports and entries):

```ts
import { MIGRATION_SQL as MIG_20260421000001 } from "@/data/migrations/20260421000001_affiliate_service_assignments";

// Inside const MIGRATIONS: Record<string, MigrationDescriptor> = { ... } :
  "20260421000001_affiliate_service_assignments": {
    id: "20260421000001_affiliate_service_assignments",
    title: "Affiliate Service Assignments + URL Attribution",
    description: "New diviner_service_affiliates table. Extends affiliate_campaigns with owner_type / owner_affiliate_id / commission snapshot. Extends campaign_clicks + campaign_conversions + page_views + bookings with affiliate attribution fields. Adds idempotency constraints and auto-pause trigger.",
    sortKey: "20260421000001",
    sql: MIG_20260421000001,
  },
```

The `id` in both the property key and the `id` field must match the `.sql` filename stem exactly — the runner uses this string as the dispatch key.

## Verification Plan

### A. Local dev
Run `supabase db reset` locally to validate the SQL — this catches syntax errors before deploy.

### B. Bundle parity
```bash
# Before pushing, confirm the .ts mirror matches the .sql
diff <(grep -c "CREATE TABLE\|ALTER TABLE\|CREATE INDEX\|CREATE POLICY\|CREATE TRIGGER\|CREATE FUNCTION" supabase/migrations/20260421000001_affiliate_service_assignments.sql) <(grep -c "CREATE TABLE\|ALTER TABLE\|CREATE INDEX\|CREATE POLICY\|CREATE TRIGGER\|CREATE FUNCTION" src/data/migrations/20260421000001_affiliate_service_assignments.ts)
# expect: 0 (no diff)
```

### C. Runner visibility
After deploy, visit `/admin/db/migrations` as admin. Expect:
- `20260421000001 — Affiliate Service Assignments + URL Attribution` appears in the list.
- `SQL size` column shows a non-zero character count.
- Green "Access token: configured" badge at the top.

### D. Run + SQL assertions
Click **Run migration**. Expect green Success card with `ok: true`. Then run the following assertions (directly in Supabase SQL editor or via `psql`):

1. **Migration applies cleanly**
   ```sql
   SELECT migration_name FROM supabase_migrations.schema_migrations
    WHERE migration_name LIKE '20260421000001%';
   -- expect: 1 row
   ```

2. **Both scope rows coexist for same (diviner, affiliate)**
   ```sql
   INSERT INTO diviner_service_affiliates
     (diviner_id, destination_type, destination_id, affiliate_id, affiliate_type, commission_type, commission_value)
   VALUES
     ('<diviner-uuid>', 'PROFILE', NULL, '<affiliate-uuid>', 'social_advocate', 'percent', 10),
     ('<diviner-uuid>', 'SERVICE', '<template-uuid>', '<affiliate-uuid>', 'social_advocate', 'percent', 20);
   SELECT COUNT(*) FROM diviner_service_affiliates
    WHERE diviner_id = '<diviner-uuid>' AND affiliate_id = '<affiliate-uuid>' AND is_active;
   -- expect: 2
   ```

3. **Revoking assignment pauses matching affiliate campaigns**
   Seed one `owner_type='affiliate'` campaign for the SERVICE assignment, status='active'. Then:
   ```sql
   UPDATE diviner_service_affiliates SET is_active = false
    WHERE destination_type = 'SERVICE' AND destination_id = '<template-uuid>'
      AND affiliate_id = '<affiliate-uuid>';
   SELECT status, auto_pause_reason FROM affiliate_campaigns WHERE source_assignment_id = '<assignment-id>';
   -- expect: status='paused', auto_pause_reason='assignment_revoked'
   ```

4. **Affiliate-owned campaign requires owner info** — should REJECT:
   ```sql
   INSERT INTO affiliate_campaigns (diviner_id, name, status, owner_type)
     VALUES ('<diviner-uuid>', 'bad', 'draft', 'affiliate');
   -- expect: ERROR violates constraint "affiliate_campaigns_owner_consistency"
   ```

5. **Diviner-owned campaign cannot carry commission snapshot** — should REJECT:
   ```sql
   INSERT INTO affiliate_campaigns (diviner_id, name, status, owner_type, commission_value_snapshot)
     VALUES ('<diviner-uuid>', 'bad', 'draft', 'diviner', 20);
   -- expect: ERROR violates constraint "affiliate_campaigns_owner_consistency"
   ```

6. **Existing campaigns default to owner_type='diviner'**
   ```sql
   SELECT COUNT(*) FROM affiliate_campaigns WHERE owner_type IS NULL;
   -- expect: 0
   SELECT COUNT(*) FROM affiliate_campaigns WHERE owner_type = 'diviner';
   -- expect: equals original campaign count before migration
   ```

7. **Conversion idempotency constraint works**
   ```sql
   INSERT INTO campaign_conversions (campaign_id, affiliate_id, affiliate_type, booking_id, order_amount_cents, commission_amount_cents)
     VALUES ('<campaign-uuid>', '<affiliate-uuid>', 'social_advocate', '<booking-uuid>', 10000, 2000);
   -- Repeat the exact same insert:
   INSERT INTO campaign_conversions (campaign_id, affiliate_id, affiliate_type, booking_id, order_amount_cents, commission_amount_cents)
     VALUES ('<campaign-uuid>', '<affiliate-uuid>', 'social_advocate', '<booking-uuid>', 10000, 2000);
   -- expect second INSERT: ERROR duplicate key value violates unique constraint "ux_campaign_conversions_booking"
   ```

8. **page_views extension present**
   ```sql
   SELECT column_name FROM information_schema.columns
    WHERE table_name='page_views' AND column_name IN ('ref_code','affiliate_id','affiliate_type');
   -- expect: 3 rows
   ```

## Edge Cases

- Existing rows in `affiliate_campaigns` without `owner_type` → default to `'diviner'` on ALTER. Confirm via a SELECT COUNT after migration.
- `diviner_service_affiliates_scope_valid` CHECK prevents a SERVICE row with NULL destination_id and a PROFILE row with a destination_id.
- RLS on `affiliates` lookup must allow the affiliate to find their own assignments — adjust `affiliate_id = auth.uid()` to match the actual auth-to-affiliate join if different.

## Rollback Plan

```sql
DROP TRIGGER IF EXISTS trg_auto_pause_affiliate_campaigns ON diviner_service_affiliates;
DROP FUNCTION IF EXISTS auto_pause_affiliate_campaigns_on_revoke();
DROP TABLE IF EXISTS diviner_service_affiliates CASCADE;
ALTER TABLE affiliate_campaigns
  DROP COLUMN IF EXISTS owner_type,
  DROP COLUMN IF EXISTS owner_affiliate_id,
  DROP COLUMN IF EXISTS owner_affiliate_type,
  DROP COLUMN IF EXISTS commission_value_snapshot,
  DROP COLUMN IF EXISTS commission_type_snapshot,
  DROP COLUMN IF EXISTS source_assignment_id;
ALTER TABLE campaign_clicks
  DROP COLUMN IF EXISTS affiliate_id,
  DROP COLUMN IF EXISTS affiliate_type,
  DROP COLUMN IF EXISTS commission_value_snapshot,
  DROP COLUMN IF EXISTS commission_type_snapshot,
  DROP COLUMN IF EXISTS ref_code;
ALTER TABLE campaign_conversions
  DROP COLUMN IF EXISTS booking_id,
  DROP COLUMN IF EXISTS ref_code_snapshot,
  DROP COLUMN IF EXISTS commission_source,
  DROP COLUMN IF EXISTS reversed_at,
  DROP COLUMN IF EXISTS reversed_by,
  DROP COLUMN IF EXISTS reversal_reason;
DROP INDEX IF EXISTS ux_campaign_conversions_booking;
ALTER TABLE page_views
  DROP COLUMN IF EXISTS affiliate_id,
  DROP COLUMN IF EXISTS affiliate_type,
  DROP COLUMN IF EXISTS ref_code;
ALTER TABLE bookings DROP COLUMN IF EXISTS ref_code;
```
