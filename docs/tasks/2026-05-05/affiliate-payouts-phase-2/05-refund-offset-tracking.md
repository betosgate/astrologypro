# Task 05 — Refund-After-Payout Offset Tracking

- Status: Not Started
- Priority: P0
- Depends on: 01
- Blocks: 04 (the payout helper subtracts this offset; offset must
  be writable before any payout can claim it)

## Goal

When a booking is refunded **after** the affiliate has been paid for
it, increment `affiliate_accounts.balance_offset_cents` by the
affiliate share. Don't touch the affiliate's Stripe account.

The next payout cycle (Task 04) automatically subtracts the offset
from the gross before transferring. If the offset exceeds the next
ripe total, the affiliate gets nothing on that cycle and the residual
offset rolls forward.

## Why this exists — Path 1 (decided 2026-05-05)

Per master decision §8: zero clawback from Stripe. All recovery
happens in our DB. This task is the writer side; Task 04 is the
reader side.

The check that matters: at the moment a refund fires, is the
linked `campaign_conversions` row in state `paid` (or `offset_applied`)?
- If yes → increment offset on the affiliate account
- If no (still `unpaid` / `ripe` / `paying`) → existing reversal
  flow (Phase 1.5 Task 05) marks the conversion `reversed_at`;
  no offset needed because the money never left the platform

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/affiliate-offset.ts` | **Create** — single helper `applyRefundOffsetForBooking` |
| 2 | `src/lib/affiliate-reverse-conversion.ts::reverseAffiliateConversionForBooking` | **Extend** — branch on `payout_status`; if `paid`/`offset_applied`, call the new offset helper instead of (or in addition to) the existing reversal |
| 3 | `docs/specs/affiliate-commission-system.md` | **Add** §6 sub-section "Refund-after-payout offset" |

`reverseAffiliateConversionForBooking` was created in Phase 1.5 Task 05.
Phase 2 Task 05 makes it offset-aware. The three refund call sites
(shared pipeline + admin route + no-show cron) keep calling the same
function — no new wiring needed at the call sites, the branch is
inside the helper.

## Edit 1 — Create `src/lib/affiliate-offset.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type ApplyOffsetResult =
  | { ok: true; offsetCents: number; newBalanceOffsetCents: number; conversionId: string }
  | { ok: false; reason: "no_conversion" | "already_offset_applied" | "db_error"; detail?: string };

/**
 * Apply a refund-after-payout offset for a booking.
 *
 * Call only when the booking's linked conversion is in state
 * `paid` or `offset_applied` (i.e., the affiliate has been paid).
 *
 * Increments `affiliate_accounts.balance_offset_cents` by the conversion's
 * `paid_amount_cents` (NOT `commission_amount_cents` — `paid_amount_cents`
 * already accounts for any prior offset that reduced this conversion's
 * actual transfer).
 *
 * Marks the conversion's `payout_status = 'offset_applied'` so a second
 * refund of the same booking is a no-op.
 *
 * Idempotent: if the conversion is already in `offset_applied`, returns
 * ok=false with reason="already_offset_applied".
 */
export async function applyRefundOffsetForBooking(input: {
  admin: SupabaseClient;
  bookingId: string;
  reason: string;
  actorUserId: string | null;
}): Promise<ApplyOffsetResult> {
  const { admin, bookingId, reason, actorUserId } = input;

  const { data: conversion, error: fetchErr } = await admin
    .from("campaign_conversions")
    .select(
      `id, affiliate_id, payout_status, paid_amount_cents,
       affiliate:diviner_affiliates!inner(
         affiliate_account_id,
         affiliate_accounts!inner(id, balance_offset_cents)
       )`,
    )
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, reason: "db_error", detail: fetchErr.message };
  }
  if (!conversion) {
    return { ok: false, reason: "no_conversion" };
  }
  if (conversion.payout_status === "offset_applied") {
    return { ok: false, reason: "already_offset_applied" };
  }
  // Defensive: only paid conversions reach this helper. If the caller
  // miscategorized, bail safely.
  if (conversion.payout_status !== "paid") {
    return {
      ok: false,
      reason: "db_error",
      detail: `unexpected payout_status=${conversion.payout_status}; expected 'paid'`,
    };
  }

  const affiliateAccountId = (conversion as any).affiliate
    ?.affiliate_accounts?.id as string | undefined;
  const currentOffset = Number(
    (conversion as any).affiliate?.affiliate_accounts?.balance_offset_cents ?? 0,
  );
  const offsetIncrement = Number(conversion.paid_amount_cents ?? 0);

  if (!affiliateAccountId) {
    return {
      ok: false,
      reason: "db_error",
      detail: "could not resolve affiliate_account_id",
    };
  }
  if (offsetIncrement <= 0) {
    // Nothing to claw — mark as offset_applied to keep the state machine
    // tidy and return success.
    await admin
      .from("campaign_conversions")
      .update({ payout_status: "offset_applied" })
      .eq("id", conversion.id);
    return {
      ok: true,
      offsetCents: 0,
      newBalanceOffsetCents: currentOffset,
      conversionId: conversion.id as string,
    };
  }

  const newOffset = currentOffset + offsetIncrement;
  const now = new Date().toISOString();

  // Update the affiliate account
  const { error: updErr } = await admin
    .from("affiliate_accounts")
    .update({
      balance_offset_cents: newOffset,
      balance_offset_last_changed_at: now,
    })
    .eq("id", affiliateAccountId);
  if (updErr) {
    return { ok: false, reason: "db_error", detail: updErr.message };
  }

  // Stamp the conversion as offset_applied
  await admin
    .from("campaign_conversions")
    .update({ payout_status: "offset_applied" })
    .eq("id", conversion.id);

  // Audit log — verified columns from
  // supabase/migrations/20260424000010_affiliate_commission_v2_additive.sql:116-128
  // and Phase 1.5's `payload` JSONB added in 20260430000002:188-205.
  //
  // IMPORTANT: admin_user_id is NOT NULL + REFERENCES auth.users(id). For
  // system-triggered refunds (cron, webhook) where actorUserId is null,
  // we CANNOT log here without violating the FK. Instead, system flows
  // record offset application via console + the refund_events table
  // (already populated by booking-refund.ts → recordRefundEvent).
  //
  // CHECK constraint on action_kind was extended in Phase 2 Task 01 to
  // accept 'affiliate_offset_applied'.
  if (actorUserId) {
    try {
      await admin.from("admin_action_log").insert({
        admin_user_id: actorUserId,
        action_kind: "affiliate_offset_applied",
        target_resource_type: "affiliate_account",
        target_resource_id: affiliateAccountId,
        // reason: NOT NULL, length 5-500 chars (verified)
        reason: (reason && reason.length >= 5
          ? reason
          : `Offset applied for booking ${bookingId}`).slice(0, 500),
        payload: {
          conversion_id: conversion.id,
          booking_id: bookingId,
          offset_increment_cents: offsetIncrement,
          new_balance_offset_cents: newOffset,
        },
      });
    } catch (err) {
      console.error("[applyRefundOffsetForBooking] audit log failed", err);
    }
  } else {
    // System actor (cron / webhook). Skip admin_action_log; the
    // refund_events row + the conversion's `payout_status='offset_applied'`
    // already provide an audit trail.
    console.info("[applyRefundOffsetForBooking] system-actor offset", {
      affiliateAccountId,
      bookingId,
      offset_increment_cents: offsetIncrement,
      new_balance_offset_cents: newOffset,
      reason,
    });
  }

  return {
    ok: true,
    offsetCents: offsetIncrement,
    newBalanceOffsetCents: newOffset,
    conversionId: conversion.id as string,
  };
}
```

> Verify the `admin_action_log` table accepts the columns shown
> (`admin_user_id`, `action_type`, `target_type`, `target_id`,
> `details`). If the existing schema differs, adapt to match. Run
> `\d admin_action_log` to confirm.

## Edit 2 — Extend `reverseAffiliateConversionForBooking`

**File:** `src/lib/affiliate-reverse-conversion.ts`

The function added in Phase 1.5 Task 05 currently calls
`reverseConversion(...)` unconditionally. Phase 2 makes it
status-aware: paid conversions are NOT reversed (the ledger row
is correct), they get an offset entry instead.

### Anchor

The existing `reverseAffiliateConversionForBooking` body, after
the `conversion.reversed_at` early-return:

```ts
if (conversion.reversed_at) {
  return { ok: false, reason: "already_reversed" };
}
```

### Replace the trailing reversal call with a branch

Before this edit, the function ends with:

```ts
  const result = await reverseConversion({
    admin,
    conversionId: conversion.id as string,
    reversedBy,
    reason,
  });
  return result;
}
```

Replace with:

```ts
  // Phase 2: branch on payout state.
  // - 'unpaid' | 'ripe' | 'paying' | 'blocked' → reverse the conversion
  //   (money is still on platform; no payout to claw)
  // - 'paid' → apply offset to the affiliate's balance_offset_cents
  //   (money is in the affiliate's bank; clawback via DB offset)
  // - 'offset_applied' → already handled by a prior refund of this booking;
  //   should not happen given the earlier reversed_at check, but defensive
  //   no-op.
  const status = (conversion as any).payout_status as string | undefined;

  if (status === "paid") {
    const { applyRefundOffsetForBooking } = await import(
      "@/lib/affiliate-offset"
    );
    const offsetResult = await applyRefundOffsetForBooking({
      admin,
      bookingId,
      reason,
      actorUserId: reversedBy,
    });
    if (!offsetResult.ok) {
      return {
        ok: false,
        reason: "db_error",
        detail: `offset failed: ${offsetResult.reason}${
          offsetResult.detail ? ` — ${offsetResult.detail}` : ""
        }`,
      };
    }
    return {
      ok: true,
      conversionId: offsetResult.conversionId,
      amountCents: offsetResult.offsetCents,
      affiliateId: (conversion as any).affiliate_id as string,
    };
  }

  if (status === "offset_applied") {
    return { ok: false, reason: "already_reversed" };
  }

  // status in ('unpaid','ripe','paying','blocked') → reverse normally
  const result = await reverseConversion({
    admin,
    conversionId: conversion.id as string,
    reversedBy,
    reason,
  });
  return result;
}
```

### Update the SELECT to include `payout_status`

The fetch earlier in the function only selects `id, reversed_at`:

```ts
.select("id, reversed_at")
```

Change to:

```ts
.select("id, reversed_at, payout_status, affiliate_id")
```

so the branch logic has the data it needs without an extra round trip.

### Verify

```bash
grep -n "applyRefundOffsetForBooking\|payout_status" src/lib/affiliate-reverse-conversion.ts
# Expected: at least 2 hits — the dynamic import + the status branch
```

## What this means at the three refund call sites

The Phase 1.5 Task 05 already wired `reverseAffiliateConversionForBooking`
into:

- [src/lib/booking-refund.ts](src/lib/booking-refund.ts)
- [src/app/api/admin/refunds/route.ts](src/app/api/admin/refunds/route.ts)
- [src/app/api/cron/no-show-refunds/route.ts](src/app/api/cron/no-show-refunds/route.ts)

**No edits needed at the call sites for this task.** The behavior
change happens transparently inside the helper:

| Booking refunded… | Phase 1.5 behavior | Phase 2 behavior |
|---|---|---|
| Before payout (`unpaid`/`ripe`/`paying`) | Conversion reversed | Conversion reversed (unchanged) |
| After payout (`paid`) | Conversion reversed (incorrect — affiliate keeps the money AND credit reversal in reports lies) | Conversion stays paid; offset incremented; next payout reduced (correct) |
| Already offset (`offset_applied`) | n/a (couldn't happen) | No-op (defensive) |

## Spec update

Add a new sub-section §6.2 to `docs/specs/affiliate-commission-system.md`:

```markdown
### §6.2 Refund-after-payout offset (Path 1)

When a booking is refunded after the affiliate has been paid for it,
the platform does NOT reverse the Stripe transfer. Instead:

1. The conversion's `payout_status` flips from `paid` to `offset_applied`.
2. `affiliate_accounts.balance_offset_cents` is incremented by the
   conversion's `paid_amount_cents`.
3. `balance_offset_last_changed_at` is set to NOW.
4. An audit row is written to `admin_action_log`.

The next payout cycle reduces the gross payable by the offset before
transferring. If the offset exceeds the next ripe total, the affiliate
gets no transfer for that cycle and the residual offset rolls forward.

A non-zero `balance_offset_cents` that has not changed in 90 days
surfaces as an admin alert (Phase 2 Task 07). Admin can manually
write the offset off via the admin UI; the action is logged.

This trades zero Stripe-side complexity (no negative balances, no
reverse transfers) for one extra column and one branch in
reverseAffiliateConversionForBooking.
```

## Acceptance for this task

- [ ] `src/lib/affiliate-offset.ts::applyRefundOffsetForBooking` exists
      and exports the typed helper above
- [ ] `reverseAffiliateConversionForBooking` selects `payout_status` and
      branches:
      - `paid` → calls `applyRefundOffsetForBooking`
      - `offset_applied` → returns `already_reversed` (no-op)
      - else → calls existing `reverseConversion` (unchanged)
- [ ] An `admin_action_log` row is written on every successful offset
      application with the reason + the booking_id + the increment
- [ ] Refunding a paid booking flips
      `campaign_conversions.payout_status` from `paid` to `offset_applied`
      and increments `affiliate_accounts.balance_offset_cents`
- [ ] A second refund of the same already-offset booking is a no-op
      (`already_reversed`)
- [ ] Refunding a still-unpaid (e.g., within 24h hold) booking still
      reverses the conversion (Phase 1.5 behavior preserved)
- [ ] Spec §6.2 added

## Verification

```bash
# Helpers landed
ls src/lib/affiliate-offset.ts

# Branch wired in reversal helper
grep -n "applyRefundOffsetForBooking\|payout_status" src/lib/affiliate-reverse-conversion.ts

# Refund call sites unchanged (Phase 1.5 wiring still present, no new edits)
grep -n "reverseAffiliateConversionForBooking" src/lib/booking-refund.ts \
  src/app/api/admin/refunds/route.ts \
  src/app/api/cron/no-show-refunds/route.ts
# Expected: 2 hits each (import + call)
```

### Manual SQL after a refund-after-payout E2E

```sql
-- For a booking refunded after payout, conversion is offset_applied
SELECT b.id, b.refunded_at, c.payout_status, c.paid_amount_cents,
       a.balance_offset_cents, a.balance_offset_last_changed_at
  FROM bookings b
  JOIN campaign_conversions c ON c.booking_id = b.id
  JOIN diviner_affiliates da ON da.id = c.affiliate_id
  JOIN affiliate_accounts a ON a.id = da.affiliate_account_id
 WHERE b.id = '<test-booking-id>';
-- Expected:
--   refunded_at: not null
--   payout_status: 'offset_applied'
--   paid_amount_cents: e.g. 3500
--   balance_offset_cents: at least 3500 more than pre-refund value
```

## Out of scope

- Auto-write-off after 90 days (Task 07 admin UI surfaces the alert; the
  actual write-off remains a deliberate admin action)
- Partial refunds (current refund flow refunds the full booking; if
  partial-refund is added later, this helper will need pro-rating)
- Reversing a Stripe transfer via `stripe.transfers.createReversal` —
  intentionally not used (Path 2 alternative we explicitly rejected)
- Email / push notification to the affiliate that their next payout is
  reduced (Task 06 surfaces this in-UI; email follow-up is polish)
