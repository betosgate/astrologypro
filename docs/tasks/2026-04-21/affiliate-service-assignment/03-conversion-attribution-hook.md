# Task 03 — Conversion Attribution Hook

- Status: Not Started
- Priority: P0
- Depends On: Tasks 01, 02
- Blocks: Task 05 (earnings UI relies on this data)

## Goal

When a booking transitions to paid, run a deterministic lookup that credits the correct affiliate with the correct commission based purely on `bookings.ref_code`. The outcome is a row in `campaign_conversions` with the frozen commission amount — nothing more, nothing less.

## Current State

- Payments flow through Stripe Connect; the webhook handler is `src/app/api/stripe/webhooks/route.ts`.
- Bookings are confirmed in that handler at the `checkout.session.completed` / charge-completed branch, via an `UPDATE bookings SET status='confirmed'` around line 473.
- The checkout session creator at `src/app/api/stripe/booking-payment/route.ts` is where `ref_code` should be attached to the session metadata (per Task 02).
- No existing affiliate commission hook — `campaign_conversions` is either empty or populated via legacy paths.

## Implementation Steps

### 1. New helper — `creditAffiliateConversion`

File: `src/lib/affiliate-attribution.ts` (extending the module from Task 02).

```ts
export async function creditAffiliateConversion(
  admin: SupabaseClient,
  params: {
    bookingId: string;
    divinerId: string;
    templateId: string | null;  // null for profile-level bookings (edge case)
    orderAmountCents: number;
    refCode: string | null;
  }
): Promise<{ conversionId: string; commissionCents: number } | null> {
  if (!params.refCode) return null;

  // 1. Resolve the campaign by ref code
  const campaign = await resolveAffiliateFromRef(admin, params.refCode);
  if (!campaign) return null;  // not affiliate-owned, or not active, or not found

  // 2. Verify the campaign's destination matches the booking.
  //    SERVICE campaign only credits when the booked service matches.
  //    PROFILE campaign credits any service from the same diviner.
  const matchesService =
    campaign.destination_type === 'SERVICE' &&
    campaign.destination_service_template_id === params.templateId;
  const matchesProfile =
    campaign.destination_type === 'PROFILE' &&
    campaign.diviner_id === params.divinerId;
  if (!matchesService && !matchesProfile) return null;

  // 3. Verify the underlying assignment is still active.
  const { data: assignment } = await admin
    .from('diviner_service_affiliates')
    .select('id, commission_type, commission_value, is_active')
    .eq('id', campaign.source_assignment_id)
    .maybeSingle();
  if (!assignment || !assignment.is_active) return null;

  // 4. Compute commission.
  const commissionCents =
    assignment.commission_type === 'flat'
      ? Math.round(Number(assignment.commission_value) * 100)
      : Math.round(params.orderAmountCents * Number(assignment.commission_value) / 100);

  // 5. Idempotent insert (unique on booking_id).
  const { data: inserted, error } = await admin
    .from('campaign_conversions')
    .insert({
      campaign_id: campaign.id,
      affiliate_id: campaign.owner_affiliate_id,
      affiliate_type: campaign.owner_affiliate_type,
      booking_id: params.bookingId,
      ref_code_snapshot: params.refCode,
      order_reference: params.bookingId,
      order_amount_cents: params.orderAmountCents,
      commission_amount_cents: commissionCents,
      commission_source: 'campaign_assignment',
    })
    .select('id')
    .single();

  if (error) {
    // Swallow duplicate errors — booking already credited
    if (error.code === '23505') return null;
    throw error;
  }

  return { conversionId: inserted.id, commissionCents };
}
```

### 2. Unique constraint on booking_id

Already created in Task 01's migration (step 5):
```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_campaign_conversions_booking
  ON campaign_conversions (booking_id) WHERE booking_id IS NOT NULL;
```
This makes the insert idempotent — multiple webhook retries can't double-credit.

### 3. Call site

Inside `src/app/api/stripe/webhooks/route.ts`, immediately after the `supabase.from("bookings").update({ status: "confirmed" })` call (currently around line 473), add:

```ts
// Re-fetch the booking to get ref_code + template_id + amount
const { data: bookingWithRef } = await supabase
  .from("bookings")
  .select("id, diviner_id, template_id, total_amount, ref_code")
  .eq("id", bookingId)
  .single();

if (bookingWithRef?.ref_code) {
  try {
    await creditAffiliateConversion(admin, {
      bookingId: bookingWithRef.id,
      divinerId: bookingWithRef.diviner_id,
      templateId: bookingWithRef.template_id ?? null,
      orderAmountCents: bookingWithRef.total_amount ?? 0,
      refCode: bookingWithRef.ref_code,
    });
  } catch (err) {
    // Log and continue — never fail the webhook on commission errors
    console.error('[affiliate_conversion] failed', { bookingId, err });
  }
}
```

Place the call AFTER the paid-status write, inside the same idempotent handler. Do not fail the webhook on commission errors — log and continue so Stripe doesn't retry forever.

Also add the call for any other code path that marks a booking `paid` / `confirmed` (audit `grep -rn "status.*confirmed\|status.*paid" src/app/api/stripe/` and wire the hook into each terminal point).

### 4. Observability

Emit a structured log line per call:
```
{ event: 'affiliate_conversion', bookingId, refCode, matched, commissionCents, affiliateId }
```
So operations can grep "no match" rates and investigate data-loss cases.

## Verification Plan

Reuse the seeded data from Task 02's verification (affiliate A, diviner D, SERVICE Solar Return at 20%, campaign `cmp_TESTCODE`).

1. Book Solar Return through the UI carrying `?ref=cmp_TESTCODE`. Confirm the booking was created:
   ```sql
   SELECT id, total_amount, ref_code FROM bookings WHERE ref_code = 'cmp_TESTCODE' ORDER BY created_at DESC LIMIT 1;
   -- expect: 1 row
   ```

2. Trigger payment success (simulate the Stripe webhook event — in dev, use `stripe trigger checkout.session.completed` or hit the confirm-payment endpoint directly).

3. Assert the conversion was created with the correct commission:
   ```sql
   SELECT affiliate_id, affiliate_type, booking_id, order_amount_cents, commission_amount_cents, commission_source, reversed_at
     FROM campaign_conversions WHERE booking_id = '<new-booking-id>';
   -- expect exactly 1 row: affiliate_id='<A>', commission_amount_cents = order_amount_cents * 0.20 rounded, commission_source='campaign_assignment', reversed_at IS NULL
   ```

4. Idempotency — re-trigger the webhook for the same booking. Confirm:
   ```sql
   SELECT COUNT(*) FROM campaign_conversions WHERE booking_id = '<booking-id>';
   -- expect: 1 (unchanged)
   ```

5. Diviner-owned campaign path — seed `cmp_DIVINER1` with `owner_type='diviner'`. Book Solar Return with `?ref=cmp_DIVINER1`:
   ```sql
   SELECT COUNT(*) FROM campaign_conversions WHERE booking_id = '<booking-id-2>';
   -- expect: 0 (hook returns null because campaign is not affiliate-owned)
   ```

6. Destination mismatch — with the SERVICE-scoped `cmp_TESTCODE` for Solar Return, book a DIFFERENT service (Jupiter Return) with `?ref=cmp_TESTCODE`:
   ```sql
   SELECT COUNT(*) FROM campaign_conversions WHERE booking_id = '<booking-id-3>';
   -- expect: 0 (hook returns null because destination doesn't match)
   ```

7. Revoked assignment — set the assignment's `is_active=false`, then book with `?ref=cmp_TESTCODE`:
   ```sql
   UPDATE diviner_service_affiliates SET is_active = false WHERE id = '<assignment-id>';
   -- simulate booking + webhook
   SELECT COUNT(*) FROM campaign_conversions WHERE booking_id = '<booking-id-4>';
   -- expect: 0 (hook returns null because source assignment is inactive)
   ```

8. PROFILE-scope campaign converts on ANY service — create a PROFILE assignment + PROFILE campaign, book Nativity Birth Chart with the PROFILE campaign's ref:
   ```sql
   SELECT commission_source, order_amount_cents, commission_amount_cents FROM campaign_conversions WHERE booking_id = '<booking-id-5>';
   -- expect: 1 row, commission calculated against PROFILE assignment's rate
   ```

## Edge Cases

- Booking without a `template_id` (rare, manual bookings) — SERVICE-scoped campaigns don't match. PROFILE-scoped campaigns still credit.
- Refunds — out of scope for this sprint. Flag via `commission_source='manual_override'` if later needed.
- Order amount = 0 (free session) — commission computes to 0; row still inserted for tracking completeness.
- Campaign was active at click time but paused at booking time — conversion still credits (the "click attribution wins" rule); alternatively check `status='active'` at booking time if stricter is desired. **Decision: credit if `source_assignment_id` is still active, regardless of campaign status.**

## Rollback Plan

- Remove the call site from the Stripe webhook.
- Delete the `creditAffiliateConversion` import.
- Data written to `campaign_conversions` stays; `commission_source='campaign_assignment'` rows can be SELECT'd and deleted/archived if needed.
