# Task 02 — Stamp Logic + Conversion Credit

- Status: Code complete 2026-04-30 (commit `87b4db7d`, no `deploy:` keyword — checkpoint only). Six files: `affiliate-stamp.ts`, `affiliate-attribution.ts`, `booking-payment/route.ts`, `webhooks/route.ts`, `analytics/track/route.ts`, `types/affiliate-assignment.ts`. Awaiting Task 04+ + final deploy.
- Priority: P0
- Depends on: 01
- Blocks: 03, 04, 05, 08
- Spec: §3.8, §5 Flow E (booking stamp), §5 Flow F (webhook credit), §10 Phase 1.5

## Goal

Extend the two library functions that own commission attribution so the
general-program path is a peer to the per-diviner path. After this
task, a booking that arrives with `?ref=<general_campaign_code>` gets
stamped correctly and the webhook writes a `campaign_conversions` row
attributed to the affiliate's account.

## Code changes

### A. `src/lib/affiliate-stamp.ts::resolveStampForBooking`

Add a third branch after campaign lookup. Pseudo-code:

```ts
const campaign = await fetchCampaign(refCode);
if (!campaign) return { reason: 'no_campaign', ... };
if (campaign.status !== 'active') return { reason: 'campaign_inactive', ... };

if (campaign.owner_affiliate_type === 'general') {
  // General-program path. The campaign row already carries the
  // affiliate's account id directly — no junction lookup needed.
  const accountId = campaign.owner_affiliate_account_id;
  if (!accountId) {
    // Defensive — the CHECK constraint guarantees this is non-null
    // when owner_affiliate_type='general'. If it's NULL, the row is
    // corrupt; treat as no_campaign.
    return { reason: 'no_campaign', ... };
  }

  const template = await fetchServiceTemplate(campaign.destination_service_template_id);
  if (!template) return { reason: 'no_campaign', ... };
  if (!template.affiliate_program_enabled) {
    return { reason: 'program_disabled', ... };
  }
  const account = await fetchAffiliateAccount(accountId);
  if (account?.status !== 'active') {
    return { reason: 'account_not_active', ... };
  }
  // Default 10% if commission_value is NULL but program is enabled.
  const rateType = template.commission_type ?? 'percentage';
  const rateValue = template.commission_value ?? 10;
  return {
    reason: 'stamped',
    source_assignment_id: null,
    source_template_id: template.id,
    rate_type_stamp: rateType,
    rate_value_stamp: rateValue,
    affiliate_account_id: account.id,
  };
}

// Existing per-diviner branch unchanged from here.
```

The returned shape gains two fields:
- `source_template_id: string | null` (peer to `source_assignment_id`)
- `affiliate_account_id: string | null` (always populated for general;
  optionally populated for per-diviner — useful for the webhook hand-off)

### B. Booking creation (caller of `resolveStampForBooking`)

**Confirmed file:** `src/app/api/stripe/booking-payment/route.ts` —
the only caller of `resolveStampForBooking` per pre-flight grep
(2026-04-28). If a second caller emerges (e.g. a manual-booking admin
flow), it must spread the same fields.

The booking insert now spreads up to three stamp columns:

```ts
const stamp = await resolveStampForBooking(...);
if (stamp.reason === 'stamped') {
  insertPayload.commission_source_assignment_id = stamp.source_assignment_id;
  insertPayload.commission_source_template_id   = stamp.source_template_id;
  insertPayload.commission_rate_type_stamp      = stamp.rate_type_stamp;
  insertPayload.commission_rate_value_stamp     = stamp.rate_value_stamp;
}
```

Both source columns are mutually exclusive in practice (one set, the
other NULL), but the schema doesn't enforce that — the CHECK is on
`affiliate_campaigns` only. Defensively, the credit code in (D) below
treats `commission_source_template_id` as the discriminator AFTER it
has confirmed `commission_source_assignment_id IS NULL`.

### C. `src/lib/affiliate-attribution.ts::creditAffiliateConversion`

The webhook handoff pulls all three stamp columns from the booking row.
Add the general-path branch:

```ts
const booking = await fetchBookingWithStamps(bookingId);

// Existing per-diviner: stamped via assignment
if (booking.commission_source_assignment_id) {
  // unchanged...
}

// New: stamped via general template
else if (booking.commission_source_template_id) {
  const template = await fetchServiceTemplate(booking.commission_source_template_id);
  // No re-check of template.affiliate_program_enabled — admin can disable
  // for FUTURE bookings; in-flight bookings keep their stamp (rate-stamping
  // invariant from §3.8).

  const account = await fetchAffiliateAccountById(/* resolve from campaign or refcode */);
  if (account?.status !== 'active') {
    log('account_not_active_at_credit', { booking_id: bookingId });
    return null;  // fraud gate
  }

  const commissionCents = computeCommissionCents(
    booking.order_amount_cents,
    booking.commission_rate_type_stamp,
    booking.commission_rate_value_stamp,
  );

  // Idempotency: campaign_conversions.booking_id is UNIQUE per Phase 1
  // schema (Task 04 migration in v2 sprint). A duplicate webhook fire
  // hits the unique constraint and the insert errors with code 23505;
  // wrap in try/catch and treat the dup as a no-op (don't re-fire
  // notifications either).
  await admin.from('campaign_conversions').insert({
    booking_id: bookingId,
    campaign_id: /* from refcode lookup */,
    affiliate_id: null,                // no junction
    affiliate_type: 'general',
    affiliate_account_id: account.id,  // direct attribution
    order_amount_cents: booking.order_amount_cents,
    commission_amount_cents: commissionCents,
    rate_type_used: booking.commission_rate_type_stamp,
    rate_value_used: booking.commission_rate_value_stamp,
  });

  // Notify per spec §7. Pre-flight (2026-04-28) confirmed the existing
  // affiliate.conversion copy in src/lib/affiliate-attribution.ts:327
  // ("Commission earned: $X" / "A referred customer's payment just
  // confirmed...") is generic and applies cleanly to general credits
  // too — NO copy change needed. Reuse the same notifyAffiliate call
  // shape as the per-diviner branch, with the differences:
  //   userId             = account.user_id (resolved from
  //                        affiliate_accounts directly, not via junction)
  //   affiliateAccountId = account.id
  //   actionUrl          = '/affiliate/earnings' (unchanged)
  //   kind               = 'affiliate.conversion' (unchanged — same digest)
  await notifyAffiliate({
    admin,
    userId: account.user_id,
    affiliateAccountId: account.id,
    toEmail: account.email,
    kind: 'affiliate.conversion',
    title: `Commission earned: $${(commissionCents / 100).toFixed(2)}`,
    body: `A referred customer's payment just confirmed. You earned $${(commissionCents / 100).toFixed(2)} on this conversion. Review your earnings in the affiliate portal.`,
    actionUrl: '/affiliate/earnings',
  });
}
```

### D. `creditAffiliateConversion` — always set `affiliate_account_id`

Even on the per-diviner branch, populate `affiliate_account_id` by
resolving `diviner_affiliates.affiliate_account_id`. This makes the
account-level rollups in `/admin/reports/affiliates/by-affiliate` skip
the junction join.

## Acceptance

- [ ] `resolveStampForBooking` returns `reason='stamped'` with
      `source_template_id` set when called for a general-program campaign.
- [ ] Returns `reason='program_disabled'` when the template has
      `affiliate_program_enabled=false`.
- [ ] Returns `reason='account_not_active'` when the affiliate account
      is blocked.
- [ ] Default 10% rate is applied when `commission_value IS NULL` AND
      `affiliate_program_enabled=true`.
- [ ] `creditAffiliateConversion` writes a `campaign_conversions` row
      with `affiliate_type='general'`, `affiliate_account_id` set, and
      `affiliate_id=NULL` for general credits.
- [ ] Per-diviner credit rows now have `affiliate_account_id` populated
      too (regression test on existing flow).
- [ ] Rate-stamping invariant: editing
      `service_templates.commission_value` after a booking is stamped
      does NOT change that booking's eventual conversion amount.
- [ ] Fraud gate: blocking an account between booking and webhook
      blocks the conversion.

## Suggested files

- `src/lib/affiliate-stamp.ts` (extended)
- `src/lib/affiliate-attribution.ts` (extended)
- `src/app/api/stripe/booking-payment/route.ts` (booking insert spreads
  the new stamp column)
- `src/app/api/stripe/webhooks/route.ts` (or wherever conversion credit
  is called from — pull all three stamp columns)
