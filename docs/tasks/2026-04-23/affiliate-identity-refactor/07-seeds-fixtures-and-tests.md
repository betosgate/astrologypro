# Task 07 — Seeds, Fixtures, and Tests

- Status: Not Started
- Priority: P1 (High)
- Depends On: 01, 02, 03, 04, 05, 06
- Blocks: Prod rollout

## Goal

Update seed scripts and test users to populate the new canonical `affiliate_accounts` + junction model. Add a dedicated multi-diviner affiliate fixture that exercises the "one affiliate, many diviners" property. Ship unit + integration + Playwright E2E coverage for invite → accept → portal. Block merges that would regress the refactor or the shipped 2026-04-17/21/22 invariants.

## Current State

- [scripts/seed-dashboard-pages.mjs](../../../../scripts/seed-dashboard-pages.mjs) seeds `diviner_affiliates` directly for the `diviner.test@astrologypro.com` account. No canonical-account awareness.
- [scripts/seed-test-users.js](../../../../scripts/seed-test-users.js) creates the 30 single-role + multi-role test users in [docs/test-users.md](../../../../docs/test-users.md). None of them have a dedicated affiliate identity.
- [scripts/seed-dashboard-data.mjs](../../../../scripts/seed-dashboard-data.mjs) creates KPI/activity data for the 4 Dashboard QA accounts.
- Existing Playwright suite under `tests/e2e/` (path to confirm during execution).
- Integration tests likely run via Supabase local (`supabase start`).

## Scope

Three pillars:

1. **Seeds** — produce realistic state in local + dev Supabase for every persona.
2. **Test users** — deterministic accounts that cover every branch.
3. **Tests** — unit, integration, E2E; data-integrity checks; cross-sprint regression.

## Seeds

### New: `scripts/seed-affiliate-accounts.mjs`

Idempotent. Runs AFTER the 2026-04-23 migration AND after `seed-test-users.js`.

Personas (all password `TestUser123!`):

| Email | Linked diviners | State |
|---|---|---|
| `affiliate-solo@test.astrologypro.com` | test-diviner-1 | claimed, active |
| `affiliate-multi@test.astrologypro.com` | test-diviner-1, test-diviner-2, test-diviner-3 | all claimed, active |
| `affiliate-pending@test.astrologypro.com` | test-diviner-1 | pending (open invite) |
| `affiliate-expired@test.astrologypro.com` | test-diviner-2 | pending (expired invite) |
| `affiliate-unclaimed@test.astrologypro.com` | test-diviner-4 | unclaimed (no auth user, grandfathered junction) |
| `affiliate-suspended@test.astrologypro.com` | test-diviner-5 | suspended |
| `affiliate-blocked@test.astrologypro.com` | test-diviner-1 | canonical account `status='blocked'` |

Script behavior:

1. Ensure auth user exists (skip for `affiliate-unclaimed`).
2. Upsert `affiliate_accounts` (set `user_id` for claimed; NULL for unclaimed; `status` per persona).
3. For each partnership:
   - Insert junction with status per persona.
   - For `pending` / `expired`: insert `affiliate_invites` with appropriate `expires_at`.
4. Seed a handful of `affiliate_commissions` + `affiliate_referral_links` rows for active junctions to populate dashboards.
5. Summary table at the end.

Idempotency:

- Every insert uses `ON CONFLICT DO UPDATE` or existence-check.
- Re-running leaves state identical.

### Update: `scripts/seed-dashboard-pages.mjs`

Before any `diviner_affiliates.insert(...)`:

1. Upsert `affiliate_accounts` rows for each email the script seeds.
2. Insert junction rows referencing the canonical IDs.
3. Dual-write legacy columns (name/email/phone) — safer during the transition window.

### Update: `scripts/seed-role-data.mjs`

Seeds role-specific data for diviner / trainee / client / advocate. Check whether it touches `diviner_affiliates`; if yes, route through the canonical helpers. Idempotent upserts; dual-write legacy columns.

### Update: `scripts/seed.ts`

Older/smaller top-level seed. Check for `affiliates`/`diviner_affiliates` writes; if present, route through canonical helpers same as above. If it only seeds unrelated tables, no change — just note the audit result in the PR.

### Leave alone

- `scripts/migrate-campaign-affiliates.mjs` — one-shot migrator from the 2026-04-21 sprint; historical. Do not modify.
- `scripts/screenshot_admin.mjs`, `scripts/screenshot_advocate.mjs` — Playwright screenshots; unrelated.
- `scripts/apply-migration-browser.js` — migration runner UI; unrelated.

### Update: `scripts/seed-test-users.js`

Append the 7 affiliate personas.

### Update: `docs/test-users.md`

Add **Affiliates — portal: `/affiliate`** section after the Trainees section. List each persona with email, password, username (canonical), partnered diviners, intended test scenario.

## Unit tests

Target ≥ 85% line coverage on new code paths.

### `tests/unit/lib/affiliate-accounts.test.ts`

- `upsertAffiliateAccount` creates new or reuses existing by email (CITEXT match).
- `getAffiliateAccountByUserId` returns null when none.
- `linkUserToAffiliateAccount` routes through the accept RPC; fails outside that context (trigger P0005).

### `tests/unit/api/dashboard/affiliates/invite.test.ts`

- Full Task 02 behavior matrix: new account, reuse, 409 (dup), 422 (self-invite, cap), 429 (rate), 403 (blocked account).

### `tests/unit/api/affiliate/accept.test.ts`

- Full Task 03 behavior matrix: sign-up / sign-in / session / mismatch / expired / consumed / parallel accept race.

### `tests/unit/lib/rate-limit.test.ts`

(If Task 06 introduced `src/lib/rate-limit.ts`.) Window boundaries, independent keys, clock-tick correctness.

## Integration tests

Run against Supabase local. Reset DB between test files.

### `tests/integration/affiliate-identity-migration.test.ts`

1. Reset DB.
2. Apply all migrations including 2026-04-23.
3. Seed 14 pre-refactor-style `diviner_affiliates` rows (fixture).
4. Run Task 01's backfill (or run the full migration which includes it).
5. Assert:
   - `affiliate_accounts` count = `COUNT(DISTINCT LOWER(email))` of seed.
   - Every `diviner_affiliates.affiliate_account_id IS NOT NULL`.
   - `affiliate_invites` is empty.
   - Assertion block at end of migration did not fire.

### `tests/integration/invite-flow.test.ts`

Drives `POST /api/dashboard/affiliates/invite`, `/resend`, `/revoke`. Asserts DB state and email stub calls.

### `tests/integration/accept-flow.test.ts`

Drives `POST /api/affiliate/accept` for all three branches plus edge cases (expired, consumed, mismatch, parallel).

### `tests/integration/rls-affiliate-accounts.test.ts`

- Affiliate A → SELECT `affiliate_accounts` → only own row.
- Affiliate A → SELECT `diviner_affiliates` → only own junctions.
- Diviner → SELECT `affiliate_accounts` → only linked accounts.
- Unauthenticated → 0 rows everywhere.

### `tests/integration/downstream-readers.test.ts`

For each rewritten Tier A endpoint from Task 06, hit with seeded data, golden-file snapshot of response. Catches accidental shape drift.

### `tests/integration/shipped-invariants.test.ts` — cross-sprint regression

1. **Commission snapshot frozen:** seed a junction + campaign, record a conversion, edit the junction's commission. Re-read the conversion: commission_value_snapshot unchanged.
2. **URL-only attribution:** the accept flow sets no cookies on the response. `Set-Cookie` inspected — only the session cookie, no affiliate-tracking cookie.
3. **Polymorphic FK preservation:** `diviner_service_affiliates.affiliate_type='diviner_affiliate'` rows still resolve to `diviner_affiliates.id`. No orphans.
4. **Auto-pause on service disable:** Admin disables a service; linked affiliate campaigns' `auto_paused_at` populates. Refactor did not break this trigger.
5. **`/r/[code]` redirect:** still resolves, still writes `campaign_clicks` + `page_views.ref_code`.

## E2E tests (Playwright)

### `tests/e2e/affiliate-invite-accept-new.spec.ts`

Diviner invites fresh email → accept URL captured → new browser opens URL → sign-up → portal.

### `tests/e2e/affiliate-invite-accept-existing.spec.ts`

Email pre-registered → invite → accept URL → sign-in → portal.

### `tests/e2e/affiliate-invite-accept-mismatch.spec.ts`

Logged in as client → open accept URL for different email → `EmailMismatchView`; no accept button.

### `tests/e2e/affiliate-multi-diviner-portal.spec.ts`

Log in as `affiliate-multi@...` → `/affiliate` dashboard → 3 partnerships → earnings aggregates → per-partnership drill-down.

### `tests/e2e/affiliate-portal-authz.spec.ts`

Affiliate A tries to fetch affiliate B's partnership endpoint → 404. Diviner tries affiliate APIs → 403.

### `tests/e2e/affiliate-diviner-ui-invite-only.spec.ts`

Diviner dashboard → no "Add Affiliate" button. Invite dialog present. Empty-state CTA is "Invite Your First Affiliate." Agreement-not-signed banner disables Invite button.

### `tests/e2e/affiliate-existing-pending-resend.spec.ts`

Diviner sees `affiliate-pending@...` as pending → Resend → new email arrives → old link 410s on click.

### `tests/e2e/affiliate-blocked-status.spec.ts`

Diviner sees `affiliate-blocked@...` with lock badge → cannot invite (409 "blocked") → `/api/dashboard/affiliates/invite` POST returns 403.

### `tests/e2e/cross-sprint-attribution.spec.ts`

Click a `/r/[code]` → book → pay → assert `campaign_conversions` row wrote the frozen snapshot. Confirms the refactor didn't regress the URL-only attribution pipeline.

## Data-integrity SQL (nightly CI against staging)

```sql
-- Every diviner_affiliates row has an affiliate_account_id post-migration
SELECT COUNT(*) FROM diviner_affiliates WHERE affiliate_account_id IS NULL;  -- expect 0

-- affiliate_accounts.user_id points to a real auth user (if set)
SELECT a.id FROM affiliate_accounts a
LEFT JOIN auth.users u ON u.id = a.user_id
WHERE a.user_id IS NOT NULL AND u.id IS NULL;  -- expect 0

-- Invite linkage is consistent
SELECT ai.id FROM affiliate_invites ai
JOIN diviner_affiliates da ON da.id = ai.junction_id
WHERE da.affiliate_account_id <> ai.affiliate_account_id;  -- expect 0

-- Every canonical account has a unique email and (if set) unique user_id — relies on CONSTRAINTs
-- Test by attempting duplicates in integration tests.
```

CI job fails on any non-zero result.

## Performance

Optional: `tests/perf/affiliate-dashboard.k6.js` — 50 VUs hitting `/api/affiliate/me` for 30s with seed data, assert p95 < 300ms.

## Implementation Steps

### 1. `seed-affiliate-accounts.mjs`

Match conventions of existing seed scripts (logging format, error handling, `--dry-run`).

### 2. Update `seed-dashboard-pages.mjs`

Canonical upsert before junction inserts. Dual-write legacy columns.

### 3. Append to `seed-test-users.js`

7 affiliate personas, consistent with existing output format.

### 4. Update `docs/test-users.md`

Add **Affiliates** section.

### 5. Mail stub

`tests/helpers/mail-stub.ts` — intercepts `sendAffiliateInvitation`. If MailHog / Maildev already in use, reuse.

### 6. Unit + integration + E2E

Co-locate unit tests with source; integration under `tests/integration/`; E2E under `tests/e2e/`. Add npm scripts if missing:

```json
"test:unit": "vitest run",
"test:integration": "vitest run --config vitest.integration.config.ts",
"test:e2e": "playwright test"
```

### 7. CI wiring

- Unit tests on every PR.
- Integration tests on every PR (Supabase local container).
- Playwright on preview deploys.
- Nightly data-integrity SQL job against staging.

## Verification Plan

### A. Full seed pipeline

```bash
supabase db reset
node scripts/seed-test-users.js
node scripts/seed-affiliate-accounts.mjs
node scripts/seed-dashboard-pages.mjs
node scripts/seed-dashboard-data.mjs
```

Expect:

- 30+ test users from single-role seed.
- 7 affiliate personas + 6 auth users (skipping unclaimed).
- 14 `affiliate_accounts` rows (grandfathered + personas).
- Non-zero `affiliate_commissions`, `affiliate_referral_links`, `affiliate_invites` rows.

### B. Test suite

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

All green. No skipped tests in CI-required suites.

### C. Manual QA walkthrough

As `affiliate-multi@...`:

1. `/affiliate/login` → log in → `/affiliate`.
2. 4 KPI cards populated.
3. Partnerships tab shows 3 diviners.
4. Earnings tab → consolidated totals across diviners.
5. Payouts per diviner.
6. Profile edit → persists.
7. Sign out → sign back in → state intact.

As `affiliate-pending@...` (diviner side):

1. Diviner sees row as `pending`.
2. Resend → new email → old link invalidated.
3. Accept via fresh link → portal access granted; row flips `active`.

### D. Shipped-invariant regression

Run Playwright suites from 2026-04-21 + 2026-04-22 against the post-refactor build. All green.

## Edge Cases

1. **Seed runs twice, passwords rotated on staging.** Auth user creation uses `ON CONFLICT DO NOTHING` — never resets passwords.
2. **`supabase.auth.admin.listUsers` endpoint fails** (observed on dev project). Scripts avoid it; look up `auth.users` via SQL.
3. **Playwright email-stub flake.** Use a local stub, never real SMTP.
4. **CI flakiness on file uploads in profile test.** Stub storage with MinIO if not available.
5. **Timing: test relying on token expiry.** Use DB-level `UPDATE expires_at` for determinism, not `await sleep(14d)`.

## Out of Scope

- Load testing beyond the optional k6 script.
- Chaos testing (DB outage scenarios).
- i18n translation tests.
- Standing up new visual-regression infra.
- Contract tests with downstream third parties.

## Rollback Plan

- Remove new test specs — no production impact.
- Revert seed-script changes. Old seeds still work against legacy schema columns (Task 01's additive migration preserved them).
- Remove new test users from `docs/test-users.md`.
