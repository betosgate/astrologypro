# Task 04 — Booking Rate Stamping + Webhook Credit

- Status: Not Started
- Priority: P0
- Depends on: 01 (additive — adds the stamp columns on `bookings`), 02 (webhook rewire)
- Blocks: 01b (destructive)
- Spec: v1.2 (§3.8, §5 Flow E, §5 Flow F)

## Goal

Commission rate lives on the **booking**, not on the campaign and not
looked up live at webhook time. The booking carries a snapshot of the
assignment's rate at the moment the customer created the booking. When
payment confirms, the webhook uses that snapshot — except for one live
re-check of `affiliate_accounts.status` (fraud enforcement).

This task has two halves: the stamp on booking creation (Part A), and
the credit on webhook (Part B). Both must land together so the model
is consistent.

## Part A — Stamp rate at booking creation

### Where

Booking creation is currently in the `/api/bookings/**` routes (check
the exact POST endpoint). There may be more than one creation path
(direct booking, checkout-session-driven). Both need the stamp.

### New helper

File: `src/lib/affiliate-stamp.ts` (new)

```ts
export interface StampResult {
  source_assignment_id: string | null;
  rate_type_stamp: 'percent' | 'flat' | null;
  rate_value_stamp: number | null;
  reason: 'stamped' | 'no_ref' | 'no_campaign' | 'campaign_inactive'
    | 'assignment_inactive' | 'destination_mismatch'
    | 'account_not_active';
}

export async function resolveStampForBooking(
  admin: SupabaseClient,
  input: {
    refCode: string | null | undefined;
    divinerId: string;
    serviceTemplateId: string | null;
  },
): Promise<StampResult>;
```

Runs all five conditions from spec §3.8 (step 1-5). Returns either a
valid stamp or a NULL stamp + reason for logging.

### Booking creation flow

In every booking creation route:
1. After the booking row is built but before insert, call
   `resolveStampForBooking`.
2. Set `commission_source_assignment_id`, `commission_rate_type_stamp`,
   `commission_rate_value_stamp` on the row from the result.
3. Log `{ bookingId, ref_code, stamp_result.reason }` for observability.
   When `reason !== 'stamped'` and `ref_code` was present, that's a
   funnel leak worth tracking.

### Edge cases

- Multiple booking creation paths: stamp in ALL of them. A booking
  without a stamp can never earn commission, even if the ref_code was
  present. Missing the stamp at creation = permanently no commission
  for that booking (no retroactive stamping).
- Service booking vs subscription booking: both get stamped if
  destination matches. The webhook in task 02 / existing code handles
  both paths; stamping is service-agnostic.

## Part B — Webhook credit from stamp

### File

`src/lib/affiliate-attribution.ts` — rewrite `creditAffiliateConversion`.

### New signature

Consumer passes in the booking row (already loaded by the webhook):

```ts
export async function creditAffiliateConversion(
  admin: SupabaseClient,
  params: {
    bookingId: string;
    orderAmountCents: number;
    stampedAssignmentId: string | null;
    stampedRateType: 'percent' | 'flat' | null;
    stampedRateValue: number | null;
  },
): Promise<{ conversionId: string } | { reason: string } | null>;
```

### Handler steps (match spec §5 Flow F)

1. If `stampedAssignmentId` is NULL → return `{ reason: 'no_stamp' }`.
   No conversion row.
2. Load the assignment row. Get `affiliate_id`, `diviner_id`. Then resolve
   the affiliate account via `diviner_affiliates → affiliate_account_id →
   affiliate_accounts`. Read `affiliate_accounts.status`.
3. **If `affiliate_accounts.status !== 'active'`** →
   return `{ reason: 'account_not_active_at_credit' }`. No conversion
   row. This is the fraud-enforcement check — the only re-read of state
   at webhook time.
4. Resolve the campaign from the booking's `ref_code` (still need
   campaign_id for the conversion row; the booking's stamp doesn't carry it).
5. Compute `commission_amount_cents = computeCommissionCents(orderAmountCents, stampedRateType, stampedRateValue)`.
6. INSERT into `campaign_conversions`:
   - `affiliate_id` = assignment's junction id
   - `campaign_id` = resolved from ref_code
   - `booking_id` = params.bookingId
   - `order_amount_cents` = params.orderAmountCents
   - `commission_amount_cents` = computed
   - `rate_type_used` = stampedRateType  (audit)
   - `rate_value_used` = stampedRateValue (audit)
   - UNIQUE(booking_id) guards retries.
7. Fire `affiliate.conversion` notification (task 05 hooks this).

### Simplified `resolveAffiliateFromRef`

Can be removed or simplified — the webhook no longer reads snapshot
fields from the campaign since they're dropped. Only used to resolve
`campaign_id` from `ref_code`, which is a simpler lookup. If you keep
the helper, drop all the snapshot-related SELECTs.

### Webhook call site

In `src/app/api/stripe/webhooks/route.ts:~1951`, change the call to
pass the stamp fields from the already-loaded booking row:

```ts
await creditAffiliateConversion(supabase, {
  bookingId: bookingForAttribution.id,
  orderAmountCents: Math.round(amountCents),
  stampedAssignmentId: bookingForAttribution.commission_source_assignment_id,
  stampedRateType: bookingForAttribution.commission_rate_type_stamp,
  stampedRateValue: bookingForAttribution.commission_rate_value_stamp,
});
```

Extend the booking SELECT at line ~1942 to include the three stamp
columns.

## Acceptance

- A booking stamped at 15% produces a conversion row with
  `commission_amount_cents = orderAmount * 0.15`, `rate_value_used = 15`.
- A booking stamped at 15%, then the diviner edits rate to 10% before
  webhook fires → conversion still credits at 15%. (Integration test
  in task 08.)
- A booking stamped at 15%, then the affiliate gets blocked before
  webhook fires → conversion NOT credited, logged as
  `account_not_active_at_credit`.
- A booking without `ref_code` → stamp fields NULL → no conversion row.
- A booking with `ref_code` but destination mismatch at creation →
  stamp fields NULL → no conversion row, even if the customer books
  the "right" service later.
- `git grep computeCommissionCents` still returns callers (the helper
  stays); but `git grep commission_value_snapshot`
  `commission_type_snapshot` returns zero in `src/`.

## Suggested files

- `src/lib/affiliate-stamp.ts` (new)
- Booking creation route(s) (extend — find via `grep -rn "\"bookings\"" src/app/api/bookings`)
- `src/lib/affiliate-attribution.ts` (rewrite `creditAffiliateConversion`)
- `src/app/api/stripe/webhooks/route.ts` (update call site + booking SELECT)
- Spec: update §5 Flow E / Flow F step numbers if handler diverges;
  Changelog entry "Stamping implemented"
