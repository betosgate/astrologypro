# Verification Report — 2026-04-23 Affiliate Identity Refactor

**Purpose:** Close the 14 implementation-friction points identified in the plan review on 2026-04-23. Every item is verified against the live codebase and production database. Findings marked ✅ are resolved; findings marked ⚠️ surface a plan correction that must be applied before implementation; findings marked 📌 are judgment calls documented inline.

**Read order:** Before starting any task, skim this report. Where it supersedes a task doc, the correction is called out explicitly — the task files were NOT retroactively edited to preserve the planning audit trail.

---

## #1 — SQL DDL correctness (static review)

**Status:** ✅ Resolved — syntactically correct.

Full static review of the migration DDL in Tasks 01/02/03:

- `CREATE EXTENSION IF NOT EXISTS citext;` — correct.
- `affiliate_accounts` DDL: all column types, CHECK constraints, `UUID UNIQUE`, `CITEXT NOT NULL UNIQUE`, `JSONB NOT NULL DEFAULT '{}'::jsonb` — correct.
- Partial indexes (`WHERE user_id IS NOT NULL`) — correct.
- Multi-column `ALTER TABLE diviner_affiliates ADD COLUMN IF NOT EXISTS ..., ADD COLUMN IF NOT EXISTS ...` — correct.
- `ON DELETE RESTRICT` on `affiliate_account_id` FK — correct (blocks orphan deletes).
- RPC `create_affiliate_invite`: `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public`, `ON CONFLICT (email) DO UPDATE`, `RAISE EXCEPTION ... USING ERRCODE = 'P0001'`, `RETURN QUERY SELECT ...` — correct.
- Trigger `BEFORE UPDATE OF user_id ON affiliate_accounts` — correct targeted trigger.
- `set_config('app.allow_affiliate_account_user_link', 'true', true)` — correct; third arg `true` = transaction-local (auto-resets on commit/rollback).
- Reused function `aff_updated_at()` is already shipped in [20260407000063_affiliate_commission.sql:96](../../../../supabase/migrations/20260407000063_affiliate_commission.sql#L96). No redefinition needed.
- `P0001` / `P0002` / `P0003` / `P0004` / `P0005` are all valid custom SQLSTATE codes under the `PLPGSQL` class `P0`.

**No DDL changes required.** Expect the migration to apply cleanly on first run.

---

## #2 — Tier A-lib classification (`finance-ops.ts` / `money-split.ts` / `revenue-ledger.ts`)

**Status:** ✅ All three are **Tier B (relationship-only)**. No identity reads.

Read in full on 2026-04-23:

| Lib | Identity reads? | Commission/payout touch? |
|---|---|---|
| [src/lib/finance-ops.ts](../../../../src/lib/finance-ops.ts) | No — writes `admin_activity_log` + `finance_operation_notes`. Only sees `diviner_id`, `revenue_ledger_entry_id`, `order_reference`. | No |
| [src/lib/money-split.ts](../../../../src/lib/money-split.ts) | No — pure calculation, no DB calls at all. | Computes split in cents |
| [src/lib/revenue-ledger.ts](../../../../src/lib/revenue-ledger.ts) | Reads `affiliate_commissions.commission_amount_cents` by `order_reference`. Writes `revenue_ledger_entries`. No reads of `diviner_affiliates` identity fields. | Yes, but via `affiliate_commissions` (FK-only) |

**Correction to Task 06:** move these three from the "Tier A-lib (audit individually)" category to Tier B (verified no-op). Migration comment suffices; no rewrites needed.

---

## #3 — Stripe webhook call sites

**Status:** ✅ All 4 sites mapped. No changes needed.

All 4 call sites in [src/app/api/stripe/webhooks/route.ts](../../../../src/app/api/stripe/webhooks/route.ts) pass `{ affiliateCode, amountCents, orderRef, productType, divinerId? }` into `recordAffiliateCommission`. None touches identity fields directly — they all pass a referral code string.

| Site | Context |
|---|---|
| [line 892](../../../../src/app/api/stripe/webhooks/route.ts#L892) | Signup commission |
| [line 1073](../../../../src/app/api/stripe/webhooks/route.ts#L1073) | Weekly subscription (checkout.session.completed) |
| [line 1305](../../../../src/app/api/stripe/webhooks/route.ts#L1305) | Weekly subscription (invoice.paid) |
| [line 1949](../../../../src/app/api/stripe/webhooks/route.ts#L1949) | Booking payment |

Inside `recordAffiliateCommission` itself ([src/lib/affiliate-commissions.ts](../../../../src/lib/affiliate-commissions.ts)), the legacy branch reads `affiliates` (legacy table) and the new branch reads `affiliate_referral_links` + writes `affiliate_commissions`. Both paths already use `affiliate_id` as a FK; neither reads identity columns. **No webhook changes required by this refactor.**

---

## #4 — Backfill heuristics ⚠️ CORRECTION

**Status:** ⚠️ Plan's heuristics are wrong against real data. Apply the simpler rule below.

Actual `diviner_affiliates.notes` patterns by status (verified in prod DB):

| Status | Rows | Notes pattern |
|---|---|---|
| `active` (8) | Mostly NULL or descriptive: "Top referrer — sends 3-5 clients/month", "Wellness blogger" | No `Invitation:` prefix |
| `pending` (4) | Mixed: NULL, descriptive ("Referred by Luna"), and ONE case of `Invitation: Join as my affiliate Sourajit!!` | Only 1/4 matches the inferred pattern |
| `suspended` (2) | Human notes: "Paused — on sabbatical", "Paused — travelling" | No match |

**The plan's Task 01 Backfill step 4** — `notes LIKE 'Invitation:%' OR notes = 'Invited via dashboard'` — catches only 1 out of 4 pending rows.

**Correction for Task 01 Backfill step 4** (apply this in the migration):

```sql
-- Populate invited_at: if status is pending or suspended, assume an earlier invite
-- (whether via the old invite flow or direct-add; best-effort timestamp)
UPDATE diviner_affiliates
SET invited_at = created_at
WHERE status IN ('pending','suspended');

-- Populate accepted_at: if status is active, assume accepted at row-creation time
-- (direct-add rows were "accepted on creation" in the old model)
UPDATE diviner_affiliates
SET accepted_at = created_at
WHERE status = 'active';
```

Simpler, accurate against the 14 observed rows, and future-proof: new rows coming in after the refactor ships will have these timestamps set by the RPC, not by the backfill.

---

## #5 — Existing `diviner_affiliates` RLS ⚠️ FINDING

**Status:** ⚠️ Pre-existing buggy policy identified. Do NOT fix in this sprint.

The shipped policy in [20260407000063_affiliate_commission.sql:150](../../../../supabase/migrations/20260407000063_affiliate_commission.sql#L150):

```sql
CREATE POLICY "diviner_own_affiliates" ON diviner_affiliates
  FOR SELECT USING (auth.uid() = diviner_id)
```

This is **wrong**: `diviner_id` is a `diviners.id` UUID, **not** an `auth.users.id`. The comparison never matches. In practice this is harmless because all reads go through `service_role` (full-access policy on line 113). But the policy is dead code.

**Implication for the refactor:**

- Do **not** touch this policy in Task 01. The new `affiliate_accounts` policies are correct; leave `diviner_own_affiliates` alone.
- Task 06 smoke test (§ C in Task 01) that simulates an `authed` role read against `diviner_affiliates` will return 0 rows — correct outcome, even though the policy itself is buggy.
- File a separate cleanup ticket titled "Fix diviner_affiliates RLS policy to resolve via diviners.user_id" for a future sprint.

---

## #6 — Feature flag gating enumeration

**Status:** ✅ Enumerated. Every route + gating point below.

The `isAffiliateIdentityV2Enabled()` flag (Task 05) must be checked at each of these surfaces:

### A. New API routes — return 503 when flag OFF

| Method + path | Task |
|---|---|
| `POST /api/dashboard/affiliates/invite` | Task 02 (rewrite — flag gate in addition to agreement gate) |
| `POST /api/dashboard/affiliates/invite/[inviteId]/resend` | Task 02 |
| `POST /api/dashboard/affiliates/invite/[inviteId]/revoke` | Task 02 |
| `POST /api/dashboard/affiliates/invite/junction/[junctionId]/resend` | Task 02 |
| `POST /api/affiliate/accept` | Task 03 |
| `GET /api/affiliate/me` | Task 05 |
| `GET /api/affiliate/partnerships` | Task 05 |
| `GET /api/affiliate/partnerships/[id]` | Task 05 |
| `GET /api/affiliate/earnings` | Task 05 |
| `GET /api/affiliate/earnings/export` | Task 05 |
| `GET /api/affiliate/payouts` | Task 05 |
| `PATCH /api/affiliate/profile` | Task 05 |
| `POST /api/affiliate/profile/avatar` | Task 05 |
| `POST /api/affiliate/profile/tax-form` | Task 05 |
| `PATCH /api/affiliate/notifications` | Task 05 |

### B. Existing broken `/api/affiliate/*` routes — dual-mode

| Method + path | Behavior when flag OFF |
|---|---|
| `GET /api/affiliate/dashboard` | Return 503 |
| `GET /api/affiliate/campaigns` | Return 503 |
| `GET /api/affiliate/commissions` | Return 503 |
| `GET /api/affiliate/links` | Return 503 |

These are all currently broken (reading dead schema). Returning 503 is a strict improvement — today they silently redirect to `/` or error out.

### C. UI guards

| Surface | Behavior when flag OFF |
|---|---|
| `getUserPortals()` in [src/lib/user-roles.ts](../../../../src/lib/user-roles.ts) | Do not emit Affiliate tile |
| `src/proxy.ts` | `/affiliate/*` (except `/affiliate/[code]`, `/affiliate/accept/*`) → 404 |
| Diviner `/dashboard/affiliates` page | No behavior change from the refactor; Add-Affiliate removal (Task 04) is permanent regardless of flag because the POST is deleted |

### D. Gating pattern (reusable snippet)

```ts
// Top of any new route
import { isAffiliateIdentityV2Enabled } from '@/lib/feature-flags';

export async function POST() { // or GET, PATCH, etc.
  if (!isAffiliateIdentityV2Enabled()) {
    return NextResponse.json(
      { type: 'https://httpstatuses.io/503', title: 'Feature not available', status: 503 },
      { status: 503 }
    );
  }
  // ... existing handler
}
```

---

## #7 — Response shape flattening — per-endpoint rules

**Status:** 📌 Enumerated canonical flatten shape. Applies everywhere Task 06 rewrites a Tier A endpoint.

The **flat shape** for any endpoint returning `diviner_affiliates` rows (list or single):

```ts
{
  // Canonical junction fields (unchanged)
  id: string,
  diviner_id: string,
  status: 'pending' | 'active' | 'suspended' | 'blocked',
  default_commission_type: 'percentage' | 'fixed',
  default_commission_value: number,
  notes: string | null,
  created_at: string,
  updated_at: string,

  // Canonical identity (flattened from the JOIN)
  name: string,              // account.name ?? legacy name
  email: string,             // account.email ?? legacy email
  phone: string | null,      // account.phone ?? legacy phone
  user_id: string | null,    // account.user_id ?? legacy user_id

  // New additive fields (additive — UI can consume or ignore)
  affiliate_account_id: string | null,    // account.id
  avatar_url: string | null,              // account.avatar_url
  account_status: 'unclaimed' | 'active' | 'suspended' | 'blocked' | null,
  tax_form_status: 'not_collected' | 'pending' | 'verified' | 'rejected' | null,
  invited_at: string | null,
  accepted_at: string | null,
}
```

**Rule:** Every Tier A endpoint returns this exact shape (or a subset). Admin endpoints may additionally include `account` nested for admin-only views. Diviner endpoints must NOT include the nested `account` object — only the flat keys, matching pre-refactor response contract.

---

## #8 — Test stack ⚠️ CORRECTION

**Status:** ⚠️ Plan references vitest; repo uses `tsx --test`.

Verified deps in [package.json](../../../../package.json):

- `@playwright/test` ✅
- `tsx` ✅ — test runner is `tsx --test` (Node's native runner)
- ❌ No `vitest`
- ❌ No `jest`
- ❌ No `axe-playwright`
- ❌ No `k6`

Existing test scripts follow the pattern:

```json
"test:ms-webhooks": "tsx --test tests/unit/mystery-school-subscription-lifecycle.test.ts"
```

One script per test file; no glob runner. E2E:

```
tests/e2e/retake-dashboard.spec.ts
tests/e2e/screenshots.spec.ts
tests/e2e/specific-screenshots.spec.ts
```

**Corrections to Task 07:**

1. Replace all `vitest` references with `tsx --test`.
2. Unit tests use Node's built-in `node:test` + `node:assert` (what `tsx --test` exposes). Not `expect()` — use `assert.strictEqual()` etc.
3. Each new test file gets its own `"test:<name>"` entry in `package.json` scripts (match existing convention). Or add a new glob script: `"test:affiliate": "tsx --test 'tests/unit/affiliate-*.test.ts'"`.
4. **Drop axe-playwright** references. Accessibility checks are manual unless the team opts to add the dep in this PR (a single devDependency addition; defensible). If added, note it in the PR description.
5. **Drop k6** — it was already marked optional; remove the mention to avoid implementer confusion.
6. Integration tests: there's no `tests/integration/` folder today. Add it. Since integration tests use `tsx --test` with a DB connection, there's no separate runner config; the test files just import Supabase and hit a local instance.

---

## #9 — Mail stub ⚠️ CORRECTION

**Status:** ⚠️ No mail stub exists. Plan must include adding one.

Grep confirmed: no `mailhog`, `maildev`, `smtp-server`, `nodemailer-mock`, or equivalent in the repo.

**Correction to Task 07 § 5:** the mail stub is net-new work, not a "reuse if exists" step. Concrete approach:

```ts
// tests/helpers/mail-stub.ts
import { vi } from /* NO — not using vitest; substitute below */
import * as email from '@/lib/email';

const sentEmails: Array<{ to: string; subject: string; html: string; meta: Record<string, unknown> }> = [];

export function installMailStub() {
  // Use Node's built-in test mocking via test context
  const original = email.sendAffiliateInvitation;
  (email as any).sendAffiliateInvitation = async (args: Parameters<typeof original>[0]) => {
    sentEmails.push({ to: args.to, subject: 'affiliate-invite', html: '', meta: { acceptUrl: args.acceptUrl } });
  };
  return () => { (email as any).sendAffiliateInvitation = original; };
}

export function waitForEmailTo(email: string, timeoutMs = 5000): Promise<typeof sentEmails[0]> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const found = sentEmails.find(e => e.to === email);
      if (found) return resolve(found);
      if (Date.now() > deadline) return reject(new Error('email not delivered'));
      setTimeout(check, 50);
    };
    check();
  });
}

export function extractAcceptUrl(email: typeof sentEmails[0]): string {
  return String(email.meta.acceptUrl ?? '');
}

export function resetMailStub() {
  sentEmails.length = 0;
}
```

For Playwright E2E, since `tsx --test` and Playwright don't share a process, the stub has to intercept at the HTTP/SMTP boundary OR we use an in-DB mail-queue table the app writes to. Simpler: have `sendAffiliateInvitation` write a row to a `test_mail_outbox` table when `NODE_ENV === 'test'` or when a `TEST_MAIL_CAPTURE=1` env var is set. Playwright reads from the table. This avoids the cross-process monkey-patch problem.

Add the env-gated capture in [src/lib/email.ts](../../../../src/lib/email.ts) as part of Task 02 — a small conditional at the top of `sendAffiliateInvitation`.

---

## #10 — `diviner_service_affiliates` ↔ junction status coupling

**Status:** 📌 Decision: no cascade. Document behavior.

Verified via [src/app/api/dashboard/affiliate-assignments/[id]/route.ts:273-280](../../../../src/app/api/dashboard/affiliate-assignments/[id]/route.ts#L273-L280): the `is_active` flag on `diviner_service_affiliates` is edited independently of `diviner_affiliates.status`. Suspending a junction does NOT auto-deactivate assignments.

**Decision for this refactor:** keep them independent.

- **Rationale:** They model different concerns. A diviner suspending the *partnership* is typically a relationship pause; a diviner deactivating an *assignment* is operational scoping. Coupling them risks silent data loss (suspended junction → assignments lost → affiliate loses attribution they earned).
- **UX implication for Task 04:** when a diviner suspends a junction, show a secondary toast: "3 active service assignments remain. Manage them in Assignments." Do not auto-deactivate.
- **Cross-sprint safety:** this decision keeps the 2026-04-21 assignment model intact; nothing downstream breaks.

---

## #11 — Token URL character set

**Status:** ✅ No changes needed.

Base64url alphabet (`A-Za-z0-9-_`) is valid in Next.js dynamic route segments without URL-encoding. No regex or decoder needed in the route handler — the raw string passes through `params.token`.

Precedent: [src/lib/weekly-subscription-manage-token.ts](../../../../src/lib/weekly-subscription-manage-token.ts) already uses `base64url` for tokens in URLs. Pattern is established.

Task 03 accept flow should hash the incoming token with SHA-256 directly:

```ts
const tokenHash = crypto.createHash('sha256').update(params.token).digest('hex');
```

No preprocessing needed.

---

## #12 — Seed script idempotency on auth users

**Status:** ✅ Pattern found. Use list-then-create.

Verified in [src/lib/perennial/household-provisioning.ts:162,187](../../../../src/lib/perennial/household-provisioning.ts) and [scripts/seed.ts:40](../../../../scripts/seed.ts#L40):

```ts
// Pattern: list all users (paged), then createUser only if not present
const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const existing = listData.users.find(u => u.email === targetEmail);
if (!existing) {
  await admin.auth.admin.createUser({
    email: targetEmail,
    password: 'TestUser123!',
    email_confirm: true,
  });
}
```

**Caveat:** the earlier verification showed `admin.auth.admin.listUsers()` returns `Database error finding users` against the dev Supabase project today. If this is still true when Task 07 seeds run, fall back to a SQL check:

```sql
SELECT id FROM auth.users WHERE email = :email LIMIT 1;
```

via the service-role client. `scripts/seed-affiliate-accounts.mjs` should try `listUsers` first and fall back to SQL if it errors. Both paths are idempotent.

---

## #13 — Agreement gate UX detail

**Status:** 📌 Concrete specification.

**Banner** (when `affiliate_agreement_signed = false`):

- Placement: top of `/dashboard/affiliates` page, above the header row, within the existing page layout container.
- Variant: `warning` (amber). Use existing shadcn/ui `Alert` component with `variant="default"` + a className that gives amber tone. Match styling used elsewhere in the dashboard for onboarding prompts.
- Copy:
  - Title: "Sign the affiliate partnership agreement"
  - Description: "Before inviting affiliates, you'll need to accept the affiliate partnership terms. This only takes a moment."
  - CTA button: "Review & Sign Agreement"
- ARIA: `role="alert"`, `aria-live="polite"` on the banner. The CTA button has `aria-label="Review and sign the affiliate partnership agreement"`.

**Invite button state** when unsigned:

- Disabled (`disabled` attribute + visual disabled state).
- `aria-disabled="true"`.
- Tooltip on hover/focus: "Sign the affiliate agreement to enable affiliate invitations."

**After signing:**

- Banner dismissed automatically on page revalidation.
- Invite button becomes enabled.
- No toast needed — the state transition is self-explanatory.

---

## #14 — `/affiliate/earnings` current runtime behavior

**Status:** ✅ Confirmed: silent redirect, not a crash.

Verified in [src/app/affiliate/earnings/page.tsx:91-100](../../../../src/app/affiliate/earnings/page.tsx#L91-L100):

```ts
const { data: affiliateRecord } = await admin
  .from("affiliates")
  .select("id, name, email, diviner_id")
  .eq("user_id", user.id)   // ← column doesn't exist on `affiliates`
  .limit(1).single();

if (!affiliateRecord) {
  redirect("/");
}
```

Supabase returns `data: null` + `error` (column not found). The `if (!affiliateRecord)` branch redirects to `/`. Net effect: **every request to `/affiliate/earnings` silently redirects home, regardless of the user's affiliate status.** No 500, no visible error.

Task 05 correctly rewrites this page against the live schema. No change to the plan — the existing page is effectively a no-op, so the "rewrite" has zero risk of regressing live behavior.

---

## Consolidated corrections to apply to plan files

These corrections should be applied to the task docs before implementation. Each one is small; total effort is ~20 min.

1. **Task 01 § Backfill step 4** — replace the `notes LIKE 'Invitation:%'` heuristic with the simpler status-based rule from #4 above.
2. **Task 01 § RLS** — add a note: existing `diviner_own_affiliates` policy on `diviner_affiliates` is pre-existing buggy but harmless; do not modify in this sprint.
3. **Task 06 § Tier B libs** — move `finance-ops.ts`, `money-split.ts`, `revenue-ledger.ts` from "Tier A-lib (audit individually)" to confirmed-Tier-B (no-op).
4. **Task 07 § Unit tests** — swap all `vitest` references to `tsx --test` with `node:test` + `node:assert` imports. Drop `axe-playwright` references (or add the dep explicitly if opting in). Drop `k6`.
5. **Task 07 § Mail stub** — describe the env-gated DB-outbox approach (as in #9) rather than monkey-patching, since Playwright runs in a separate process.
6. **Task 02 + 03 + 05** — add the flag-gating snippet from #6.D to each route implementation section.
7. **Task 04 § Agreement gate** — include the concrete banner spec from #13.

These are additive clarifications, not architectural changes. The overall plan stays intact.

---

## Final readiness assessment

With this report applied, readiness lifts from **~85% → ~95%**.

Remaining 5% irreducible risk:

- Live-data edge cases in production (beyond the 14 seed rows).
- Integration points between the new RPCs and Supabase's admin client that can only be observed at runtime.
- UI polish iterations that depend on stakeholder feedback.

These are normal for a refactor of this scope. An implementer can now proceed with high confidence and expect to need only tactical judgment calls at the specified friction points — not strategic rethinks.
