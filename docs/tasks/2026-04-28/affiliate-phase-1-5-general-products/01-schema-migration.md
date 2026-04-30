# Task 01 — Schema Migration

- Status: Not Started
- Priority: P0
- Depends on: —
- Blocks: 02, 03, 04, 05, 06, 07, 08
- Spec: §10 Phase 1.5 (locked decisions 1–5)

## Goal

Single additive migration that lands every column, constraint, and RLS
extension Phase 1.5 needs. Idempotent + sanity-checked, following the
pattern set by 20260424000010 (additive) and 20260427000004 (RLS
SECURITY DEFINER).

## Migration

**Files (all three required):**
- `supabase/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general.sql` (canonical)
- `src/data/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general.ts` (TS mirror — keep byte-aligned with the SQL; the admin migrations UI reads from this)
- An import + entry in `src/lib/db/migrations.ts` (allowlist registration)

**Pick the date prefix carefully.** Run
`ls supabase/migrations/<YYYYMMDD>*` first — if anything else already
landed today with the `0001` suffix, bump to `0002`. We hit a real
prefix-collision bug on 2026-04-27 when `0001_saved_report_linkage`
silently shadowed our RLS migration. Don't repeat it.

**TS mirror shape** — match the existing pattern at
`src/data/migrations/20260427000004_affiliate_rls_security_definer.ts`:

```ts
// Bundled mirror of supabase/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general.sql
// Keep byte-aligned with the canonical .sql file.

export const MIGRATION_SQL = `
-- (paste the entire SQL body verbatim, with `$$ ... $$` blocks renamed
--  to `$check$ ... $check$` etc. to avoid template-literal escape issues)
`;
```

Then in `src/lib/db/migrations.ts`:
```ts
import { MIGRATION_SQL as MIG_<YYYYMMDD>0001_AP15G }
  from "@/data/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general";
// ...
"<YYYYMMDD>0001_affiliate_phase_1_5_general": {
  id: "<YYYYMMDD>0001_affiliate_phase_1_5_general",
  title: "Affiliate Phase 1.5 — general-product commissions schema",
  description: "Adds service_templates.{is_general, commission_type, commission_value, affiliate_program_enabled} (backfills is_general from `slug LIKE 'general-%'`); affiliate_campaigns.owner_affiliate_account_id + extended owner_affiliate_type enum + tightened owner_consistency CHECK; bookings.commission_source_template_id; campaign_conversions.affiliate_account_id; extends affiliate-side RLS policies for general campaigns and conversions. Backfills affiliate_account_id on existing per-diviner conversions. Idempotent + sanity-checked.",
  sortKey: "<YYYYMMDD>0001",
  sql: MIG_<YYYYMMDD>0001_AP15G,
},
```

```sql
BEGIN;

-- ─── 1a. service_templates: introduce is_general flag ─────────────────────
-- Pre-flight (2026-04-28) confirmed there's NO is_general column today.
-- Migration 20260421000002_add_general_service_templates.sql cloned the
-- 19 base templates with `general-` slug prefix only — no flag column.
-- Add the flag here and backfill from the slug pattern; keep slug as the
-- secondary signal but make is_general the authoritative discriminator.

ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS is_general BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE service_templates
   SET is_general = TRUE
 WHERE slug LIKE 'general-%'
   AND is_general = FALSE;

CREATE INDEX IF NOT EXISTS idx_service_templates_is_general
  ON service_templates (is_general)
  WHERE is_general = TRUE;

-- ─── 1b. service_templates: per-template commission config ─────────────────
ALTER TABLE service_templates
  ADD COLUMN IF NOT EXISTS commission_type TEXT
    CHECK (commission_type IS NULL OR commission_type IN ('percentage','flat')),
  ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS affiliate_program_enabled BOOLEAN NOT NULL DEFAULT FALSE;
-- Only meaningful when is_general = true. Diviner-specific rows leave
-- these NULL/FALSE.

-- ─── 2. affiliate_campaigns: account-direct ownership for non-junction ─────
ALTER TABLE affiliate_campaigns
  ADD COLUMN IF NOT EXISTS owner_affiliate_account_id UUID
    REFERENCES affiliate_accounts(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_affiliate_campaigns_owner_account
  ON affiliate_campaigns (owner_affiliate_account_id)
  WHERE owner_affiliate_account_id IS NOT NULL;

-- Allow 'general' as a third value of owner_affiliate_type
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_affiliate_type_check;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_affiliate_type_check
  CHECK (owner_affiliate_type IS NULL
      OR owner_affiliate_type IN ('diviner_affiliate','social_advocate','general'));

-- Tighten owner_consistency CHECK to require account_id when type='general'
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_consistency;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
    (owner_type = 'diviner'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NULL
      AND owner_affiliate_type IS NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type IN ('diviner_affiliate','social_advocate')
      AND owner_affiliate_id IS NOT NULL
      AND owner_affiliate_account_id IS NULL
      AND source_assignment_id IS NOT NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NOT NULL
      AND source_assignment_id IS NULL
      AND destination_service_template_id IS NOT NULL)
  );

-- ─── 3. bookings: parallel stamp source for general program ────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_source_template_id UUID
    REFERENCES service_templates(id) ON DELETE SET NULL;
-- Parallel to commission_source_assignment_id; populated by the general-
-- path branch of resolveStampForBooking.

-- ─── 4. campaign_conversions: account-direct attribution ───────────────────
ALTER TABLE campaign_conversions
  ADD COLUMN IF NOT EXISTS affiliate_account_id UUID
    REFERENCES affiliate_accounts(id);

CREATE INDEX IF NOT EXISTS idx_campaign_conversions_affiliate_account
  ON campaign_conversions (affiliate_account_id, created_at DESC)
  WHERE affiliate_account_id IS NOT NULL;

-- Backfill existing rows: resolve junction → account for per-diviner
-- credits so account-level rollups don't have to JOIN.
UPDATE campaign_conversions c
   SET affiliate_account_id = da.affiliate_account_id
  FROM diviner_affiliates da
 WHERE c.affiliate_account_id IS NULL
   AND c.affiliate_id = da.id
   AND c.affiliate_type = 'diviner_affiliate';

-- ─── 5. RLS on affiliate_campaigns: extend SELECT/INSERT/UPDATE to account ─
DROP POLICY IF EXISTS affiliate_sees_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_sees_own_campaigns
  ON affiliate_campaigns FOR SELECT
  USING (
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

DROP POLICY IF EXISTS affiliate_inserts_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_inserts_own_campaigns
  ON affiliate_campaigns FOR INSERT
  WITH CHECK (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

DROP POLICY IF EXISTS affiliate_updates_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_updates_own_campaigns
  ON affiliate_campaigns FOR UPDATE
  USING (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  )
  WITH CHECK (
    (owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );

-- ─── 6. RLS on campaign_conversions: add general-account SELECT ────────────
-- The existing affiliate_sees_own_conversions policy from
-- 20260427000004 covers per-diviner credits via the junction. Add a
-- parallel policy for general credits so an authed affiliate sees their
-- own general-program conversions. Both policies OR together at
-- evaluation time — no need to drop the existing one.

DROP POLICY IF EXISTS affiliate_sees_own_conversions_general ON campaign_conversions;
CREATE POLICY affiliate_sees_own_conversions_general
  ON campaign_conversions FOR SELECT
  USING (
    affiliate_type = 'general'
    AND affiliate_account_id = public.current_affiliate_account_id()
  );

-- ─── 7. End-of-migration sanity check ──────────────────────────────────────
DO $check$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_templates'
      AND column_name='is_general'
  ) THEN
    RAISE EXCEPTION 'service_templates.is_general not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='affiliate_campaigns'
      AND column_name='owner_affiliate_account_id'
  ) THEN
    RAISE EXCEPTION 'owner_affiliate_account_id column not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_templates'
      AND column_name='affiliate_program_enabled'
  ) THEN
    RAISE EXCEPTION 'affiliate_program_enabled column not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='campaign_conversions'
      AND column_name='affiliate_account_id'
  ) THEN
    RAISE EXCEPTION 'campaign_conversions.affiliate_account_id not added';
  END IF;
  -- Backfill sanity: at least one row should be flagged is_general after
  -- the slug-based UPDATE if the 20260421000002 clone migration ran.
  IF EXISTS (SELECT 1 FROM service_templates WHERE slug LIKE 'general-%')
     AND NOT EXISTS (SELECT 1 FROM service_templates WHERE is_general = TRUE) THEN
    RAISE EXCEPTION 'is_general backfill from slug pattern produced 0 rows';
  END IF;
END
$check$;

COMMIT;
```

## RLS posture on tables NOT touched

Inherited as-is — no new policies needed:
- **`service_templates`**: `service_role` FOR ALL via existing admin
  policies; public SELECT policy already exists for shopping pages.
  The new commission columns inherit this posture.
- **`bookings`**: existing RLS unchanged. The new
  `commission_source_template_id` column is just data; reads/writes
  follow existing booking policies.

## Acceptance

- [ ] Migration runs cleanly on dev Supabase.
- [ ] Re-running the migration is a no-op (every statement guarded).
- [ ] Sanity check at end raises descriptive errors if any column missed.
- [ ] No existing v2 query breaks (per-diviner code path unchanged).
- [ ] `git grep -wE "owner_affiliate_account_id"` returns hits only in
      this migration + the TS mirror at this point (code consumers come
      in tasks 02–07).

## Suggested files

- `supabase/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general.sql`
- `src/data/migrations/<YYYYMMDD>0001_affiliate_phase_1_5_general.ts`
- `src/lib/db/migrations.ts` (allowlist entry)
