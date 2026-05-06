# Task 08 — Tests + Sign-off + Spec Sync

- Status: Not Started
- Priority: P1
- Depends on: 01–07
- Blocks: —

## Goal

1. Extend the existing `npm run test:affiliate-commission` suite with
   Phase 2 cases (ripeness math, offset distribution, kill-switch
   gating, refund-after-payout)
2. Add Phase 2 §6 to `docs/specs/affiliate-commission-system.md`
3. Sync §3.8 + §5 Flow F + §5 Flow J + §12 changelog with Phase 2
   behavior
4. Run a manual E2E walkthrough covering all 12 scenarios in this doc
5. Sign off the sprint

## Files to create / modify

| # | File | Action |
|---|---|---|
| 0 | `tests/affiliate-commission/_phase-2-helpers.ts` | **Create** — shared test fixtures used by Tests 3 + 4 |
| 1 | `tests/affiliate-commission/phase-2-ripeness.test.ts` | **Create** — pure unit tests for `computeRipenessAt` |
| 2 | `tests/affiliate-commission/phase-2-offset-distribution.test.ts` | **Create** — tests for `distributeOffset` from Task 04 |
| 3 | `tests/affiliate-commission/phase-2-execute-payouts.test.ts` | **Create** — integration test against real DB + Stripe test mode |
| 4 | `tests/affiliate-commission/phase-2-refund-offset.test.ts` | **Create** — integration test for offset increment on post-payout refund |
| 5 | `docs/specs/affiliate-commission-system.md` | **Modify** — add §6, update §3.8 / §5 / §12 |

## Test 0 — Shared fixtures (`_phase-2-helpers.ts`)

Concrete helpers Tests 3 + 4 import. Define them BEFORE writing the
integration tests so the suite has a sturdy foundation.

```ts
// tests/affiliate-commission/_phase-2-helpers.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

const TEST_RUN_TAG = "phase-2-test";

export async function setKillSwitch(enabled: boolean): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("platform_settings")
    .update({ affiliate_payouts_enabled: enabled });
}

export async function cleanupTestData(): Promise<void> {
  const admin = createAdminClient();
  // Delete in FK-safe order
  await admin
    .from("affiliate_payout_items")
    .delete()
    .like("payout_id", "%"); // cascade via parent
  await admin
    .from("affiliate_payouts")
    .delete()
    .eq("notes", TEST_RUN_TAG);
  await admin
    .from("campaign_conversions")
    .delete()
    .ilike("ref_code_snapshot", `${TEST_RUN_TAG}-%`);
  await admin
    .from("affiliate_accounts")
    .delete()
    .ilike("email", `%@${TEST_RUN_TAG}.test`);
}

/**
 * Create a test affiliate. Returns the row IDs needed by callers.
 * Also creates a real Stripe Express test-mode account when
 * `stripePayoutsEnabled === true` (uses Stripe's pre-approved test
 * accounts: see https://stripe.com/docs/connect/testing).
 */
export async function setupTestAffiliate(opts: {
  stripePayoutsEnabled: boolean;
  balanceOffsetCents?: number;
}): Promise<{
  affiliateAccountId: string;
  divinerAffiliateId: string;
  userId: string;
  stripeAccountId: string | null;
}> {
  const admin = createAdminClient();
  const tag = Date.now().toString(36);
  const email = `aff-${tag}@${TEST_RUN_TAG}.test`;

  // Create auth.users row first (Stripe webhooks need a real FK target)
  const { data: authUser } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  const userId = authUser.user!.id;

  // Create affiliate_accounts row
  let stripeAccountId: string | null = null;
  if (opts.stripePayoutsEnabled) {
    // Use a Stripe-test-mode account that is pre-onboarded with payouts
    // enabled. Either create one ad-hoc OR reuse a fixture account ID
    // from env vars. Most CI setups use a dedicated test account:
    stripeAccountId =
      process.env.PHASE_2_TEST_STRIPE_ACCOUNT_ID ?? null;
    if (!stripeAccountId) {
      // Create on-the-fly. Note: this requires Stripe test mode and
      // bypasses the full onboarding flow via Stripe's special test
      // account capabilities helper. In practice you'd seed one fixture
      // account in CI env and reuse it across runs.
      throw new Error(
        "PHASE_2_TEST_STRIPE_ACCOUNT_ID env var required for live-mode integration tests. Seed one Stripe Express account once and reuse.",
      );
    }
  }

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .insert({
      user_id: userId,
      email,
      name: `Test Affiliate ${tag}`,
      status: "active",
      stripe_account_id: stripeAccountId,
      stripe_payouts_enabled: opts.stripePayoutsEnabled,
      stripe_charges_enabled: opts.stripePayoutsEnabled,
      stripe_details_submitted: opts.stripePayoutsEnabled,
      balance_offset_cents: opts.balanceOffsetCents ?? 0,
    })
    .select("id")
    .single();
  const affiliateAccountId = affiliate!.id as string;

  // Create a diviner_affiliates junction (required for campaign_conversions
  // FK chain). Phase 2 scope is diviner_affiliate identity.
  const { data: junction } = await admin
    .from("diviner_affiliates")
    .insert({
      affiliate_account_id: affiliateAccountId,
      // Match a real test diviner from your fixture set. Either seed
      // one in env or pick the first active diviner:
      diviner_id: process.env.PHASE_2_TEST_DIVINER_ID,
      email,
      name: `Test Affiliate ${tag}`,
      status: "active",
      affiliate_type: "diviner_affiliate",
      accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  const divinerAffiliateId = junction!.id as string;

  return { affiliateAccountId, divinerAffiliateId, userId, stripeAccountId };
}

/**
 * Insert N campaign_conversions rows that are already RIPE
 * (ripeness_at in the past). Returns the inserted IDs.
 */
export async function setupRipeConversions(opts: {
  affiliateAccountId: string;
  divinerAffiliateId: string;
  count: number;
  centsEach: number;
  campaignId?: string;
}): Promise<string[]> {
  const admin = createAdminClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tag = `${TEST_RUN_TAG}-${Date.now().toString(36)}`;

  // Need a real campaign_id; either seed one or look up an existing test campaign.
  const campaignId = opts.campaignId ?? process.env.PHASE_2_TEST_CAMPAIGN_ID;
  if (!campaignId) {
    throw new Error(
      "PHASE_2_TEST_CAMPAIGN_ID required. Seed one campaign once in CI env.",
    );
  }

  const rows = Array.from({ length: opts.count }, (_, i) => ({
    campaign_id: campaignId,
    affiliate_id: opts.divinerAffiliateId,
    affiliate_type: "diviner_affiliate",
    affiliate_account_id: opts.affiliateAccountId,
    ref_code_snapshot: `${tag}-${i}`,
    order_amount_cents: opts.centsEach * 5, // 20% commission
    commission_amount_cents: opts.centsEach,
    rate_type_used: "percent",
    rate_value_used: 20,
    converted_at: yesterday,
    ripeness_at: yesterday, // ripe immediately
    payout_status: "unpaid",
    commission_source: "campaign_assignment",
  }));
  const { data, error } = await admin
    .from("campaign_conversions")
    .insert(rows)
    .select("id");
  if (error) throw error;
  return (data ?? []).map((r) => r.id as string);
}

/**
 * Create a fully-paid booking with an associated paid conversion. Used
 * by Test 4 (refund-after-payout offset).
 */
export async function setupPaidBookingFixture(opts: {
  commissionCents: number;
}): Promise<{
  bookingId: string;
  affiliateAccountId: string;
  conversionId: string;
}> {
  // Compose: affiliate + ripe conversion + run payout cron once → conversion
  // moves to 'paid'. Then return the booking_id so caller can refund it.
  // Implementation depends on your booking factory — typically:
  //   1. setupTestAffiliate({ stripePayoutsEnabled: true })
  //   2. Create a booking row referencing the affiliate's diviner
  //   3. Insert a conversion linked to the booking with payout_status='ripe'
  //   4. Call executeAffiliatePayouts({ admin })
  //   5. Verify conversion is now 'paid'
  // Concrete TS depends on your existing booking factory; if none, write
  // one bottom-up matching the bookings table shape.
  throw new Error("setupPaidBookingFixture: implement against your booking factory");
}
```

> **CI requirements** for Test 3 + 4 to actually run:
>
> - `PHASE_2_TEST_STRIPE_ACCOUNT_ID` env var with a pre-onboarded
>   Stripe Express test account ID
> - `PHASE_2_TEST_DIVINER_ID` env var with a real diviner row id (any
>   active diviner; the test affiliate gets junctioned to it)
> - `PHASE_2_TEST_CAMPAIGN_ID` env var with a real campaign row id
>   referencing the same diviner
>
> Seed these once via the dev/CI bootstrap script and document in
> [README](README.md) under "Phase 2 test setup".

## Test 1 — `phase-2-ripeness.test.ts` (pure)

Cover every branch of `computeRipenessAt`:

```ts
import { describe, it, expect } from "vitest";
import { computeRipenessAt } from "@/lib/affiliate-payout-ripeness";

describe("computeRipenessAt", () => {
  it("booking with scheduled_at + duration: ripe = end + 24h", () => {
    const result = computeRipenessAt({
      bookingScheduledAt: "2026-05-05T15:00:00Z",
      bookingDurationMinutes: 60,
      conversionCreatedAt: "2026-05-05T14:00:00Z",
    });
    expect(result.toISOString()).toBe("2026-05-06T16:00:00.000Z");
  });

  it("booking with scheduled_at, missing duration: defaults to 60min", () => {
    const result = computeRipenessAt({
      bookingScheduledAt: "2026-05-05T15:00:00Z",
      bookingDurationMinutes: null,
      conversionCreatedAt: "2026-05-05T14:00:00Z",
    });
    expect(result.toISOString()).toBe("2026-05-06T16:00:00.000Z");
  });

  it("subscription / non-booking: ripe = created + 24h", () => {
    const result = computeRipenessAt({
      bookingScheduledAt: null,
      bookingDurationMinutes: null,
      conversionCreatedAt: "2026-05-05T12:00:00Z",
    });
    expect(result.toISOString()).toBe("2026-05-06T12:00:00.000Z");
  });

  it("accepts Date for conversionCreatedAt", () => {
    const result = computeRipenessAt({
      bookingScheduledAt: null,
      bookingDurationMinutes: null,
      conversionCreatedAt: new Date("2026-05-05T12:00:00Z"),
    });
    expect(result.toISOString()).toBe("2026-05-06T12:00:00.000Z");
  });
});
```

## Test 2 — `phase-2-offset-distribution.test.ts` (pure)

Cover the offset distribution helper from Task 04:

```ts
import { describe, it, expect } from "vitest";
// Note: distributeOffset is internal to payout-execution.ts; export it
// for testing (rename file or add a __test_export__ block).

describe("distributeOffset", () => {
  it("zero offset: every conversion's offset = 0, applied = full", () => {
    const result = distributeOffset(
      [{ id: "a", cents: 1000 }, { id: "b", cents: 500 }],
      0,
    );
    expect(result).toEqual([
      { conversionId: "a", applied: 1000, offset: 0 },
      { conversionId: "b", applied: 500, offset: 0 },
    ]);
  });

  it("offset == ripe_total: every conversion paid 0", () => {
    const result = distributeOffset(
      [{ id: "a", cents: 1000 }, { id: "b", cents: 500 }],
      1500,
    );
    expect(result.reduce((s, r) => s + r.offset, 0)).toBe(1500);
    expect(result.reduce((s, r) => s + r.applied, 0)).toBe(0);
  });

  it("partial offset: distributed proportionally with rounding remainder", () => {
    // 1000 + 500 = 1500 ripe; offset 100; proportional => 67 + 33 = 100 ✓
    const result = distributeOffset(
      [{ id: "a", cents: 1000 }, { id: "b", cents: 500 }],
      100,
    );
    expect(result.reduce((s, r) => s + r.offset, 0)).toBe(100);
    expect(result.reduce((s, r) => s + r.applied, 0)).toBe(1400);
  });

  it("rounding remainder rolled to largest conversion", () => {
    // 333 + 333 + 333 = 999; offset 100. Floor 100*333/999 = 33 each
    // → distributed 99; remainder 1 → goes to first (largest).
    const result = distributeOffset(
      [{ id: "a", cents: 333 }, { id: "b", cents: 333 }, { id: "c", cents: 333 }],
      100,
    );
    expect(result.reduce((s, r) => s + r.offset, 0)).toBe(100);
    // First entry takes the remainder
    expect(result[0].offset).toBe(34);
  });

  it("preserves input order in returned array", () => {
    const result = distributeOffset(
      [{ id: "z", cents: 200 }, { id: "a", cents: 100 }],
      50,
    );
    expect(result.map((r) => r.conversionId)).toEqual(["z", "a"]);
  });
});
```

> **Note:** `distributeOffset` is currently a non-exported helper inside
> `affiliate-payout-execution.ts`. Either export it directly or expose
> via a test-only barrel.

## Test 3 — `phase-2-execute-payouts.test.ts` (integration)

Hits real Supabase + Stripe test mode. Pattern: each test builds
fixture data, runs `executeAffiliatePayouts`, asserts DB and Stripe
state.

Skeleton:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { executeAffiliatePayouts } from "@/lib/affiliate-payout-execution";
import { setupTestAffiliate, setupRipeConversions, setKillSwitch } from "./helpers";

describe("executeAffiliatePayouts", () => {
  let admin = createAdminClient();

  beforeEach(async () => {
    await admin.from("campaign_conversions").delete()
      .like("metadata->>test_run", "phase-2-%");
    await setKillSwitch(false);
  });

  it("dry_run mode: writes payout row with status='dry_run', no Stripe call", async () => {
    const { affiliateAccountId } = await setupTestAffiliate({ stripePayoutsEnabled: true });
    await setupRipeConversions({ affiliateAccountId, count: 3, centsEach: 1000 });

    const result = await executeAffiliatePayouts({ admin });

    expect(result.dryRun).toBe(true);
    expect(result.payoutsCreated).toBe(1);
    expect(result.totalNetCents).toBe(3000);

    const { data: payout } = await admin
      .from("affiliate_payouts")
      .select("status, stripe_transfer_id, ripe_total_cents, net_transferred_cents")
      .eq("affiliate_account_id", affiliateAccountId)
      .single();
    expect(payout?.status).toBe("dry_run");
    expect(payout?.stripe_transfer_id).toBeNull();

    // Conversions reverted to ripe so the next live run picks them up
    const { data: conversions } = await admin
      .from("campaign_conversions")
      .select("payout_status, payout_id");
    for (const c of conversions ?? []) {
      expect(c.payout_status).toBe("ripe");
      expect(c.payout_id).toBeNull();
    }
  });

  it("live mode: calls stripe.transfers.create, stamps conversions paid", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId, stripeAccountId } = await setupTestAffiliate({
      stripePayoutsEnabled: true,
    });
    await setupRipeConversions({ affiliateAccountId, count: 2, centsEach: 1500 });

    const result = await executeAffiliatePayouts({ admin });
    expect(result.payoutsCreated).toBe(1);
    expect(result.totalNetCents).toBe(3000);

    const { data: payout } = await admin
      .from("affiliate_payouts")
      .select("status, stripe_transfer_id")
      .eq("affiliate_account_id", affiliateAccountId)
      .single();
    expect(payout?.status).toBe("completed");
    expect(payout?.stripe_transfer_id).toMatch(/^tr_/);

    const transfer = await stripe.transfers.retrieve(payout!.stripe_transfer_id!);
    expect(transfer.amount).toBe(3000);
    expect(transfer.destination).toBe(stripeAccountId);
  });

  it("offset reduces net: ripe 3000, offset 1000 → net 2000 transferred", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId } = await setupTestAffiliate({
      stripePayoutsEnabled: true,
      balanceOffsetCents: 1000,
    });
    await setupRipeConversions({ affiliateAccountId, count: 2, centsEach: 1500 });

    const result = await executeAffiliatePayouts({ admin });
    expect(result.totalNetCents).toBe(2000);

    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("balance_offset_cents")
      .eq("id", affiliateAccountId)
      .single();
    expect(account?.balance_offset_cents).toBe(0); // fully consumed
  });

  it("offset >= ripe: no Stripe call, status='completed', notes='offset_fully_consumed'", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId } = await setupTestAffiliate({
      stripePayoutsEnabled: true,
      balanceOffsetCents: 5000,
    });
    await setupRipeConversions({ affiliateAccountId, count: 1, centsEach: 3000 });

    const result = await executeAffiliatePayouts({ admin });
    const { data: payout } = await admin
      .from("affiliate_payouts")
      .select("status, stripe_transfer_id, notes, net_transferred_cents")
      .eq("affiliate_account_id", affiliateAccountId)
      .single();
    expect(payout?.status).toBe("completed");
    expect(payout?.stripe_transfer_id).toBeNull();
    expect(payout?.notes).toBe("offset_fully_consumed");
    expect(payout?.net_transferred_cents).toBe(0);

    // Offset reduced by the consumed amount only (3000), residual 2000 stays
    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("balance_offset_cents")
      .eq("id", affiliateAccountId)
      .single();
    expect(account?.balance_offset_cents).toBe(2000);
  });

  it("blocked: affiliate without stripe_payouts_enabled → status='blocked'", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId } = await setupTestAffiliate({
      stripePayoutsEnabled: false,
    });
    await setupRipeConversions({ affiliateAccountId, count: 1, centsEach: 1000 });

    const result = await executeAffiliatePayouts({ admin });
    expect(result.blocked).toContainEqual({
      affiliateAccountId,
      reason: "stripe_payouts_disabled",
    });
    // No payout row created (or one with status='blocked' depending on impl)
    // Conversions remain ripe for next-tick retry
    const { data: conv } = await admin
      .from("campaign_conversions")
      .select("payout_status, payout_id")
      .eq("affiliate_id", "..." /* helper resolves */);
    expect(conv?.[0]?.payout_status).toBe("ripe");
    expect(conv?.[0]?.payout_id).toBeNull();
  });

  it("idempotent: replaying the same run is a no-op", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId } = await setupTestAffiliate({ stripePayoutsEnabled: true });
    await setupRipeConversions({ affiliateAccountId, count: 1, centsEach: 1000 });

    await executeAffiliatePayouts({ admin });
    const before = await admin.from("affiliate_payouts").select("id", { count: "exact" });
    await executeAffiliatePayouts({ admin });
    const after = await admin.from("affiliate_payouts").select("id", { count: "exact" });
    expect(after.count).toBe(before.count); // no new payout row
  });
});
```

## Test 4 — `phase-2-refund-offset.test.ts` (integration)

```ts
describe("refund-after-payout offset", () => {
  it("refunding a paid booking increments balance_offset_cents and flips status", async () => {
    await setKillSwitch(true);
    const { affiliateAccountId, bookingId } = await setupPaidBookingFixture({
      commissionCents: 3500,
    });

    // Pre-condition: conversion paid
    const { data: pre } = await admin
      .from("campaign_conversions")
      .select("payout_status, paid_amount_cents")
      .eq("booking_id", bookingId)
      .single();
    expect(pre?.payout_status).toBe("paid");
    expect(pre?.paid_amount_cents).toBe(3500);

    // Issue refund via the shared helper
    await issueBookingRefund({ bookingId, initiatedByUserId: null, initiatedByRole: "system" });

    const { data: post } = await admin
      .from("campaign_conversions")
      .select("payout_status, paid_amount_cents")
      .eq("booking_id", bookingId)
      .single();
    expect(post?.payout_status).toBe("offset_applied");
    expect(post?.paid_amount_cents).toBe(3500); // unchanged

    const { data: account } = await admin
      .from("affiliate_accounts")
      .select("balance_offset_cents, balance_offset_last_changed_at")
      .eq("id", affiliateAccountId)
      .single();
    expect(account?.balance_offset_cents).toBe(3500);
    expect(account?.balance_offset_last_changed_at).not.toBeNull();
  });

  it("refunding an unpaid booking still uses the legacy reversal path", async () => {
    // The conversion is in 'unpaid' or 'ripe' state; the helper must
    // call reverseConversion (sets reversed_at), NOT touch
    // balance_offset_cents.
  });

  it("double refund of an already-offset booking is a no-op", async () => {
    // reverseAffiliateConversionForBooking returns reason="already_reversed"
    // on the second call; balance_offset_cents unchanged.
  });
});
```

## Spec updates — `docs/specs/affiliate-commission-system.md`

### Add new §6 "Affiliate Payouts (Phase 2)"

```markdown
## §6 — Affiliate Payouts (Phase 2 — 2026-05-05)

### §6.1 — Hold period and ripeness

A `campaign_conversions` row becomes payable 24 hours after the linked
booking's session ends (`scheduled_at + duration_minutes + 24h`). The
ripeness boundary is stamped at credit time via `computeRipenessAt`
into `campaign_conversions.ripeness_at`.

Until ripeness is reached, the conversion's `payout_status = 'unpaid'`.
At or past ripeness, the next no-show-refunds cron tick promotes it
to `'ripe'`. The cron then groups ripe conversions per affiliate and
fires a transfer.

### §6.2 — Refund-after-payout offset (Path 1)

[copied from Task 05 Edit 3 — see that file's spec block]

### §6.3 — Kill-switch

`platform_settings.affiliate_payouts_enabled BOOLEAN NOT NULL
DEFAULT FALSE`. When FALSE, the cron writes payout records with
`status='dry_run'` but does NOT call `stripe.transfers.create`.
Flipped via the admin UI; logged to `admin_action_log`.

### §6.4 — Onboarding gate

An affiliate cannot create new campaigns or generate new share links
unless `affiliate_accounts.stripe_payouts_enabled = TRUE`. Existing
campaigns + share links are grandfathered. Conversions accrue
regardless of connection state; payouts only fire after connection.

### §6.5 — State machine for `campaign_conversions.payout_status`

```
unpaid ──▶ ripe ──▶ paying ──▶ paid
                          └──▶ offset_applied (after refund-after-payout)
ripe   ──▶ blocked  (if reversed during ripening)
unpaid ──▶ blocked  (if reversed before ripening)
```

A `reversed_at` set on a row in `unpaid`/`ripe`/`paying` halts payout
forever and the row is treated as an obligation that never matured.
A `reversed_at` set on a row in `paid` is impossible by design —
the offset path is taken instead.
```

### Update §3.8 (rate stamp invariant)

Add a sentence: "The stamped commission cents propagate into
`campaign_conversions.commission_amount_cents`, then into
`campaign_conversions.paid_amount_cents` once payout fires. Any
post-payout refund is reconciled via `affiliate_accounts.balance_offset_cents`
without touching the conversion's amounts."

### Update §5 Flow F (three credit paths)

Add a step at the end of each flow: "After credit, the row's
`ripeness_at` is set per §6.1; the no-show-refunds cron promotes
+ pays."

### Update §5 Flow J (reversal flow)

Replace the current "reversal" step with "if `payout_status == 'paid'`,
apply offset (§6.2); otherwise, reverse via `reversed_at`."

### Update §12 changelog

Append:

```markdown
- **2026-05-05** — Phase 2 affiliate payouts shipped. Stripe Express
  onboarding for affiliates (US/USD); 24h hold post-session; piggybacks
  on no-show-refunds cron; DB-level `balance_offset_cents` for
  refund-after-payout reconciliation; kill-switch
  `platform_settings.affiliate_payouts_enabled` defaulting FALSE.
  Sprint plan: docs/tasks/2026-05-05/affiliate-payouts-phase-2/.
```

## Manual E2E walkthrough (15 scenarios)

Run all 12 in test mode against a dev Supabase + Stripe test mode.
Each scenario should end with the SQL verification snippet present
in the corresponding task doc.

1. **First connect** — affiliate with no Stripe → click Connect →
   complete onboarding → see Connected pill. Verify
   `stripe_payouts_enabled = TRUE`.
2. **Resume connect** — affiliate started but didn't finish → click
   Resume → finish → see Connected.
3. **Create campaign blocked** — non-connected affiliate → click
   Create Campaign → see gating screen with `connect` cta.
4. **Create campaign allowed** — connected affiliate → submit form →
   200 OK + new campaign row.
5. **Grandfathered campaign** — affiliate without Stripe but with a
   pre-existing campaign → share link still redirects + still
   converts.
6. **Conversion ripens** — paid booking → 24h pass session end → cron
   promotes conversion to ripe → payout dry_run row appears.
7. **Kill-switch flip** — admin flips ON → next cron tick fires real
   transfer → conversion stamped paid; transfer visible in Stripe.
8. **Refund before payout** — refund a booking still in `unpaid` →
   conversion `reversed_at` set, `balance_offset_cents` unchanged.
9. **Refund after payout** — refund a paid booking → conversion flips
   to `offset_applied`, `balance_offset_cents` increments.
10. **Offset consumed** — affiliate earns more next cycle → next
    payout reduced by offset; `balance_offset_cents` decreases.
11. **Offset write-off** — admin writes off a stale offset → zeroed +
    audit log row.
12. **Failed transfer retry** — affiliate's Stripe account in
    restricted state → transfer fails → status `blocked`, conversions
    revert to ripe, next tick succeeds after status fix. Admin
    failed-payout widget (Task 09) surfaces the row.
13. **Country pre-check rejection** — affiliate with
    `payout_details.country = "GB"` clicks Connect → 422 with the
    friendly "US-only" message; no Stripe account created.
14. **Stripe account deauthorization** — replay
    `account.application.deauthorized` via Stripe CLI → `stripe_account_id`
    nulled, prior_stripe_account_ids appended, affiliate
    `affiliate.stripe_disconnected` notification fires (Task 09),
    dashboard re-shows Connect CTA.
15. **Per-row payout-status pill** — open the existing affiliate
    earnings list; verify a paid conversion shows "Paid" pill, an
    unpaid (still ripening) conversion shows "Holding" with the
    countdown tooltip, an offset_applied conversion shows
    "Offset (refunded)".

## Acceptance for this task

- [ ] All 4 new test files added and pass in CI
- [ ] `npm run test:affiliate-commission` passes (no regression)
- [ ] All 15 manual E2E scenarios pass on dev Supabase + Stripe test
      mode, with SQL verification snippets matching expected output
- [ ] Phase 2 Task 09 acceptance fully checked (4 new notification
      kinds firing, existing /admin/reports/affiliates updated,
      failed-payout widget surfacing on /admin/reports/finance-ops)
- [ ] Spec §6 added; §3.8, §5 Flow F, §5 Flow J, §12 updated
- [ ] Master task `00-master-task.md` acceptance gate fully checked
- [ ] No regression in Phase 1.5 carve-out tests
- [ ] No regression in Phase 1.5 refund-flow tests
- [ ] PR description includes screenshots of: Connect Stripe panel
      states, Offset banner, Payout history table, Admin payouts list,
      Admin detail page

## Sign-off

The sprint is COMPLETE when:

1. ☐ All 8 task files' "Acceptance" sections fully checked
2. ☐ Spec §6 + §12 changelog reflect shipped behavior
3. ☐ Kill-switch is flipped to TRUE in production after 7 clean
      dry-run days, AND the first three real cron ticks produce
      transfers visible in Stripe Dashboard with no failures
4. ☐ Communication sent to the 14 existing affiliates: "Connect
      Stripe to start receiving payouts" — link to the affiliate
      dashboard
5. ☐ A `project_*` memory file added recording the kill-switch flip
      date + first-real-payout date so future debugging has a
      reference

## Out of scope

- Subscription commission payouts (separate sprint)
- Social advocate payouts (separate sprint)
- International / multi-currency
- Email notifications on payout / offset / dispute events
- Affiliate-side dispute submission UI
- Reverse-transfer admin actions
- Offset auto-write-off after 90 days (manual via admin UI only)
