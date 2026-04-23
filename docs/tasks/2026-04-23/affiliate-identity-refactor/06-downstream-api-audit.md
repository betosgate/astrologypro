# Task 06 — Downstream API Audit

- Status: Not Started
- Priority: P1 (High)
- Depends On: 01
- Blocks: 02, 04, 05

## Goal

Walk every file in the repo that touches `diviner_affiliates`. Classify each: relationship-only (no change), identity-reader (rewrite to JOIN `affiliate_accounts`), writer (rewrite to go through canonical helpers or RPC), or direct-add caller (migrate to invite). Confirm no surprise callers of the soon-deleted `POST /api/dashboard/affiliates`. Preserve shipped API response shapes to avoid blast-radius on the UI.

This is the mechanical task — highest risk because a missed caller silently regresses analytics / commissions / the Stripe webhook.

## Don't touch

- Legacy `affiliates` table + its 5 callers.
- `social_advocates` and anything under `/advocate/*` or `/api/advocate/*` or `/join/advocate`.
- `diviner_service_affiliates`, `affiliate_campaigns`, `campaign_clicks`, `campaign_conversions`, `page_views` — the shipped V2 model.
- `affiliate_referrals` (social-advocate referral table, despite its misleading name).
- The `/affiliate/[code]` public referral landing — it reads the legacy `affiliates` table by design.

## Current State (known grep)

Files that touch `diviner_affiliates` (re-run the grep during execution; list may drift):

**Tier A — identity-reader API routes (must rewrite to join `affiliate_accounts`)**

- `src/app/api/dashboard/affiliates/route.ts` (GET)
- `src/app/api/dashboard/affiliates/[id]/route.ts`
- `src/app/api/dashboard/affiliates/[id]/commissions/route.ts`
- `src/app/api/dashboard/affiliates/[id]/commissions/export/route.ts`
- `src/app/api/dashboard/affiliates/[id]/payouts/route.ts`
- `src/app/api/dashboard/affiliates/[id]/links/route.ts`
- `src/app/api/dashboard/affiliates/[id]/disputes/route.ts`
- `src/app/api/dashboard/affiliates/reports/route.ts`
- `src/app/api/dashboard/affiliates/summary/route.ts`
- `src/app/api/dashboard/affiliates/search/route.ts`
- `src/app/api/dashboard/affiliate-commission/affiliates/route.ts`
- `src/app/api/dashboard/affiliate-commission/summary/route.ts`
- `src/app/api/dashboard/affiliate-commission/commissions/route.ts`
- `src/app/api/dashboard/affiliate-commission/ledger/route.ts`
- `src/app/api/dashboard/affiliate-commission/ledger/[id]/route.ts`
- `src/app/api/dashboard/affiliate-commission/links/route.ts`
- `src/app/api/dashboard/affiliate-commission/payouts/route.ts`
- `src/app/api/dashboard/affiliate-commission/payouts/[id]/route.ts`
- `src/app/api/dashboard/affiliate-commission/rules/route.ts`
- `src/app/api/dashboard/affiliate-commission/rules/[id]/route.ts`
- `src/app/api/dashboard/campaigns/[id]/route.ts` (identity-joined if present)
- `src/app/api/dashboard/campaigns/[id]/affiliates/route.ts`
- `src/app/api/dashboard/campaigns/[id]/analytics/route.ts` (owner identity display)
- `src/app/api/admin/affiliates/route.ts`
- `src/app/api/admin/affiliates/[id]/route.ts`
- `src/app/api/admin/affiliates/[id]/commissions/route.ts`
- `src/app/api/admin/affiliates/[id]/commissions/export/route.ts`
- `src/app/api/admin/affiliates/[id]/commission-rules/route.ts`
- `src/app/api/admin/affiliates/[id]/disputes/route.ts`
- `src/app/api/admin/affiliates/[id]/payouts/route.ts`
- `src/app/api/admin/affiliates/disputes/[disputeId]/route.ts`
- `src/app/api/admin/analytics/affiliates/route.ts`
- `src/app/api/admin/analytics/affiliates/[id]/route.ts`
- `src/app/api/admin/analytics/affiliates/[id]/export/route.ts`
- `src/app/api/admin/analytics/affiliates/export/route.ts`
- `src/app/api/admin/analytics/commission/route.ts`
- `src/app/api/admin/analytics/commission/export/route.ts`
- `src/app/api/admin/analytics/campaigns/route.ts` (2026-04-22 — affiliate identity for row display)
- `src/app/api/admin/analytics/campaigns/export/route.ts` (same)
- `src/app/api/admin/campaigns/analytics/route.ts`
- `src/app/api/admin/campaigns/reports/route.ts`
- `src/app/api/admin/campaigns/[id]/route.ts` (owner identity display)
- `src/app/api/admin/reports/users/route.ts`
- `src/app/api/admin/reports/affiliates/route.ts`
- `src/app/api/dashboard/affiliate-assignments/route.ts`
- `src/app/api/dashboard/affiliate-assignments/[id]/route.ts`
- `src/app/api/stripe/webhooks/route.ts` (carefully — commission path)

**Tier A — identity-reader pages (Server Components)**

- `src/app/admin/affiliates/page.tsx`
- `src/app/admin/affiliates/[id]/page.tsx`
- `src/app/admin/analytics/affiliates/page.tsx`
- `src/app/admin/analytics/affiliates/[id]/page.tsx`
- `src/app/admin/reports/affiliates/page.tsx`
- `src/app/admin/users/[id]/page.tsx`
- `src/app/dashboard/affiliates/page.tsx` (minor — most is client-side already)
- `src/app/dashboard/affiliates/[id]/page.tsx`
- `src/app/dashboard/affiliates/assignments/page.tsx`
- `src/app/dashboard/affiliates/assignments/[id]/page.tsx`
- `src/app/dashboard/affiliates/reports/page.tsx`
- `src/app/dashboard/affiliate-commission/page.tsx`
- `src/app/dashboard/affiliate-commission/[affiliateId]/page.tsx`
- `src/app/affiliate/dashboard/page.tsx` (Task 05 also rewrites — coordinate)
- `src/app/affiliate/campaigns/page.tsx`
- `src/app/affiliate/commissions/page.tsx`
- `src/app/affiliate/earnings/page.tsx` (Task 05 full rewrite — coordinate)
- `src/app/affiliate/links/page.tsx`

**Tier B — relationship-only libs (likely no change; verify)**

- `src/lib/affiliate-commissions.ts` — commission computation. Uses `diviner_affiliates.id` as the FK target in downstream writes. Verify no identity reads. Stripe webhook path — see dedicated section below.
- `src/lib/affiliate-attribution.ts` — resolves `ref_code → campaign context`. Relationship-only. Confirm.
- `src/lib/affiliate-share-cap.ts` — commission cap guard used by Task 02. No identity reads. Untouched; verify.
- `src/lib/campaign-click-logger.ts` — part of URL-only attribution pipeline. Relationship-only. Confirm.
- `src/lib/campaign-defaults.ts`
- `src/lib/campaign-code.ts` — utility (cmp_ code generator). No identity reads. Untouched.
- `src/lib/admin/campaign-leaderboard.ts`
- `src/lib/diviner-analytics.ts`

**Tier A-lib — identity-readers in lib/* (HIGH priority, audit individually)**

- `src/lib/finance-ops.ts` — finance / payout ops. **Unknown today.** May read affiliate identity for statement generation. Read file fully, classify.
- `src/lib/money-split.ts` — revenue split. **Likely** reads affiliate identity to attribute splits. Read, classify.
- `src/lib/revenue-ledger.ts` — commission ledger writer. **Likely** touches `affiliate_commissions` — verify whether it reads identity columns or just FKs. Read, classify.

If any of these three reads `diviner_affiliates.name/email/phone/user_id`, treat as Tier A and swap to JOIN `affiliate_accounts`. If relationship-only, mark with the migration comment.

**Tier C — writers**

- `src/app/api/dashboard/affiliates/route.ts` POST → **DELETED** (Task 02).
- `src/app/api/dashboard/affiliates/invite/route.ts` → **REWRITTEN** (Task 02).
- `scripts/seed-dashboard-pages.mjs` → update to seed canonical accounts first (Task 07).
- `src/data/migrations/20260413000004_seed_session_data.ts` and `supabase/migrations/20260413000004_seed_session_data.sql` → historical seed data; the 2026-04-23 migration's backfill handles it. Do not rewrite history.

**Tier D — callers of the deleted direct-add POST**

Grep:

```bash
grep -rnE 'fetch\(["'\''`][^"'\''`]*/api/dashboard/affiliates["'\''`]' src/ tests/ scripts/ --include="*.ts" --include="*.tsx" --include="*.mjs"
```

Expected hits are from the Add Affiliate sheet in `src/app/dashboard/affiliates/page.tsx` (deleted in Task 04). Any other hit requires a migration or deletion decision.

**Tier E — shared components / utilities**

- `src/components/affiliate/marketing-kit.tsx` — reads affiliate fields. Audit.
- Any `src/components/dashboard/affiliate*` (re-grep).

## Shared helper (from Task 01)

Use the `DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT` constant from [src/lib/affiliate-queries.ts](../../../../src/lib/affiliate-queries.ts). Every rewritten endpoint imports it rather than reimplementing the join locally.

## API response shape rule

**Keep top-level response keys flat and unchanged where possible.** The UI reads `row.name`, `row.email`, etc. Flatten in the route:

```ts
const { data } = await admin.from('diviner_affiliates')
  .select(DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT)
  ...;

return NextResponse.json({
  data: rows.map(r => ({
    ...r,
    name: r.account?.name ?? r.name,        // prefer canonical, fallback to legacy
    email: r.account?.email ?? r.email,
    phone: r.account?.phone ?? r.phone,
    user_id: r.account?.user_id ?? r.user_id,
    avatar_url: r.account?.avatar_url ?? null, // new field; UI can adopt
    account_status: r.account?.status ?? null, // new field
    affiliate_account_id: r.account?.id ?? null,
  }))
});
```

The `?? r.name` fallbacks protect against any junction row that somehow lacks `affiliate_account_id` during the transition. After one release they can be dropped.

## Per-file recipe

For each file in the Tier A list:

1. Read the file fully.
2. Classify concretely (keep / swap SELECT / full rewrite).
3. Replace the local `.select(...)` string with `DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT`.
4. Adjust usages: `row.name` → `row.account?.name ?? row.name`, etc. (server-side flatten per above).
5. Leave a one-line header comment: `// migrated-to-canonical-accounts: 2026-04-23`.

## Stripe webhook — special care

File: [src/app/api/stripe/webhooks/route.ts](../../../../src/app/api/stripe/webhooks/route.ts). Commission attribution path via `recordAffiliateCommission` ([src/lib/affiliate-commissions.ts](../../../../src/lib/affiliate-commissions.ts)).

- The webhook looks up affiliates by `affiliateCode` (referral code) — this hits the **legacy** `affiliates` table first (dead-code advocate path), then falls back to `affiliate_referral_links` → `affiliate_commissions`. **Do not change this logic in this task.**
- What you can add: where the webhook produces log lines referencing affiliate identity, join through `affiliate_accounts` so the log shows the canonical name consistently. Non-functional change.

Commission rows keep pointing at `diviner_affiliates.id` per Task 01. Zero FK rewiring.

## Stale-caller search

Run and audit each hit:

```bash
# No code should still read identity fields from diviner_affiliates
grep -rnE "\.from\(['\"\`]diviner_affiliates['\"\`][^)]*\)[^.]*\.select\([^)]*(name|email|phone|user_id)" src/ --include="*.ts" --include="*.tsx"

# No callers of the deleted direct-add POST
grep -rnE "method:\s*['\"\`]POST['\"\`].*dashboard/affiliates['\"\`]" src/ tests/ scripts/

# No fabricated new tables shadowing affiliate_accounts naming
grep -rnE "['\"\`](affiliates|affiliate_identities|affiliate_identity)['\"\`]" src/ --include="*.ts"
```

Expected: only Task 06's own new imports remain.

## Rate-limiter discovery (for Task 02)

Check before reinventing:

```bash
grep -rn "rate[-_]limit\|rateLimit" src/lib/ --include="*.ts"
grep -rn "upstash\|redis\|Ratelimit" src/ --include="*.ts" | head
```

Document the outcome in Task 02 (already referenced).

## Feature flag registration (for Task 05)

Register `NEXT_PUBLIC_AFFILIATE_IDENTITY_V2` in [src/lib/feature-flags.ts](../../../../src/lib/feature-flags.ts). Follow the existing shape of `isAffiliateAssignmentV2Enabled()` exactly — default on in dev/preview, off in prod unless `"on"` is set explicitly. Task 05 has the concrete snippet. Task 06 only needs to confirm the file isn't split across multiple locations (`feature-gate.ts` also exists — check whether flags are duplicated there).

## CSRF discovery (for Task 03)

Check before reinventing:

```bash
grep -rn "csrf\|CSRF" src/ --include="*.ts" --include="*.tsx" | head -40
grep -rn "sameSite\|SameSite" src/lib/ --include="*.ts" | head
```

Match whatever exists for other state-changing routes (login, sign-up flow). Document the outcome in Task 03.

## Type regeneration (after Task 01 migration)

```bash
npx supabase gen types typescript --project-id wyluvclvtvwptsvvtgkv --schema public > src/types/supabase.ts
```

Commit types in the same PR that rewrites Tier A.

## Implementation Steps

### 1. Refresh the file list

Re-run the grep at the top of this doc. Diff against the Tier A/B/C lists. Add any newcomers before starting.

### 2. Task-02 pre-req: direct-add callers

Ensure Task 04 has removed the Add sheet before Task 02 deletes the POST. This ordering check is part of Task 06's verification.

### 3. Walk Tier A — identity-readers

For each file: read fully, replace select, flatten response, leave migration comment. Commit in small batches per logical group (e.g., all `/admin/affiliates/*` together).

### 4. Walk Tier A pages

Server Component pages get the same treatment. Client pages (`src/app/dashboard/affiliates/page.tsx`) already receive flattened API responses — no change unless they read `diviner_affiliates` directly.

### 5. Audit Tier B libs

Open each, confirm relationship-only. If any lib reads identity columns, reclassify to Tier A.

### 6. Stripe webhook

Minimal changes per above. Add regression test in Task 07.

### 7. Marketing kit + shared components

[src/components/affiliate/marketing-kit.tsx](../../../../src/components/affiliate/marketing-kit.tsx) — if it takes a "display affiliate" prop, shift the shape to the flattened API response. No independent query.

### 8. Delete direct-add

After Tier D audit: remove `POST` handler from [src/app/api/dashboard/affiliates/route.ts](../../../../src/app/api/dashboard/affiliates/route.ts). `GET` stays.

### 9. Cross-sprint coexistence

The 2026-04-17/21/22 sprints are live. Key interactions:

| Shipped surface | Refactor impact | Mitigation |
|---|---|---|
| `/r/[code]` redirect | None (tracking_links + affiliate_referral_links unchanged) | Smoke test: URL-only attribution still works post-refactor. |
| `diviner_service_affiliates.affiliate_id` (polymorphic) | None — refactor doesn't change where junction id lives | Verify via Task 01 §E parity test. |
| `affiliate_campaigns.owner_affiliate_id` (polymorphic) | None | Same. |
| `campaign_conversions`, `campaign_clicks`, `page_views` affiliate columns | None — attribution pipeline untouched | Smoke test the 2026-04-22 page-tracker path. |
| Feature flag `isAffiliateAssignmentV2Enabled` | Untouched. Add a separate `AFFILIATE_IDENTITY_V2` flag for this refactor | Ensure both flags are documented in the runbook. |
| Commission snapshots (`commission_value_snapshot`) | Untouched | Snapshot-preservation test in Task 07. |
| Admin campaign leaderboard (2026-04-22 Task 03) | Reads affiliate identity for row names | Add to Tier A rewrite list above. |
| CSV export endpoints (2026-04-22 Task 04) | Same | Add to Tier A rewrite list. |
| Advocate campaigns alignment (2026-04-22 Task 09) | Untouched — advocate is social_advocate identity | Do not read `affiliate_accounts` in `/api/advocate/*` routes. |

## Verification Plan

### A. Per-endpoint smoke

For each rewritten Tier A endpoint, hit it on staging before + after the rewrite. Compare response JSON diff. Expect only additive fields (`avatar_url`, `account_status`, `affiliate_account_id`).

### B. Regression

The existing affiliate + campaign + admin analytics Playwright suites (from 2026-04-21/22) must pass unchanged.

### C. EXPLAIN plans

For every rewritten query touching `diviner_affiliates`, run `EXPLAIN ANALYZE` with Task 07 seed data. Confirm no seq-scan regression on large tables. Add indexes if new filter combos appear.

### D. Cross-caller grep (post-change)

```bash
grep -rnE "\.from\(['\"\`]diviner_affiliates['\"\`][^)]*\)[^.]*\.select\([^)]*(name|email|phone|user_id)" src/
```

Expect only Task 04 flat-response reads (which use the server-flattened shape).

### E. No stale direct-add callers

```bash
grep -rnE 'method:\s*["\'']POST["\''].*dashboard/affiliates["\'']' src/ tests/ scripts/
```

Expect zero.

### F. Shipped-path smoke

- Create a campaign, click a share link, convert on a booking — confirm `campaign_conversions` row writes the right `commission_amount_cents` using the frozen snapshot, not a recomputed value.
- Admin campaign leaderboard still returns both diviner-owned and affiliate-owned campaign rows.
- Affiliate (social advocate) attribution at `/advocate/*` still works.

## Edge Cases

1. **A caller expects the nested `account: { ... }` shape, not flattened.** The flattening rule applies only where the shape is consumed by the existing UI. Internal libs may consume the nested shape. Decide per-file.
2. **Admin-only visibility of `unclaimed` accounts.** `/admin/affiliates` should surface accounts where `user_id IS NULL` distinctly; normal diviner views shouldn't expose this to affiliates themselves. Verify by reading the admin page layouts.
3. **Concurrent deploy of migration + readers.** Mitigate by deploying Task 01 alone first (readers still work on legacy columns), soak for one release, then deploy the Task 06 reader rewrites.
4. **Nested Supabase typed selects.** The `affiliate_account_id` FK on `diviner_affiliates` makes `.select('account:affiliate_accounts(...)')` return a typed nested object. Regenerate types after migration to pick it up.
5. **Unmigrated `diviner_affiliates` row.** Shouldn't exist post-backfill. If encountered, flattened response falls back to legacy columns (no crash).

## Out of Scope

- Migrating to a different API style (GraphQL / tRPC). All endpoints stay REST.
- Performance tuning beyond obvious indexes.
- Logging refactors beyond Task 02's additions.
- Retiring legacy `diviner_affiliates.name/email/phone/user_id` columns — follow-up cleanup sprint.
- Any change to `/advocate/*`, `/join/advocate`, `social_advocates`.
- Changes to 2026-04-21/22 shipped tables or routes beyond the identity join.

## Rollback Plan

- Every file change is a surgical edit; `git revert` the Task 06 PR.
- Post-revert, endpoints fall back to reading `diviner_affiliates.name/email/phone/user_id` directly (populated by Task 01's backfill + Task 02's RPC); UI continues to work because the flattened shape was additive.
