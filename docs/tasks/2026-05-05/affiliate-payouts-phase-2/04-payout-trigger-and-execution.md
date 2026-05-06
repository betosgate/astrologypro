# Task 04 — Payout Trigger & Execution

- Status: Not Started
- Priority: P0
- Depends on: 01, 02, 05
- Blocks: 06 (affiliate UI history needs the rows this writes), 08

## Goal

Extend the existing `no-show-refunds` cron with a second pass that:

1. Promotes ripe `campaign_conversions` from `payout_status='unpaid'`
   to `'ripe'` when `ripeness_at <= NOW()` and the conversion is not
   reversed
2. Groups ripe conversions per affiliate
3. Subtracts `affiliate_accounts.balance_offset_cents` from the
   gross
4. Writes an `affiliate_payouts` row + N `affiliate_payout_items`
5. Calls `stripe.transfers.create` (or skips it in dry-run mode)
6. On success: stamps each conversion with `payout_id`, `paid_at`,
   `paid_amount_cents`, `payout_status='paid'`; zeros the consumed
   offset on the affiliate account
7. On failure: marks the payout `status='failed'` with reason; leaves
   conversions in `'paying'` for the next tick to retry

The cron stays at its existing 10-minute cadence
([src/app/api/cron/no-show-refunds/route.ts:22](src/app/api/cron/no-show-refunds/route.ts#L22)).
Same secret, same timeout, same shape — **no new cron job, no new
schedule, no new infra.**

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/affiliate-payout-execution.ts` | **Create** — the second-pass logic, callable from the cron and from admin manual-trigger (Task 07) |
| 2 | `src/lib/affiliate-payout-ripeness.ts` | **Create** — pure helper computing `ripeness_at` from a booking row |
| 3 | `src/app/api/cron/no-show-refunds/route.ts` | **Extend** — add the second pass at the bottom of the existing GET handler |
| 4 | `src/lib/affiliate-attribution.ts::creditAffiliateConversion` | **Modify** — set `ripeness_at` at credit time |

## Edit 1 — Create `src/lib/affiliate-payout-ripeness.ts`

Pure function. No I/O. Easy to unit-test.

```ts
/**
 * A conversion is ripe for payout 24 hours after the booking's session
 * ENDS — not after the booking is created or paid for. Per Phase 2
 * master decision §4.
 *
 * Booking session end = scheduled_at + duration_minutes.
 *
 * For non-booking conversions (subscription / general products without
 * a session), the function returns `created_at + 24h`. Phase 2 doesn't
 * actually pay subscription conversions (out of scope), but the helper
 * is still safe.
 */
export function computeRipenessAt(input: {
  bookingScheduledAt: string | Date | null;
  bookingDurationMinutes: number | null;
  conversionCreatedAt: string | Date;
}): Date {
  const HOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

  if (input.bookingScheduledAt) {
    const start = new Date(input.bookingScheduledAt).getTime();
    const durMs = (input.bookingDurationMinutes ?? 60) * 60 * 1000;
    return new Date(start + durMs + HOLD_MS);
  }

  const created =
    typeof input.conversionCreatedAt === "string"
      ? new Date(input.conversionCreatedAt).getTime()
      : input.conversionCreatedAt.getTime();
  return new Date(created + HOLD_MS);
}
```

## Edit 2 — Stamp `ripeness_at` at credit time

**File:** `src/lib/affiliate-attribution.ts`

### Verified structure (re-audited 2026-05-05)

`creditAffiliateConversion` is at line 216. It builds two
`insertPayload = { ... }` objects on different code paths (lines
**320-333** for the campaign-assignment path, lines **366-379** for
the Phase-1.5 general-program path), then performs **a SINGLE shared
insert at line 384**:

```ts
// line 384 (existing):
const { data: inserted, error } = await admin
  .from("campaign_conversions")
  .insert(insertPayload)
  .select("id")
  .single();
```

So the right edit is to add `ripeness_at` and `payout_status` fields
to **both** `insertPayload` object literals. The single insert at line
384 stays unchanged.

### Edits

#### 2a — Add the import (top of file, near other imports)

```ts
import { computeRipenessAt } from "@/lib/affiliate-payout-ripeness";
```

#### 2b — Compute `ripenessAt` once, before either branch builds its payload

Insert at the top of the function body (around line 220, before the
`if (campaign.affiliate_id) { ... } else { ... }` branching):

```ts
// Phase 2: stamp ripeness so the no-show-refunds cron can promote.
const ripenessAt = computeRipenessAt({
  bookingScheduledAt: params.bookingScheduledAt ?? null,
  bookingDurationMinutes: params.bookingDurationMinutes ?? null,
  conversionCreatedAt: new Date(),
}).toISOString();
```

> **Verify the param names:** the audit shows the function takes
> a `params` object — confirm the existing booking-shape params include
> `bookingScheduledAt` and `bookingDurationMinutes`. If not, extend the
> `CreditConversionInput` type and update all 3 callers (booking-payment
> route, confirm-payment route, sync-booking route) to pass these from
> the booking row they already SELECT. This is the same multi-call-site
> pattern Phase 1.5 Task 03 used to add `stampedCommissionCents`.

#### 2c — Extend BOTH `insertPayload` literals

At line 320-333 (campaign-assignment branch), add to the object:

```ts
insertPayload = {
  campaign_id: campaign.campaign_id,
  // ... existing fields ...
  rate_value_used: params.stampedRateValue,
  // Phase 2 additions:
  ripeness_at: ripenessAt,
  payout_status: "unpaid",
};
```

At line 366-379 (Phase-1.5 general-program branch), add the same two
fields to the second object literal.

### After-edit verification

```bash
grep -n "ripeness_at:" src/lib/affiliate-attribution.ts
# Expected: 2 hits (one per insertPayload branch)

grep -n "payout_status:" src/lib/affiliate-attribution.ts
# Expected: 2 hits

grep -n "computeRipenessAt" src/lib/affiliate-attribution.ts
# Expected: 2 hits — import + 1 call site (shared)
```

## Edit 3 — Create `src/lib/affiliate-payout-execution.ts`

This is the meat. ~200 lines of careful logic.

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe/client";
import { syncAffiliateStripeStatus } from "@/lib/affiliate-stripe-sync";

export interface ExecutePayoutsResult {
  scanned: number;
  affiliatesProcessed: number;
  payoutsCreated: number;
  totalNetCents: number;
  dryRun: boolean;
  blocked: { affiliateAccountId: string; reason: string }[];
  failed: { payoutId: string; reason: string }[];
}

/**
 * Promote ripe conversions, group by affiliate, write payout +
 * payout_items rows, attempt Stripe transfer (or dry-run), and
 * reconcile state.
 *
 * Idempotent. Safe to call from cron (no-args) or admin (per-affiliate).
 *
 * Honors `platform_settings.affiliate_payouts_enabled`:
 *   - FALSE: writes payouts with status='dry_run', skips Stripe call
 *   - TRUE: writes payouts with status='pending', then either flips
 *           to 'completed' (transfer succeeds) or 'failed' (transfer fails)
 */
export async function executeAffiliatePayouts(input: {
  admin: SupabaseClient;
  /**
   * Optional filter: when set, only process this one affiliate
   * (admin manual trigger). When omitted, process all affiliates with
   * ripe conversions (cron mode).
   */
  onlyAffiliateAccountId?: string;
  triggerSource?: "cron" | "admin_manual" | "admin_retry";
  triggeredBy?: string | null;
  /**
   * Limit affiliates processed in one call (default: 25). Cron should
   * pass a low number to stay within the 60s timeout. Each affiliate is
   * one Stripe API call; at ~500ms per call, 25 fits comfortably.
   */
  affiliateBatchSize?: number;
}): Promise<ExecutePayoutsResult> {
  const {
    admin,
    onlyAffiliateAccountId,
    triggerSource = "cron",
    triggeredBy = null,
    affiliateBatchSize = 25,
  } = input;

  // ─── Read kill-switch ──────────────────────────────────────────────
  const { data: settings } = await admin
    .from("platform_settings")
    .select("affiliate_payouts_enabled")
    .limit(1)
    .single();
  const dryRun = !settings?.affiliate_payouts_enabled;

  const result: ExecutePayoutsResult = {
    scanned: 0,
    affiliatesProcessed: 0,
    payoutsCreated: 0,
    totalNetCents: 0,
    dryRun,
    blocked: [],
    failed: [],
  };

  // ─── Step 1: promote ripe conversions in-place ─────────────────────
  // unpaid + ripeness_at <= now + not reversed → ripe
  await admin.rpc("noop"); // placeholder; do the update below
  await admin
    .from("campaign_conversions")
    .update({ payout_status: "ripe" })
    .eq("payout_status", "unpaid")
    .lte("ripeness_at", new Date().toISOString())
    .is("reversed_at", null);

  // ─── Step 2: find affiliates with ripe conversions ─────────────────
  // We need: affiliate_account_id (via diviner_affiliates → affiliate_accounts)
  // for each ripe conversion's `affiliate_id` (which is diviner_affiliates.id).
  // Using a view or joined query.
  let query = admin
    .from("campaign_conversions")
    .select(
      `id, commission_amount_cents, affiliate_id,
       affiliate:diviner_affiliates!inner(
         id,
         affiliate_account_id,
         affiliate_accounts!inner(id, stripe_account_id, stripe_payouts_enabled, balance_offset_cents, balance_offset_last_changed_at)
       )`,
    )
    .eq("payout_status", "ripe")
    .is("reversed_at", null)
    .is("payout_id", null);

  if (onlyAffiliateAccountId) {
    // Filter via the joined column. Supabase nested filter syntax:
    query = query.eq("affiliate.affiliate_accounts.id", onlyAffiliateAccountId);
  }

  const { data: ripeRows, error: ripeErr } = await query.limit(2000);
  if (ripeErr) throw ripeErr;
  if (!ripeRows || ripeRows.length === 0) return result;

  result.scanned = ripeRows.length;

  // ─── Step 3: group by affiliate_account_id ──────────────────────────
  type Group = {
    affiliateAccountId: string;
    stripeAccountId: string | null;
    payoutsEnabled: boolean;
    balanceOffsetCents: number;
    conversions: { id: string; cents: number }[];
  };

  const groups = new Map<string, Group>();
  for (const r of ripeRows as any[]) {
    const acc = r.affiliate?.affiliate_accounts;
    if (!acc) continue;
    const existing = groups.get(acc.id);
    const cents = Number(r.commission_amount_cents ?? 0);
    if (existing) {
      existing.conversions.push({ id: r.id, cents });
    } else {
      groups.set(acc.id, {
        affiliateAccountId: acc.id,
        stripeAccountId: (acc.stripe_account_id as string | null) ?? null,
        payoutsEnabled: !!acc.stripe_payouts_enabled,
        balanceOffsetCents: Number(acc.balance_offset_cents ?? 0),
        conversions: [{ id: r.id, cents }],
      });
    }
  }

  const affiliatesToProcess = Array.from(groups.values()).slice(0, affiliateBatchSize);

  // ─── Step 4: process each affiliate ─────────────────────────────────
  for (const g of affiliatesToProcess) {
    result.affiliatesProcessed += 1;

    // Block if not Stripe-ready
    if (!g.stripeAccountId || !g.payoutsEnabled) {
      result.blocked.push({
        affiliateAccountId: g.affiliateAccountId,
        reason: !g.stripeAccountId
          ? "no_stripe_account"
          : "stripe_payouts_disabled",
      });
      // Re-sync so the next tick may find it ready
      if (g.stripeAccountId) {
        try {
          await syncAffiliateStripeStatus({
            admin,
            affiliateAccountId: g.affiliateAccountId,
            knownStripeAccountId: g.stripeAccountId,
          });
        } catch {
          /* swallow; sync is best-effort */
        }
      }
      continue;
    }

    const ripeTotal = g.conversions.reduce((s, c) => s + c.cents, 0);
    const offsetApplied = Math.min(ripeTotal, g.balanceOffsetCents);
    const net = ripeTotal - offsetApplied;

    // Pre-create the payout row (status='dry_run' or 'pending')
    const payoutRowId = crypto.randomUUID();
    const idempotencyKey = `affiliate-payout-${payoutRowId}`;
    const initialStatus = dryRun ? "dry_run" : "pending";

    const { error: insErr } = await admin.from("affiliate_payouts").insert({
      id: payoutRowId,
      affiliate_account_id: g.affiliateAccountId,
      stripe_account_id: g.stripeAccountId,
      ripe_total_cents: ripeTotal,
      offset_applied_cents: offsetApplied,
      net_transferred_cents: net,
      stripe_idempotency_key: idempotencyKey,
      status: initialStatus,
      trigger_source: triggerSource,
      triggered_by: triggeredBy,
    });
    if (insErr) {
      result.failed.push({ payoutId: payoutRowId, reason: insErr.message });
      continue;
    }

    // Distribute offset proportionally across line items
    // (rounding remainder into the largest item to keep cents balanced)
    const itemRows = distributeOffset(g.conversions, offsetApplied);
    const { error: itemErr } = await admin
      .from("affiliate_payout_items")
      .insert(
        itemRows.map((it) => ({
          payout_id: payoutRowId,
          conversion_id: it.conversionId,
          applied_amount_cents: it.applied,
          offset_applied_cents: it.offset,
        })),
      );
    if (itemErr) {
      // Mark payout failed and bail; conversions stay in ripe (will retry)
      await admin
        .from("affiliate_payouts")
        .update({ status: "failed", failure_reason: `items_insert: ${itemErr.message}` })
        .eq("id", payoutRowId);
      result.failed.push({ payoutId: payoutRowId, reason: itemErr.message });
      continue;
    }

    // Lock conversions into 'paying' so a parallel run can't double-claim
    await admin
      .from("campaign_conversions")
      .update({ payout_status: "paying", payout_id: payoutRowId })
      .in("id", g.conversions.map((c) => c.id));

    if (dryRun) {
      // No Stripe call. Leave status='dry_run'; conversions stay 'paying'
      // so the next real run picks them up after the kill-switch flips.
      // Important: revert the payout linkage on the conversions so they
      // promote back to 'ripe' on the next run.
      await admin
        .from("campaign_conversions")
        .update({ payout_status: "ripe", payout_id: null })
        .in("id", g.conversions.map((c) => c.id));
      result.payoutsCreated += 1;
      result.totalNetCents += net;
      continue;
    }

    if (net <= 0) {
      // Offset fully consumed the ripe total — no transfer, but record paid
      // for audit and decrement the offset.
      await admin
        .from("affiliate_payouts")
        .update({
          status: "completed",
          stripe_transfer_id: null,
          transferred_at: new Date().toISOString(),
          notes: "offset_fully_consumed",
        })
        .eq("id", payoutRowId);
      await admin
        .from("campaign_conversions")
        .update({
          payout_status: "offset_applied",
          paid_at: new Date().toISOString(),
          paid_amount_cents: 0,
        })
        .in("id", g.conversions.map((c) => c.id));
      await admin
        .from("affiliate_accounts")
        .update({
          balance_offset_cents: g.balanceOffsetCents - offsetApplied,
          balance_offset_last_changed_at: new Date().toISOString(),
        })
        .eq("id", g.affiliateAccountId);
      result.payoutsCreated += 1;
      continue;
    }

    // Real transfer
    try {
      const transfer = await stripe.transfers.create(
        {
          amount: net,
          currency: "usd",
          destination: g.stripeAccountId,
          metadata: {
            payout_id: payoutRowId,
            affiliate_account_id: g.affiliateAccountId,
            ripe_total_cents: String(ripeTotal),
            offset_applied_cents: String(offsetApplied),
          },
        },
        { idempotencyKey },
      );

      await admin
        .from("affiliate_payouts")
        .update({
          status: "completed",
          stripe_transfer_id: transfer.id,
          transferred_at: new Date(transfer.created * 1000).toISOString(),
        })
        .eq("id", payoutRowId);

      await admin
        .from("campaign_conversions")
        .update({
          payout_status: "paid",
          paid_at: new Date(transfer.created * 1000).toISOString(),
          paid_amount_cents: itemRowsAppliedMap(itemRows), // see helper note
        })
        .in("id", g.conversions.map((c) => c.id));
      // ^ Per-row amounts differ; the line above is pseudocode for "set each
      //   conversion's paid_amount_cents to its applied_amount_cents from
      //   itemRows." Implement as a series of per-id updates inside a
      //   `for (const it of itemRows)` loop — Supabase doesn't have
      //   per-row UPDATE in a single call.

      if (offsetApplied > 0) {
        await admin
          .from("affiliate_accounts")
          .update({
            balance_offset_cents: g.balanceOffsetCents - offsetApplied,
            balance_offset_last_changed_at: new Date().toISOString(),
          })
          .eq("id", g.affiliateAccountId);
      }

      result.payoutsCreated += 1;
      result.totalNetCents += net;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from("affiliate_payouts")
        .update({
          status: "failed",
          failure_reason: message.slice(0, 500),
        })
        .eq("id", payoutRowId);
      // Revert conversions to ripe so the next tick retries
      await admin
        .from("campaign_conversions")
        .update({ payout_status: "ripe", payout_id: null })
        .in("id", g.conversions.map((c) => c.id));
      result.failed.push({ payoutId: payoutRowId, reason: message });
    }
  }

  return result;
}

// ─── Pure helper — proportional offset distribution ──────────────────
function distributeOffset(
  conversions: { id: string; cents: number }[],
  totalOffset: number,
): { conversionId: string; applied: number; offset: number }[] {
  if (totalOffset <= 0 || conversions.length === 0) {
    return conversions.map((c) => ({
      conversionId: c.id,
      applied: c.cents,
      offset: 0,
    }));
  }

  const ripeTotal = conversions.reduce((s, c) => s + c.cents, 0);
  if (ripeTotal <= 0) {
    return conversions.map((c) => ({
      conversionId: c.id,
      applied: 0,
      offset: 0,
    }));
  }

  // Provisional proportional split, floored
  const provisional = conversions.map((c) => {
    const off = Math.floor((c.cents * totalOffset) / ripeTotal);
    return { conversionId: c.id, cents: c.cents, offset: off };
  });

  // Distribute the rounding remainder to the largest conversions first
  const distributed = provisional.reduce((s, p) => s + p.offset, 0);
  let remainder = totalOffset - distributed;
  const sorted = [...provisional].sort((a, b) => b.cents - a.cents);
  for (let i = 0; remainder > 0 && i < sorted.length; i++) {
    const headroom = sorted[i].cents - sorted[i].offset;
    const take = Math.min(headroom, remainder);
    sorted[i].offset += take;
    remainder -= take;
  }

  return provisional.map((p) => ({
    conversionId: p.conversionId,
    applied: p.cents - p.offset,
    offset: p.offset,
  }));
}
```

> **Note on `itemRowsAppliedMap`:** the snippet shows the intent.
> Real implementation does a `for (const it of itemRows)` loop and runs
> `admin.from("campaign_conversions").update({ paid_amount_cents: it.applied, payout_status: "paid", paid_at: now }).eq("id", it.conversionId)`
> per row. There's no first-class batch-update with different values per
> row in Supabase. Performance is fine — typically <50 rows per affiliate
> per cycle.

## Edit 4 — Extend the cron

**File:** `src/app/api/cron/no-show-refunds/route.ts`

### Anchor

End of the existing GET handler, just before the final `return
NextResponse.json({...})` (around line 230 — adjust to current end).

```ts
import { executeAffiliatePayouts } from "@/lib/affiliate-payout-execution";

// ... existing no-show processing loop ...

// After the no-show processing loop completes:
let payoutResult = null;
try {
  payoutResult = await executeAffiliatePayouts({
    admin,
    triggerSource: "cron",
    triggeredBy: null,
    affiliateBatchSize: 25,
  });
} catch (err) {
  console.error("[no-show-cron] affiliate payout pass failed:", err);
}

return NextResponse.json({
  noShowProcessed: processed,
  noShowResults: results,
  affiliatePayouts: payoutResult,
});
```

The two passes are intentionally independent: a payout-pass crash
must NOT cause a no-show-pass rollback, and vice versa.

## Status lifecycle (state machine)

```
unpaid ──(ripeness_at <= now AND not reversed)──▶ ripe
ripe   ──(payout claimed in cycle)─────────────▶ paying
paying ──(transfer succeeded)──────────────────▶ paid
paying ──(transfer failed)─────────────────────▶ ripe   (retry next tick)
paying ──(offset == ripe_total, no transfer)───▶ offset_applied
unpaid ──(reversed_at set by Task 05 / refund)─▶ blocked  (no payout will issue; ledger untouched)
ripe   ──(reversed_at set during ripening)─────▶ blocked
```

Once a conversion is `paid` or `offset_applied`, the only path out is
the offset-tracking flow in Task 05 (which doesn't change the conversion
itself; it only increments `affiliate_accounts.balance_offset_cents`).

## Acceptance for this task

- [ ] `src/lib/affiliate-payout-ripeness.ts::computeRipenessAt` unit-tests
      cover: (a) booking with scheduled_at + duration, (b) booking with
      no duration (defaults to 60), (c) no booking (subscription) path
- [ ] `creditAffiliateConversion` writes `ripeness_at` on every new
      conversion row
- [ ] Pre-deploy conversions: their `ripeness_at` is NULL (column added
      nullable in Task 01 — verify); they NEVER promote to `ripe` (the
      `lte("ripeness_at", now)` filter excludes NULLs by default —
      Postgres `NULL <= '...'` returns NULL not TRUE). Document in spec.
- [ ] `executeAffiliatePayouts` in dry-run mode: writes
      `affiliate_payouts.status='dry_run'`, NO Stripe call, conversions
      revert to `ripe` so the next real run finds them
- [ ] `executeAffiliatePayouts` in live mode: real `stripe.transfers.create`
      with the correct `destination`, `amount`, `idempotencyKey`;
      conversions stamped `paid` + `paid_at` + `paid_amount_cents`
- [ ] Offset case: an affiliate with `balance_offset_cents > 0` sees the
      offset deducted, the offset zeroed (or reduced), the line items'
      `offset_applied_cents` distributed proportionally
- [ ] Failure case: a Stripe error (e.g. account in restricted state)
      writes `affiliate_payouts.status='failed'` with reason; conversions
      revert to `ripe` for next-tick retry
- [ ] Idempotency: replaying the same cron tick (same `payout_id` reused)
      no-ops at Stripe (idempotency key) and at DB (no double rows)
- [ ] Cron's existing no-show pass is byte-for-byte unchanged
      (regression test: snapshot of no-show output before vs. after)

## Verification

```bash
# Files landed
ls src/lib/affiliate-payout-execution.ts \
   src/lib/affiliate-payout-ripeness.ts

# Cron extended
grep -n "executeAffiliatePayouts" src/app/api/cron/no-show-refunds/route.ts
# Expected: 2 hits — import + call

# Credit pipeline writes ripeness_at
grep -n "ripeness_at" src/lib/affiliate-attribution.ts
# Expected: at least 2 hits in creditAffiliateConversion's two inserts

# Manual cron tick (in dev with kill-switch FALSE):
curl -X GET https://localhost:3000/api/cron/no-show-refunds \
  -H "Authorization: Bearer $CRON_SECRET"
# Expected JSON: { noShowProcessed, noShowResults, affiliatePayouts: {
#   scanned, affiliatesProcessed, payoutsCreated, totalNetCents, dryRun: true,
#   blocked, failed
# }}

# Flip kill-switch:
psql -c "UPDATE platform_settings SET affiliate_payouts_enabled = TRUE;"
curl -X GET ...
# Expected: dryRun: false; payouts visible in Stripe Dashboard.
```

## Out of scope

- Sub-cent precision (no fractional cents — integer math only)
- Multi-currency conversion (USD only)
- Backfill paying-out of pre-Phase-1.5 conversions (no carved-out cents
  on platform balance to send; admin write-off if needed)
- Real-time per-conversion payouts (always batched per affiliate per
  tick)
- Retry-with-backoff on Stripe transient failures (next-tick retry is
  good enough for now; revisit if Stripe error rate is non-trivial in
  production)
- Email notification to the affiliate on successful payout (Task 06
  handles in-app notification; email is a future polish item)
