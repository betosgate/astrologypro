# Task 03 — Credit + Revenue Ledger: Read Stored Cents

- Status: Not Started
- Priority: P0
- Depends on: 01, 02
- Blocks: 04

## Goal

Make sure the THREE credit paths and the revenue-ledger entry write
values exactly equal to what was carved out at booking creation. Read
the stored cents from `bookings.affiliate_commission_amount_cents`
verbatim instead of re-computing.

## Why now

Task 02 stores `bookings.affiliate_commission_amount_cents` at
creation. The credit function currently re-computes via
`computeCommissionCents(orderAmountCents, rate_type_stamp,
rate_value_stamp)` where `orderAmountCents` derives from
`booking.total_amount ?? base_price`. If `total_amount` differs from
what was charged at PaymentIntent time (rare but possible — e.g., the
amount field gets adjusted), the recomputed cents would drift from
the carved-out cents on the platform balance.

Storage already exists; this task wires the read.

## Files affected (4)

1. `src/lib/affiliate-attribution.ts` — `creditAffiliateConversion`
2. `src/app/api/stripe/webhooks/route.ts` — webhook caller (Path B)
   AND the booking revenue-ledger entry
3. `src/app/api/stripe/confirm-payment/route.ts` — frontend fallback
   caller (Path A)
4. `src/app/api/stripe/sync-booking/route.ts` — manual recovery
   caller (Path C)

## Edits — in execution order

### Edit 1 — Extend `CreditConversionInput` to accept stored cents

**File:** `src/lib/affiliate-attribution.ts`

**Anchor (find this interface — around line 140 in current file):**
```ts
export interface CreditConversionInput {
  bookingId: string;
  orderAmountCents: number;
  /** Copy of bookings.ref_code. Used for conversion row snapshot + campaign lookup. */
  refCode: string | null | undefined;
  /**
   * bookings.commission_source_assignment_id — authoritative rate source
   * for per-diviner credits. NULL when the booking was stamped via the
   * Phase 1.5 general path (use stampedTemplateId then) or not at all.
   */
  stampedAssignmentId: string | null;
  /**
   * Phase 1.5: bookings.commission_source_template_id — authoritative
   * source for general-program credits. Mutually exclusive in practice
   * with stampedAssignmentId. Both NULL → no commission.
   */
  stampedTemplateId: string | null;
  /** bookings.commission_rate_type_stamp — 'percent' or 'flat', or NULL. */
  stampedRateType: "percent" | "flat" | null;
  /** bookings.commission_rate_value_stamp — NUMERIC, or NULL. */
  stampedRateValue: number | null;
}
```

**Replace by appending one new field at the end:**

```ts
export interface CreditConversionInput {
  bookingId: string;
  orderAmountCents: number;
  refCode: string | null | undefined;
  stampedAssignmentId: string | null;
  stampedTemplateId: string | null;
  stampedRateType: "percent" | "flat" | null;
  stampedRateValue: number | null;
  /**
   * Phase-2-prerequisite (2026-05-05 sprint): the cents value carved
   * out at booking creation, persisted on
   * bookings.affiliate_commission_amount_cents. When provided and
   * non-negative, used verbatim for the conversion row's
   * commission_amount_cents — guarantees exact match with what the
   * platform actually retained at PaymentIntent time. NULL on
   * pre-2026-05-05 bookings; falls back to recomputing via
   * computeCommissionCents in that case.
   */
  stampedCommissionCents: number | null;
}
```

### Edit 2 — Use stored cents in `creditAffiliateConversion`

**File:** `src/lib/affiliate-attribution.ts`

**Anchor (find this exact line, somewhere around line 250):**
```ts
  // Commission is computed from the stamp, NOT from any campaign or
  // template read. Same math regardless of which path we took.
  const commissionCents = computeCommissionCents(
    params.orderAmountCents,
    params.stampedRateType,
    params.stampedRateValue,
  );
```

**Replace with:**
```ts
  // Commission is computed from the stamp, NOT from any campaign or
  // template read. When the booking carries the carved-out cents from
  // 2026-05-05's task (affiliate_commission_amount_cents), use that
  // value verbatim — guarantees the conversion row matches what the
  // platform actually retained at PaymentIntent time. Falls back to
  // recomputing for pre-2026-05-05 bookings whose column is NULL.
  const commissionCents =
    typeof params.stampedCommissionCents === "number" &&
    params.stampedCommissionCents >= 0
      ? params.stampedCommissionCents
      : computeCommissionCents(
          params.orderAmountCents,
          params.stampedRateType,
          params.stampedRateValue,
        );
```

### Edit 3 — Webhook (Path B): pull stored cents and pass through

**File:** `src/app/api/stripe/webhooks/route.ts`

**Anchor 3a (find the booking SELECT for affiliate attribution — line 1858–1865):**
```ts
    const { creditAffiliateConversion } = await import("@/lib/affiliate-attribution");
    const { data: bookingForAttribution } = await supabase
      .from("bookings")
      .select(
        "id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp",
      )
      .eq("id", bookingId)
      .single();
```

**Replace with (column added at end of select string):**
```ts
    const { creditAffiliateConversion } = await import("@/lib/affiliate-attribution");
    const { data: bookingForAttribution } = await supabase
      .from("bookings")
      .select(
        "id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp, affiliate_commission_amount_cents",
      )
      .eq("id", bookingId)
      .single();
```

**Anchor 3b (find the `creditAffiliateConversion` call — line 1934 area):**
```ts
      await creditAffiliateConversion(supabase, {
        bookingId: bookingForAttribution.id as string,
        orderAmountCents: Math.round(amountCents),
        refCode: (bookingForAttribution.ref_code as string | null) ?? null,
        stampedAssignmentId:
          (bookingForAttribution.commission_source_assignment_id as
            | string
            | null) ?? null,
        stampedTemplateId:
          (bookingForAttribution.commission_source_template_id as
            | string
            | null) ?? null,
        stampedRateType:
          (bookingForAttribution.commission_rate_type_stamp as
            | "percent"
            | "flat"
            | null) ?? null,
        stampedRateValue:
          bookingForAttribution.commission_rate_value_stamp != null
            ? Number(bookingForAttribution.commission_rate_value_stamp)
            : null,
      });
```

**Replace with (one field added at the end of the args object):**
```ts
      await creditAffiliateConversion(supabase, {
        bookingId: bookingForAttribution.id as string,
        orderAmountCents: Math.round(amountCents),
        refCode: (bookingForAttribution.ref_code as string | null) ?? null,
        stampedAssignmentId:
          (bookingForAttribution.commission_source_assignment_id as
            | string
            | null) ?? null,
        stampedTemplateId:
          (bookingForAttribution.commission_source_template_id as
            | string
            | null) ?? null,
        stampedRateType:
          (bookingForAttribution.commission_rate_type_stamp as
            | "percent"
            | "flat"
            | null) ?? null,
        stampedRateValue:
          bookingForAttribution.commission_rate_value_stamp != null
            ? Number(bookingForAttribution.commission_rate_value_stamp)
            : null,
        stampedCommissionCents:
          bookingForAttribution.affiliate_commission_amount_cents != null
            ? Number(bookingForAttribution.affiliate_commission_amount_cents)
            : null,
      });
```

### Edit 4 — Confirm-payment (Path A): same shape as webhook

**File:** `src/app/api/stripe/confirm-payment/route.ts`

**Anchor 4a (find the booking SELECT — line 35–38):**
```ts
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, diviner_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp")
    .eq("id", body.bookingId)
    .maybeSingle();
```

**Replace with:**
```ts
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, diviner_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp, affiliate_commission_amount_cents")
    .eq("id", body.bookingId)
    .maybeSingle();
```

**Anchor 4b (find the `creditAffiliateConversion` call — line 131–139):**
```ts
      await creditAffiliateConversion(admin, {
        bookingId: booking.id,
        orderAmountCents: Math.round(amountCents),
        refCode: (booking.ref_code as string | null) ?? null,
        stampedAssignmentId: (booking.commission_source_assignment_id as string | null) ?? null,
        stampedTemplateId: (booking.commission_source_template_id as string | null) ?? null,
        stampedRateType: (booking.commission_rate_type_stamp as "percent" | "flat" | null) ?? null,
        stampedRateValue: booking.commission_rate_value_stamp != null ? Number(booking.commission_rate_value_stamp) : null,
      });
```

**Replace with (added one line at end of args):**
```ts
      await creditAffiliateConversion(admin, {
        bookingId: booking.id,
        orderAmountCents: Math.round(amountCents),
        refCode: (booking.ref_code as string | null) ?? null,
        stampedAssignmentId: (booking.commission_source_assignment_id as string | null) ?? null,
        stampedTemplateId: (booking.commission_source_template_id as string | null) ?? null,
        stampedRateType: (booking.commission_rate_type_stamp as "percent" | "flat" | null) ?? null,
        stampedRateValue: booking.commission_rate_value_stamp != null ? Number(booking.commission_rate_value_stamp) : null,
        stampedCommissionCents:
          booking.affiliate_commission_amount_cents != null
            ? Number(booking.affiliate_commission_amount_cents)
            : null,
      });
```

### Edit 5 — Sync-booking (Path C): TWO call sites in this file

**File:** `src/app/api/stripe/sync-booking/route.ts`

This file has the booking SELECT once at line 40, then TWO separate
`creditAffiliateConversion` calls — one at line 71 (free-booking
branch) and one at line 139 (paid-booking branch).

**Anchor 5a (find the booking SELECT — line 40-41):**
```ts
  let bookingQuery = admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp, diviner_id")
    .eq("id", body.booking_id);
```

**Replace with:**
```ts
  let bookingQuery = admin
    .from("bookings")
    .select("id, status, stripe_payment_intent_id, base_price, total_amount, ref_code, commission_source_assignment_id, commission_source_template_id, commission_rate_type_stamp, commission_rate_value_stamp, affiliate_commission_amount_cents, diviner_id")
    .eq("id", body.booking_id);
```

**Anchor 5b (find the FREE-branch credit call — line 71-79):**
```ts
        await creditAffiliateConversion(admin, {
          bookingId: booking.id,
          orderAmountCents: Math.round(amountCents),
          refCode: (booking.ref_code as string | null) ?? null,
          stampedAssignmentId: (booking.commission_source_assignment_id as string | null) ?? null,
          stampedTemplateId: (booking.commission_source_template_id as string | null) ?? null,
          stampedRateType: (booking.commission_rate_type_stamp as "percent" | "flat" | null) ?? null,
          stampedRateValue: booking.commission_rate_value_stamp != null ? Number(booking.commission_rate_value_stamp) : null,
        });
```

**Replace with the same shape as Edit 4b** (add the
`stampedCommissionCents` field at the end).

**Anchor 5c (find the PAID-branch credit call — line 139-147):**
Identical body to 5b. Apply the same edit.

After both, search to confirm:

```bash
grep -c "stampedCommissionCents" src/app/api/stripe/sync-booking/route.ts
# Expected: 2 (one in each branch)
```

### Edit 6 — Revenue ledger entry: read from booking row

**File:** `src/app/api/stripe/webhooks/route.ts`

**Anchor (find the affiliate commission lookup that feeds the booking
revenue ledger entry — around line 2048-2050):**
```ts
  const orderReference = `booking:${bookingId}`;
  const affiliateCommissionCents =
    await getAffiliateCommissionTotalForOrderRef(orderReference);
```

**Replace with:**
```ts
  const orderReference = `booking:${bookingId}`;
  // Read from the booking row first — that's what was actually carved
  // out at PaymentIntent time. Falls back to summing campaign_conversions
  // for pre-2026-05-05 bookings whose column is NULL.
  const { data: ledgerBooking } = await supabase
    .from("bookings")
    .select("affiliate_commission_amount_cents")
    .eq("id", bookingId)
    .maybeSingle();
  const affiliateCommissionCents =
    ledgerBooking?.affiliate_commission_amount_cents != null
      ? Number(ledgerBooking.affiliate_commission_amount_cents)
      : await getAffiliateCommissionTotalForOrderRef(orderReference);
```

`getAffiliateCommissionTotalForOrderRef` import (line 33) stays —
it's still used as the fallback. Don't remove the import.

## What does NOT change

- `creditAffiliateConversion`'s INSERT shape — same columns, same
  UNIQUE-violation idempotency, same notification fire
- The reason-code log lines — debugging existing failures still works
- The stamp resolver
- `/r/[code]` handler
- Any UI

## Type-check

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx --yes -p typescript@5 tsc \
  --noEmit -p tsconfig.json 2>&1 \
  | grep -E "src/(lib/affiliate-attribution|app/api/stripe/(webhooks|confirm-payment|sync-booking))" | head -10
# Expected: empty.
```

## Edge cases — verified

| Scenario | Behavior |
|---|---|
| Booking from BEFORE Task 02 deploy | `affiliate_commission_amount_cents = NULL` → `stampedCommissionCents = null` → fallback to `computeCommissionCents` recompute. **Same behavior as today.** |
| Booking with no stamp | `stamp.reason !== "stamped"` → column is NULL → `stampedCommissionCents = null` → recompute → 0 (rate values are also NULL → `computeCommissionCents` returns 0). |
| Both per-diviner AND general stamps somehow set | Not possible per resolver invariant; defensive: `commission_rate_value_stamp` is one number, cents value is one number, doesn't matter which path the resolver took. |
| Race: Path A wins, Path B fires later | Path B reads booking (now `confirmed`), short-circuits via the existing "already confirmed" guard. If somehow it does run, `creditAffiliateConversion` hits 23505 unique-violation on the conversion row → returns null → no double-credit. |
| Path A fires but `creditAffiliateConversion` throws (e.g., webhook retry) | Existing try/catch swallows. Path B retries with the SAME stored cents → conversion eventually inserted. |
| Webhook revenue-ledger entry: booking has NULL column | Falls back to `getAffiliateCommissionTotalForOrderRef` (sum of conversion row's commission_amount_cents). For pre-deploy bookings this matches the now-credited conversion. |

## Acceptance for this task

- [ ] `CreditConversionInput.stampedCommissionCents` exists, typed
      `number | null`
- [ ] `creditAffiliateConversion` prefers `stampedCommissionCents`
      verbatim when non-null and non-negative
- [ ] All four call sites pass `stampedCommissionCents`:
  - `src/app/api/stripe/webhooks/route.ts:1934`
  - `src/app/api/stripe/confirm-payment/route.ts:131`
  - `src/app/api/stripe/sync-booking/route.ts:71` (free branch)
  - `src/app/api/stripe/sync-booking/route.ts:139` (paid branch)
- [ ] Webhook revenue-ledger entry reads from booking row first,
      falls back to `getAffiliateCommissionTotalForOrderRef`
- [ ] Booking SELECTs across all four files include
      `affiliate_commission_amount_cents` in the column list
- [ ] Type-check clean for the four files
- [ ] No regression in `npm run test:affiliate-commission` (existing
      tests pass `stampedCommissionCents: null` implicitly via the
      function-input default — verify nothing breaks)

## Verification commands (post-deploy)

After running an affiliate-attributed booking through the wizard
end-to-end:

```sql
SELECT
  b.id AS booking_id,
  b.affiliate_commission_amount_cents AS carved_out_at_creation,
  c.commission_amount_cents AS credited_at_webhook,
  rl.affiliate_commission_cents AS recorded_in_ledger
FROM bookings b
LEFT JOIN campaign_conversions c
  ON c.booking_id = b.id
  AND c.reversed_at IS NULL
LEFT JOIN revenue_ledger_entries rl
  ON rl.source_reference = 'booking:' || b.id::text
  AND rl.source_type = 'booking'
WHERE b.id = '<your test booking id>';
```

**All three columns must be equal cents** (e.g. all 3500 for a 20% on
$175 booking). If they differ:
- carved_out vs credited differ → Edit 2 not wired correctly
- credited vs ledger differ → Edit 6 not wired correctly
- carved_out missing (NULL) → Task 02 didn't persist; re-check
  Edit 5 of Task 02

## Out of scope for this task

- Backfilling pre-deploy bookings with computed cents
- Tests (Task 04)
- Spec sync (Task 04)
- Phase 2 affiliate Stripe transfer logic
