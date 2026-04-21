# Task 06 — Migration and Deprecation

- Status: Not Started
- Priority: P0
- Depends On: Tasks 01, 02, 03, 04, 05
- Blocks: Nothing (final task)

## Goal

Move existing `campaign_affiliates` data into the new model without losing history, keep the old `campaign_affiliates` table readable for 30 days post-cutover for audit, and retire the deprecated UI surfaces.

## Current State

- Legacy model: `campaign_affiliates` rows map affiliates to specific campaigns.
- Existing campaigns with enrolled affiliates are in production (even if `test-diviner-1` has none right now).
- New model is fully implemented after Tasks 01–05.

## Migration Strategy

The migration is **forward-only** — legacy rows are interpreted as implicit service/profile assignments based on their parent campaign's destination.

### Rule set

For each existing `campaign_affiliates` row linked to an active campaign:

1. Derive scope from the parent campaign's destination:
   - `destination_type='SERVICE'` → SERVICE-scope assignment with `destination_id = destination_service_template_id`
   - `destination_type='PROFILE'` → PROFILE-scope assignment with `destination_id = NULL`
2. Derive commission:
   - Use `campaign_affiliates.custom_commission_value` if set
   - Otherwise use the campaign's `commission_value`
   - Commission type follows the campaign's `commission_type`
3. Create a `diviner_service_affiliates` row if no active one exists for that (diviner, scope, affiliate) combination.
4. Convert the existing enrollment into an affiliate-owned campaign:
   - Create a NEW `affiliate_campaigns` row with `owner_type='affiliate'`, copying name/dates/channel from the legacy campaign.
   - Generate a fresh `code` and `tracking_links` row.
   - Reference the new assignment via `source_assignment_id`.
   - The OLD (legacy) campaign stays as-is, with `owner_type='diviner'`.
5. Migrate historical `campaign_clicks` and `campaign_conversions`:
   - Backfill `affiliate_id` on click rows where the click is traceable to a legacy enrolled affiliate (via `tracking_links → campaign → campaign_affiliates`).
   - Flag backfilled conversions with `commission_source='legacy_campaign_affiliates'`.

### Implementation

Script: `scripts/migrate-campaign-affiliates.mjs` — runs read-only in dry-run mode by default, prints a summary, then accepts `--commit` to apply.

**Required shape:**

```js
// scripts/migrate-campaign-affiliates.mjs
// Usage:
//   node scripts/migrate-campaign-affiliates.mjs           # dry-run (default)
//   node scripts/migrate-campaign-affiliates.mjs --commit  # apply changes
//
// Env required:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
const COMMIT = process.argv.includes("--commit");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Step 1: load every active campaign_affiliates row with its parent campaign
// Step 2: derive scope (destination_type + destination_id) from parent campaign
// Step 3: for each unique (diviner, scope, affiliate) tuple, upsert a diviner_service_affiliates row
// Step 4: for each legacy row, clone its parent campaign as an owner_type='affiliate' campaign
//         referencing the new assignment via source_assignment_id
// Step 5: backfill campaign_clicks.affiliate_id / commission_value_snapshot where attributable
// Step 6: flag historical campaign_conversions with commission_source='legacy_campaign_affiliates'
// Step 7: print summary (always), apply only if COMMIT

const summary = {
  legacyEnrollments: 0,
  scopeService: 0,
  scopeProfile: 0,
  assignmentsToCreate: 0,
  assignmentsExisting: 0,
  campaignsToCreate: 0,
  clicksToBackfill: 0,
  conversionsToFlag: 0,
  skipped: [],
};

// ... implementation follows the rule set above ...

console.log(COMMIT ? "APPLIED" : "DRY-RUN — no changes written");
console.log(JSON.stringify(summary, null, 2));
```

Script must be idempotent — re-running it with `--commit` should not create duplicates (use UPSERT patterns and WHERE NOT EXISTS guards).

Output summary (dry-run):
```
Legacy enrollments found:    47
  SERVICE-scope:             31
  PROFILE-scope:             16
Assignments to create:       35 (12 already exist)
Affiliate campaigns to create: 47
Historical clicks to backfill: 1243
Historical conversions to update: 89
```

The script:
1. Runs in a single transaction per diviner so partial failures roll back cleanly.
2. Respects existing rows (upserts) — re-runnable.
3. Does NOT delete `campaign_affiliates` rows.

### Feature flag

Add a server-side environment variable `NEXT_PUBLIC_AFFILIATE_ASSIGNMENT_V2` (values: `"off"` | `"on"`; default: `"off"` in prod, `"on"` in `.env.local`).

Read it via `src/lib/feature-flags.ts` (create if absent) with a single helper:

```ts
export function isAffiliateAssignmentV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_AFFILIATE_ASSIGNMENT_V2 === "on";
}
```

Use it in:
- `src/app/dashboard/campaigns/[id]/page.tsx` — hide the legacy "Enrolled Affiliates" card when flag is on.
- `src/app/dashboard/affiliates/page.tsx` — hide the Assignments tab when flag is off.
- `src/app/advocate/assignments/page.tsx` — redirect to `/advocate` when flag is off.
- Any API route that creates assignment-scoped entities — reject with 503 "Feature disabled" when flag is off.

- When OFF: legacy "Enrolled Affiliates" panel is visible on campaign detail page. New Assignments UI is hidden.
- When ON: new UI visible, legacy panel hidden (read-only banner says "Enrollment moved to Assignments — see My Assignments in the Diviner Settings").

Cutover plan:
1. Deploy code with flag OFF → no user-visible change, schema + migration ready.
2. Run migration script (dry-run, then commit) in staging → verify counts and sample spot-checks.
3. Deploy to prod, run migration in prod.
4. Flip flag ON in dev → diviner + affiliate dashboards render the new UI.
5. Internal QA → one full end-to-end loop (create assignment → create campaign → generate click → generate conversion).
6. Flip flag ON in prod.
7. Monitor 30 days; after stability, drop the legacy `campaign_affiliates` table in a follow-up migration.

### Communications (non-technical)

- Notify existing diviners with active enrollments: "Your affiliate enrollments have moved. Visit /dashboard/affiliates → Assignments to review and manage them. Commission rates and active campaigns have been preserved."
- Notify existing affiliates: "Your campaigns are now manageable from /advocate/campaigns. The assignments authorizing those campaigns appear under /advocate/assignments."

## Verification Plan

1. Stage a copy of production data with 10+ enrolled affiliates across 3+ campaigns.
2. Run the migration script in dry-run → verify counts match expectations.
3. Run with `--commit` → verify:
   - `diviner_service_affiliates` has one row per unique (diviner, scope, affiliate) combination.
   - `affiliate_campaigns` has new `owner_type='affiliate'` rows with correct `source_assignment_id`.
   - `tracking_links` has new codes for those new campaigns.
   - `campaign_clicks` historical rows for legacy campaigns have `affiliate_id` backfilled where appropriate.
   - `campaign_conversions` historical rows flagged `legacy_campaign_affiliates`.
4. Re-run migration — no duplicate rows, script is idempotent.
5. Flip flag ON in staging → diviner and affiliate dashboards render the migrated data correctly.
6. Revoke a migrated assignment → trigger pauses the matching affiliate campaign.
7. Roll back the flag → legacy UI returns, migrated data stays.

## Edge Cases

- Campaign with `destination_type=NULL` (older model before entity-based destinations) → skip in migration, log a warning.
- Affiliate was enrolled in two campaigns for the same scope and same diviner → one `diviner_service_affiliates` row created; both legacy campaigns still exist with their own history; two new affiliate-owned campaigns created.
- Legacy campaign's `custom_commission_value` differs across enrollments in the same scope → keep the `custom_commission_value` on the *new* affiliate campaign in `commission_value_snapshot`, but the assignment-level rate uses the most recent enrollment.
- Deleted / archived legacy campaign → don't migrate; surface in a report.

## Rollback Plan

1. Flip the feature flag OFF — UI reverts to legacy.
2. Migrated data in `diviner_service_affiliates` and new `affiliate_campaigns` rows stays; no harm done.
3. If rollback is permanent, a separate cleanup script can delete the migrated `owner_type='affiliate'` rows where `source_assignment_id IS NOT NULL` — but rolling forward is the default.

## Post-migration Cleanup (follow-up sprint)

- Drop `campaign_affiliates` table after 30 days of stability.
- Remove the legacy "Enrolled Affiliates" panel code (deleted from `src/app/dashboard/campaigns/[id]/page.tsx` and related API routes).
- Remove the feature flag.
