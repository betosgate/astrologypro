# Task 05 — Refund Flow Correctness (Affiliate Conversion Reversal)

- Status: Not Started
- Priority: P0
- Depends on: 01, 02, 03
- Blocks: 04 (sign-off)

## Goal

When a booking is refunded, mark the linked `campaign_conversions` row as
reversed so the affiliate's credit is removed in the same transaction
that returns the customer's money. Today the customer is refunded but
the conversion row stays alive, leaving a phantom credit on every
affiliate report.

This task ships **Option A** (see `00-master-task.md` decision §9
below): leave Stripe's `refund_application_fee` flag at its default
(`false`), and instead reverse the `campaign_conversions` row at the
application layer. End state for a $175 booking with $35 affiliate
share, fully refunded:

| Account | Balance change |
|---|---|
| Customer | $0 (paid $175, refunded $175) ✓ |
| Diviner | $0 (received $113.75, clawed back $113.75 by Stripe) ✓ |
| Platform | $0 (held $61.25 application_fee, paid $175 refund, recovered $113.75 from diviner) ✓ |
| Affiliate (`campaign_conversions` row) | reversed_at set, no credit owed ✓ |

Stripe's default refund mechanic already debits the diviner's connected
account by `(refund_amount × (1 − application_fee_amount / charge_amount))`,
so the diviner is only out their net portion. We do **not** want
`refund_application_fee: true` because that returns the carved-out
share to the diviner — but the diviner was never credited it in the
first place (we carved it out at PaymentIntent time).

## Why this exists — pre-existing gap exposed by carve-out

Before the carve-out task, the affiliate's $35 was already in the
diviner's connected account; the `campaign_conversions` row was a DB
obligation only. On refund, Stripe pulled the full $148.75 (gross −
platform fee) back from the diviner. The conversion row was never
reversed — but since no actual transfer to the affiliate had happened,
this just left a stale credit row (a reporting bug, not a money bug).

After the carve-out task lands, the affiliate's $35 sits on platform
balance, ready for Phase 2 to transfer to the affiliate. If the
booking is refunded **and the conversion row is not reversed**, the
platform will eventually transfer $35 to an affiliate for a booking
that no longer exists. So the gap goes from "stale row in reports" to
"real money paid out for a refunded booking."

Task 05 closes the gap by adding the reversal call to every refund
surface, **for all bookings** (pre-deploy and post-deploy alike — pre-
deploy bookings benefit from cleaning up the stale credit, post-deploy
bookings need it to prevent real-money loss in Phase 2).

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/affiliate-reverse-conversion.ts` | **Add** new helper `reverseAffiliateConversionForBooking` |
| 2 | `src/lib/booking-refund.ts` | Wire call after `applyRefundToRevenueLedger` |
| 3 | `src/app/api/admin/refunds/route.ts` | Wire call after `applyRefundToRevenueLedger` |
| 4 | `src/app/api/cron/no-show-refunds/route.ts` | Wire call after Stripe refund succeeds |

`stripe.refunds.create({ ... })` calls **stay unchanged** — Option A
relies on Stripe's default destination-charge refund behavior. Do not
add `refund_application_fee: true`.

---

## Edit 1 — Add `reverseAffiliateConversionForBooking` helper

**File:** `src/lib/affiliate-reverse-conversion.ts`

Append after the existing `reverseConversion` function (after the
closing `}` at line 113). The wrapper looks up the conversion by
`booking_id`, then delegates to `reverseConversion`. Idempotent: if
no conversion exists (non-affiliate booking) or the row is already
reversed, returns a benign result without throwing.

### Anchor (find this exact line)

```ts
} // closes reverseConversion at line 113 — end of file today
```

### Append below

```ts
export type ReverseForBookingResult =
  | { ok: true; conversionId: string; amountCents: number; affiliateId: string }
  | { ok: false; reason: "no_conversion" | "already_reversed" | "db_error"; detail?: string };

/**
 * Look up the `campaign_conversions` row for a booking and mark it
 * reversed. Used by the refund pipeline (see Task 05 of the carve-out
 * sprint, docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/).
 *
 * Idempotent + non-throwing:
 *   - If the booking has no conversion row (non-affiliate booking),
 *     returns ok=false with reason="no_conversion". This is the
 *     normal case for most refunds.
 *   - If the row is already reversed (e.g. duplicate refund webhook),
 *     returns ok=false with reason="already_reversed".
 *   - DB errors return ok=false with reason="db_error" + detail. Caller
 *     should log and continue; a Stripe refund must NOT be rolled back
 *     because the reversal failed.
 */
export async function reverseAffiliateConversionForBooking(input: {
  admin: SupabaseClient;
  bookingId: string;
  reversedBy: string | null;
  reason: string;
}): Promise<ReverseForBookingResult> {
  const { admin, bookingId, reversedBy, reason } = input;

  const { data: conversion, error: fetchErr } = await admin
    .from("campaign_conversions")
    .select("id, reversed_at")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (fetchErr) {
    return { ok: false, reason: "db_error", detail: fetchErr.message };
  }
  if (!conversion) {
    return { ok: false, reason: "no_conversion" };
  }
  if (conversion.reversed_at) {
    return { ok: false, reason: "already_reversed" };
  }

  const result = await reverseConversion({
    admin,
    conversionId: conversion.id as string,
    reversedBy,
    reason,
  });
  return result;
}
```

### Verify post-edit

```bash
grep -n "reverseAffiliateConversionForBooking" src/lib/affiliate-reverse-conversion.ts
# Expected: 2 hits — type export, function export
grep -n "campaign_conversions" src/lib/affiliate-reverse-conversion.ts
# Expected: 2 hits — original + new helper's lookup
```

---

## Edit 2 — Wire into shared booking-refund pipeline

**File:** `src/lib/booking-refund.ts`

This pipeline is called by every cancel/refund surface (diviner
dashboard, admin route, client email link, trainee dashboard) **except**
the no-show cron and the legacy admin route — those are handled in
Edits 3 + 4.

### Anchor 2a — add import (near existing imports, line 5)

Find:
```ts
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
```

Replace with:
```ts
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
import { reverseAffiliateConversionForBooking } from "@/lib/affiliate-reverse-conversion";
```

### Anchor 2b — add reversal inside the existing best-effort try block

Find this block (current lines ~177–197):

```ts
    const reconciledEntry = await applyRefundToRevenueLedger({
      sourceType: "booking",
      sourceReference: `booking:${bookingId}`,
      refundAmountCents,
      refundEventId: refundEvent.id,
      actorUserId: initiatedByUserId,
      actorRole: initiatedByRole,
      reason: resolvedReason,
    });

    if (initiatedByUserId) {
      await createFinanceOperationNote({
        createdByUserId: initiatedByUserId,
        revenueLedgerEntryId: reconciledEntry.id,
        divinerId: (booking.diviner_id as string | null) ?? null,
        orderReference: `booking:${bookingId}`,
        noteType: "refund_investigation",
        note: resolvedReason,
        status: "resolved",
      });
    }
  } catch (ledgerError) {
    console.error("[issueBookingRefund] ledger/finance error:", ledgerError);
  }
```

**Insert** the reversal call between `reconciledEntry = ...` and
`if (initiatedByUserId) {`. The reversal lives inside the same try
block so a reversal failure does not roll back the Stripe refund — the
catch already logs without rethrowing.

```ts
    const reconciledEntry = await applyRefundToRevenueLedger({
      sourceType: "booking",
      sourceReference: `booking:${bookingId}`,
      refundAmountCents,
      refundEventId: refundEvent.id,
      actorUserId: initiatedByUserId,
      actorRole: initiatedByRole,
      reason: resolvedReason,
    });

    const reversalResult = await reverseAffiliateConversionForBooking({
      admin,
      bookingId,
      reversedBy: initiatedByUserId,
      reason: `Booking refunded: ${resolvedReason}`,
    });
    if (!reversalResult.ok && reversalResult.reason === "db_error") {
      console.error("[issueBookingRefund] conversion reversal db error:", {
        bookingId,
        detail: reversalResult.detail,
      });
    }

    if (initiatedByUserId) {
      // ... unchanged
```

### Verify post-edit

```bash
grep -n "reverseAffiliateConversionForBooking" src/lib/booking-refund.ts
# Expected: 2 hits — import + call
```

---

## Edit 3 — Wire into legacy admin refund route

**File:** `src/app/api/admin/refunds/route.ts`

This route predates `issueBookingRefund` and inlines the same pipeline.
Same wiring pattern.

### Anchor 3a — add import (near existing imports, line 7)

Find:
```ts
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
```

Replace with:
```ts
import { applyRefundToRevenueLedger } from "@/lib/revenue-ledger";
import { reverseAffiliateConversionForBooking } from "@/lib/affiliate-reverse-conversion";
```

### Anchor 3b — add reversal after `applyRefundToRevenueLedger`

Find (current lines ~228–246):

```ts
  const reconciledEntry = await applyRefundToRevenueLedger({
    sourceType: "booking",
    sourceReference: `booking:${bookingId}`,
    refundAmountCents: amountCents,
    refundEventId: refundEvent.id,
    actorUserId: user.id,
    actorRole: "admin",
    reason: reason ?? "Admin-issued refund",
  });

  await createFinanceOperationNote({
    createdByUserId: user.id,
    revenueLedgerEntryId: reconciledEntry.id,
    divinerId: booking.diviner_id ?? null,
    orderReference: `booking:${bookingId}`,
    noteType: "refund_investigation",
    note: reason ?? "Admin-issued refund",
    status: "resolved",
  });
```

**Insert** between the two `await` calls:

```ts
  const reconciledEntry = await applyRefundToRevenueLedger({ /* unchanged */ });

  const reversalResult = await reverseAffiliateConversionForBooking({
    admin,
    bookingId,
    reversedBy: user.id,
    reason: `Booking refunded by admin: ${reason ?? "Admin-issued refund"}`,
  });
  if (!reversalResult.ok && reversalResult.reason === "db_error") {
    console.error("[admin/refunds] conversion reversal db error:", {
      bookingId,
      detail: reversalResult.detail,
    });
  }

  await createFinanceOperationNote({ /* unchanged */ });
```

### Verify post-edit

```bash
grep -n "reverseAffiliateConversionForBooking" src/app/api/admin/refunds/route.ts
# Expected: 2 hits — import + call
```

---

## Edit 4 — Wire into no-show refund cron

**File:** `src/app/api/cron/no-show-refunds/route.ts`

The cron runs every N minutes and refunds no-show bookings. It already
calls `stripe.refunds.create` and updates the booking row, but does
NOT currently call `applyRefundToRevenueLedger` or `recordRefundEvent`
(see "Pre-existing limitations" below — out of scope for this task).
We add the conversion reversal here regardless, because a no-show
refund should reverse the affiliate credit too.

### Anchor 4a — add import + admin client requirement

Find the existing imports at the top of the file. Add:

```ts
import { reverseAffiliateConversionForBooking } from "@/lib/affiliate-reverse-conversion";
```

The cron already uses an `admin` Supabase client (verify via `grep -n "createAdminClient\|admin\." src/app/api/cron/no-show-refunds/route.ts` — should show it's already in scope).

### Anchor 4b — add reversal after the booking update

Find (current lines ~171–207):

```ts
    try {
      if (refundAmountCents > 0 && booking.stripe_payment_intent_id) {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: "requested_by_customer",
          metadata: {
            booking_id: booking.id,
            no_show_type: noShowType,
            refund_percent: String(refundPercent),
          },
        });
      }

      await admin
        .from("bookings")
        .update({
          status: "no_show",
          no_show_type: noShowType,
          no_show_processed_at: now,
          refund_amount: refundAmount,
          refunded_at: now,
          refund_reason: refundReason,
        })
        .eq("id", booking.id);

      // Email the client
```

Insert reversal call between the booking `.update(...)` and the email
block (only when an actual Stripe refund went out — partial
no-show refunds with `refundAmountCents = 0` should not reverse the
conversion):

```ts
      await admin
        .from("bookings")
        .update({ /* unchanged */ })
        .eq("id", booking.id);

      if (refundAmountCents > 0 && booking.stripe_payment_intent_id) {
        const reversalResult = await reverseAffiliateConversionForBooking({
          admin,
          bookingId: booking.id,
          reversedBy: null,
          reason: `No-show ${refundPercent}% refund: ${refundReason}`,
        });
        if (!reversalResult.ok && reversalResult.reason === "db_error") {
          console.error("[no-show-cron] conversion reversal db error:", {
            bookingId: booking.id,
            detail: reversalResult.detail,
          });
        }
      }

      // Email the client
```

### Verify post-edit

```bash
grep -n "reverseAffiliateConversionForBooking" src/app/api/cron/no-show-refunds/route.ts
# Expected: 2 hits — import + call
```

---

## What we explicitly do NOT change

- **`stripe.refunds.create({...})` arguments** — left at Stripe defaults.
  No `refund_application_fee: true`. See Option A reasoning in
  `00-master-task.md` decision §9.
- **Existing `applyRefundToRevenueLedger`** — already correctly
  proportions `refunded_affiliate_commission_cents`. The reversal we
  add is at the conversion level (the affiliate's credit record), not
  the ledger level (the platform's accounting record). They're
  complementary.
- **Webhook `charge.refunded` handler** — if it exists and already
  calls `reverseConversion`, leave it. (Verify before starting:
  `grep -rn "charge.refunded\|reverseConversion" src/app/api/stripe/webhooks/` —
  if a path already reverses, the new helper's
  `reason === "already_reversed"` branch handles the second call
  idempotently.)
- **`campaign_conversions` schema** — no changes. The existing
  `reversed_at`, `reversed_by`, `reversal_reason` columns already
  carry the data.

## Acceptance for this task

- [ ] `reverseAffiliateConversionForBooking` exported from
      `src/lib/affiliate-reverse-conversion.ts`
- [ ] Three refund call sites import it and call it after the Stripe
      refund succeeds
- [ ] Reversal failure does NOT roll back the Stripe refund (try/catch
      isolation in `booking-refund.ts`; logged-and-continue in
      admin/refunds; logged-and-continue in cron)
- [ ] Refunding a booking with no affiliate stamp returns
      `reason="no_conversion"` with no error and no log noise
- [ ] Refunding a booking twice (idempotent retry) returns
      `reason="already_reversed"` on the second call
- [ ] `campaign_conversions.reversed_at` is set within seconds of
      Stripe refund completion in all three flows
- [ ] Affiliate dashboards stop showing the refunded conversion as
      earned (verified via `/affiliate/earnings` UI after E2E refund)
- [ ] No `refund_application_fee: true` was added anywhere

## Verification (post-deploy)

### SQL — reversal landed correctly

```sql
-- For a refunded affiliate booking, the conversion row is reversed
WITH refunded AS (
  SELECT id, refunded_at FROM bookings
   WHERE refunded_at IS NOT NULL
     AND refunded_at > now() - interval '7 days'
)
SELECT
  b.id AS booking_id,
  b.refunded_at,
  c.id AS conversion_id,
  c.reversed_at,
  c.reversal_reason,
  CASE
    WHEN c.id IS NULL THEN 'no_conversion (ok)'
    WHEN c.reversed_at IS NULL THEN 'BUG: conversion not reversed'
    WHEN c.reversed_at >= b.refunded_at - interval '1 minute'
     AND c.reversed_at <= b.refunded_at + interval '5 minutes'
      THEN 'reversed_in_band (ok)'
    ELSE 'reversed_out_of_band (investigate)'
  END AS status
  FROM refunded b
  LEFT JOIN campaign_conversions c ON c.booking_id = b.id
 ORDER BY b.refunded_at DESC;
-- Expected after deploy: every BUG row count -> 0 going forward.
-- Pre-deploy refunded bookings keep their stale conversion rows
-- (acceptable; out of scope to backfill).
```

### Stripe Dashboard — money flow check

For a fully refunded post-Task-02 affiliate booking:

1. Open the original PaymentIntent. Confirm
   `application_fee_amount = platform + affiliate` cents.
2. Open the refund. Confirm `amount = full gross`,
   `refund_application_fee = false` (default).
3. Open the diviner's connected account balance transactions for the
   refund date. Confirm a debit equal to `(gross − application_fee)`,
   not `gross`.

If step 3 shows the diviner debited the full gross, somebody added
`refund_application_fee: true` — back it out.

## Pre-existing limitations (out of scope, flagged)

These are gaps that exist independent of this sprint. Do not expand
scope to fix them here; file separately if needed.

1. **No-show cron does not write to revenue ledger.** The cron at
   `src/app/api/cron/no-show-refunds/route.ts` issues Stripe refunds
   but never calls `applyRefundToRevenueLedger` or `recordRefundEvent`.
   Result: no-show refunds are invisible in the admin finance ledger.
   Pre-existing — Task 05 only adds the conversion reversal here, not
   the broader ledger sync. Track separately.
2. **Pre-deploy refunded bookings keep stale conversion rows.** Task 05
   only fixes refunds going forward. Historical refunds from before
   this deploy still have `campaign_conversions.reversed_at = NULL`
   despite the booking being refunded. A one-time backfill SQL is
   trivial (UPDATE all conversions where `booking_id` joins to a
   refunded booking) but is **not** part of this task. Add to a
   follow-up clean-up if reporting accuracy demands it.

## Out of scope

- Stripe Express onboarding (Phase 2)
- Backfilling conversion reversals for pre-deploy refunded bookings
- Wiring the no-show cron into the full ledger pipeline
- Adding a webhook listener for `charge.refunded` (separate concern;
  refund pipeline already handles the application-side write)
- Reversing the `revenue_ledger_entries` row entirely instead of
  proportionally (current proportional-refund code is correct; do not
  change)
