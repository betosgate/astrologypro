# Task 02 — Booking-Payment Route: Carve-Out Implementation

- Status: Not Started
- Priority: P0
- Depends on: 01
- Blocks: 03

## Goal

Wire the existing `calculateMoneySplit` plumbing all the way through:
compute the affiliate commission cents from the stamp at booking
creation time, pass it into the split, increase the PaymentIntent's
`application_fee_amount` by that amount, persist the cents on the
booking row, and add the cents to Stripe metadata.

## Single file affected

`src/app/api/stripe/booking-payment/route.ts`

## Edits — in execution order

Each edit is anchored to a string from the current file (verified
against HEAD on 2026-05-05) so line drift won't break the plan.

### Edit 1 — add the `computeCommissionCents` import

**Anchor (find this):**
```ts
import { resolveStampForBooking } from "@/lib/affiliate-stamp";
```

(This is line 16 in the current file.)

**Replace with:**
```ts
import { resolveStampForBooking } from "@/lib/affiliate-stamp";
import { computeCommissionCents } from "@/lib/affiliate-attribution";
```

`computeCommissionCents` is a pure function exported from
`src/lib/affiliate-attribution.ts` (already there since the v2 sprint).

**Verify after edit:**
```bash
grep -c "computeCommissionCents" src/app/api/stripe/booking-payment/route.ts
# Expected: 2 (one import, one usage in Edit 2)
# Will become 2 after Edit 2 lands.
```

### Edit 2 — compute the commission cents right after the stamp

**Anchor (find this exact block):**
```ts
    const stamp = await resolveStampForBooking(adminSupabase, {
      refCode: refCode ?? null,
      divinerId: resolvedDivinerId,
      serviceId,
    });
    if (refCode && stamp.reason !== "stamped") {
```

(`stamp` is created at line 617 in the current file; the
`if (refCode && stamp.reason !== "stamped")` block follows.)

**Insert this block IMMEDIATELY AFTER the `await resolveStampForBooking({...});`
line and BEFORE the `if (refCode && stamp.reason !== "stamped")` line:**

```ts
    // Phase-2-prerequisite carve-out: when the booking is stamped,
    // compute the cents the affiliate is owed and feed it into the
    // money split so the PaymentIntent's application_fee_amount
    // includes the affiliate's share. Diviner's destination transfer
    // is correspondingly reduced. Non-stamped bookings → 0 cents →
    // unchanged from current behavior.
    //
    // Sprint: docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/
    const grossAmountCentsForCarveOut = Math.round(finalPrice * 100);
    const affiliateCommissionCents =
      stamp.reason === "stamped"
        ? computeCommissionCents(
            grossAmountCentsForCarveOut,
            stamp.rate_type_stamp,
            stamp.rate_value_stamp,
          )
        : 0;
```

`finalPrice` is already in scope (it's the post-discount, post-pricing
amount the customer is being charged in dollars).

### Edit 3 — pass `affiliateCommissionCents` into `calculateMoneySplit`

**Anchor (find this exact call — line 545):**
```ts
    const bookingSplit = calculateMoneySplit({
      grossAmountCents,
      platformFeePercent: effectivePlatformFeePercent,
      platformFeeRule:
        typeof (service as Record<string, unknown>).platform_fee_percent === "number"
          ? "service_platform_fee_percent"
          : "global_platform_fee_percent",
      memberDiscountApplied,
    });
```

**Replace with (adds 2 lines):**
```ts
    const bookingSplit = calculateMoneySplit({
      grossAmountCents,
      platformFeePercent: effectivePlatformFeePercent,
      affiliateCommissionCents,
      platformFeeRule:
        typeof (service as Record<string, unknown>).platform_fee_percent === "number"
          ? "service_platform_fee_percent"
          : "global_platform_fee_percent",
      affiliateRule:
        affiliateCommissionCents > 0 ? "stamped_affiliate_share" : "no_affiliate_share",
      memberDiscountApplied,
    });
```

The `affiliateRule` string `"stamped_affiliate_share"` matches the
existing convention used by the subscription-path caller in webhooks
(`src/app/api/stripe/webhooks/route.ts:1397` uses
`"affiliate_commission_rule"` — but we're using `"stamped_…"` to
distinguish that this came from a booking stamp specifically).

**ORDER NOTE:** Edit 3 references `affiliateCommissionCents`. So
Edit 2 (which declares the variable) must happen at line ~617 BUT
the variable must be in scope at line 545. **That means Edit 2's
block must be hoisted ABOVE the `calculateMoneySplit` call.**

Re-read the current code: `resolveStampForBooking` is at line 617;
`calculateMoneySplit` is at line 545. So the stamp is computed AFTER
the split today.

**Solution — Edit 2's block must move:** put the stamp resolution
+ commission computation BEFORE `calculateMoneySplit`. Concretely:

#### Re-ordered Edit 2 — the actual change

The original code at line 545 calls `calculateMoneySplit` THEN line
617 calls `resolveStampForBooking`. Reverse this order.

**Find (line 540 area, current state):**
```ts
        : PRICING.platformFeePercent;
    const effectivePlatformFeePercent = memberDiscountApplied
      ? Math.max(basePlatformFeePercent - 5, 10)
      : basePlatformFeePercent;
    const grossAmountCents = Math.round(finalPrice * 100);
    const bookingSplit = calculateMoneySplit({
```

**Find (line 615 area, current state):**
```ts
    const stamp = await resolveStampForBooking(adminSupabase, {
      refCode: refCode ?? null,
      divinerId: resolvedDivinerId,
      serviceId,
    });
```

**The implementer must MOVE the stamp resolution above the split
calculation.** Cut the entire `const stamp = await resolveStampForBooking(...)`
block PLUS the following `if (refCode && stamp.reason !== "stamped")
{ console.log(JSON.stringify({...})); }` logging block (currently
lines 617–632) and PASTE them immediately above the `const grossAmountCents = …`
declaration (currently line 544).

After moving, the order should be:

```ts
    // ... pricing, finalPrice, memberDiscountApplied computed above

    const stamp = await resolveStampForBooking(adminSupabase, {
      refCode: refCode ?? null,
      divinerId: resolvedDivinerId,
      serviceId,
    });
    if (refCode && stamp.reason !== "stamped") {
      console.log(
        JSON.stringify({
          event: "affiliate_stamp_skipped",
          refCode,
          reason: stamp.reason,
          divinerId: resolvedDivinerId,
          serviceId,
        }),
      );
    }

    const grossAmountCentsForCarveOut = Math.round(finalPrice * 100);
    const affiliateCommissionCents =
      stamp.reason === "stamped"
        ? computeCommissionCents(
            grossAmountCentsForCarveOut,
            stamp.rate_type_stamp,
            stamp.rate_value_stamp,
          )
        : 0;

    const grossAmountCents = Math.round(finalPrice * 100);
    const bookingSplit = calculateMoneySplit({
      grossAmountCents,
      platformFeePercent: effectivePlatformFeePercent,
      affiliateCommissionCents,
      platformFeeRule:
        typeof (service as Record<string, unknown>).platform_fee_percent === "number"
          ? "service_platform_fee_percent"
          : "global_platform_fee_percent",
      affiliateRule:
        affiliateCommissionCents > 0 ? "stamped_affiliate_share" : "no_affiliate_share",
      memberDiscountApplied,
    });
```

`grossAmountCentsForCarveOut` and `grossAmountCents` are
intentionally separate locals (same value computationally). The first
is named to make the intent clear at the carve-out site; the second
is the existing variable used downstream. Keep both for readability.

**Verify the move didn't leave a duplicate stamp resolution:**
```bash
grep -c "await resolveStampForBooking" src/app/api/stripe/booking-payment/route.ts
# Expected: 1
```

### Edit 4 — combine platform fee + affiliate share into `application_fee_amount`

**Anchor (find — line 554 in current file):**
```ts
    const platformFee = bookingSplit.platformFeeCents / 100;
```

**Replace with:**
```ts
    // What stays on platform balance: platform's true fee + affiliate's
    // share (Phase 2 will later transfer the affiliate share out to the
    // affiliate's connected account). The diviner's destination transfer
    // is the remainder, equal to bookingSplit.divinerNetAmountCents.
    const platformPlusAffiliateCents =
      bookingSplit.platformFeeCents + bookingSplit.affiliateCommissionCents;
    const platformFee = platformPlusAffiliateCents / 100;
```

Variable `platformFee` is reused at line 745 by `createPaymentIntent`
without further changes — that call site picks up the new value
automatically.

**Verify:**
```bash
grep -n "platformPlusAffiliateCents" src/app/api/stripe/booking-payment/route.ts
# Expected: 2 hits — declaration and assignment.
```

### Edit 5 — persist commission cents on the booking row

**Anchor (find — line 659–665 in current file):**
```ts
        ...(stamp.reason === "stamped"
          ? {
              commission_source_assignment_id: stamp.source_assignment_id,
              commission_source_template_id: stamp.source_template_id,
              commission_rate_type_stamp: stamp.rate_type_stamp,
              commission_rate_value_stamp: stamp.rate_value_stamp,
            }
          : {}),
```

**Replace with:**
```ts
        ...(stamp.reason === "stamped"
          ? {
              commission_source_assignment_id: stamp.source_assignment_id,
              commission_source_template_id: stamp.source_template_id,
              commission_rate_type_stamp: stamp.rate_type_stamp,
              commission_rate_value_stamp: stamp.rate_value_stamp,
              affiliate_commission_amount_cents: affiliateCommissionCents,
            }
          : {}),
```

When `stamp.reason !== "stamped"`, the column stays NULL (the spread
is empty). That's intentional — distinguishes "never stamped" from
"stamped at $0".

### Edit 6 — extend Stripe metadata with the new audit fields

**Anchor (find — line 755–771 in current file, the metadata object inside
`createPaymentIntent({ ... })`):**

```ts
        metadata: {
          bookingId: booking.id,
          bookingToken: booking.booking_token,
          orderId,
          divinerId: resolvedDivinerId,
          serviceId,
          clientEmail,
          connectedAccountId: diviner.stripe_account_id ?? "",
          grossAmountCents: String(bookingSplit.grossAmountCents),
          platformFeeCents: String(bookingSplit.platformFeeCents),
          divinerGrossAmountCents: String(bookingSplit.divinerGrossAmountCents),
          splitPlatformFeePercent: String(bookingSplit.trace.platformFeePercent),
          splitPlatformFeeRule: bookingSplit.trace.platformFeeRule,
          splitAffiliateRule: bookingSplit.trace.affiliateRule,
          ...(affiliateCode ? { affiliateCode } : {}),
```

**Add three lines (after `divinerGrossAmountCents`, before
`splitPlatformFeePercent`):**

```ts
          divinerGrossAmountCents: String(bookingSplit.divinerGrossAmountCents),
          divinerNetAmountCents: String(bookingSplit.divinerNetAmountCents),
          affiliateCommissionCents: String(bookingSplit.affiliateCommissionCents),
          applicationFeeCents: String(bookingSplit.platformFeeCents + bookingSplit.affiliateCommissionCents),
          splitPlatformFeePercent: ...
```

Stripe metadata values must be strings — `String(...)` everywhere.
The fourth field (`applicationFeeCents`) is the actual sum we passed
to Stripe, included for cross-check at audit time.

## Type-check

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx --yes -p typescript@5 tsc \
  --noEmit -p tsconfig.json 2>&1 \
  | grep "src/app/api/stripe/booking-payment/route.ts" | head -10
# Expected: empty output. Pre-existing errors in other files are
# acceptable (they were there before).
```

## Edge cases — verified by code path tracing

| Scenario | Behavior | Why |
|---|---|---|
| **Non-affiliate booking** (no `refCode` or all stamp gates fail) | `stamp.reason !== "stamped"` → `affiliateCommissionCents=0` → split returns same shape as today → `application_fee_amount` matches CURRENT behavior. **Zero regression.** | The stamp condition gate guards the carve-out. |
| **Free booking** (`finalPrice=0`) | `grossAmountCentsForCarveOut=0` → `computeCommissionCents` returns 0 (function short-circuits on `orderAmountCents <= 0` per `src/lib/affiliate-attribution.ts:123`) → no PaymentIntent created (existing `if (shouldCharge)` branch handles this) → booking row has `affiliate_commission_amount_cents=0` only when stamp.reason='stamped'. | No money to carve out. |
| **Flat-rate stamp** | `computeCommissionCents` handles flat (`commission_value * 100`) → split caps at `divinerGrossAmountCents` → diviner can't go negative. | Existing math + existing cap. |
| **Member discount** | `effectivePlatformFeePercent` already adjusted before split. `affiliateCommissionCents` computed from post-discount `finalPrice`. Net economics still sum to gross. | Same flow, smaller numbers. |
| **Cap exceeded** (commission > divinerGross — defensive only) | `calculateMoneySplit` clamps via `Math.min(divinerGrossAmountCents, commissionCents)` (line 38–44). `application_fee_amount` will equal `gross`; diviner transfer = 0. Stripe accepts. | Already guarded in money-split.ts. |
| **Stamp computed at one rate, then assignment rate edited before customer pays** | Irrelevant. Stamp captured at booking creation; `affiliateCommissionCents` derived from that stamp. Carve-out matches stamp. Rate-stamp invariant holds. | Existing v2 invariant. |
| **PaymentIntent fails (declined card)** | Booking row already has stamp + commission cents. Customer must restart (current behavior — no retry path). On restart, NEW booking row gets new stamp + cents (rate-resolution might pick a different rate if assignment changed). | Out of scope for this task. |

## Acceptance for this task

- [ ] `computeCommissionCents` import added (Edit 1)
- [ ] Stamp resolution moved above the split (re-ordered Edit 2)
- [ ] `affiliateCommissionCents` local computed right after stamp
- [ ] `calculateMoneySplit` call passes `affiliateCommissionCents` and
      `affiliateRule` (Edit 3)
- [ ] `platformFee` derivation includes affiliate share (Edit 4)
- [ ] Booking insert payload includes
      `affiliate_commission_amount_cents` only when
      `stamp.reason === "stamped"` (Edit 5)
- [ ] Stripe metadata gains `divinerNetAmountCents`,
      `affiliateCommissionCents`, `applicationFeeCents` (Edit 6)
- [ ] Type-check clean for `src/app/api/stripe/booking-payment/route.ts`
- [ ] Manual smoke: a non-affiliate booking still produces
      `application_fee_amount = bookingSplit.platformFeeCents` exactly
      (verify via Stripe dashboard for a test booking)

## Verification commands (post-deploy on dev)

After running an affiliate-attributed booking through the wizard:

```sql
-- Booking row should now have the cents stored
SELECT
  id,
  base_price,
  ref_code,
  commission_rate_type_stamp,
  commission_rate_value_stamp,
  affiliate_commission_amount_cents
FROM bookings
WHERE ref_code = '<your test campaign code>'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: affiliate_commission_amount_cents > 0,
--           equals computeCommissionCents(base_price * 100, type, value)
```

In Stripe Dashboard → PaymentIntent for the booking → metadata:
- `affiliateCommissionCents` = booking's stored value
- `applicationFeeCents` = `platformFeeCents + affiliateCommissionCents`
- `splitAffiliateRule` = `"stamped_affiliate_share"`

Then in Connected accounts → diviner → Recent transfers: the
transfer amount for that booking = `divinerNetAmountCents / 100`
(in dollars).

## Out of scope for this task

- Updating `creditAffiliateConversion` to read the stored cents
  (Task 03)
- Updating the revenue ledger entry (Task 03)
- Tests (Task 04)
- Spec sync (Task 04)
