# Task 04 — Tests + Sign-off + Spec Sync

- Status: Not Started
- Priority: P1
- Depends on: 01, 02, 03
- Blocks: sprint complete

## Goal

Lock in the carve-out behavior with library + integration tests,
document the behavior in the spec, and walk it once on a deployed
environment.

## Part A — Smoke test extension

**File:** `tests/integration/affiliate-phase-1-5-general-smoke.test.ts`
(extend existing — keep file under ~600 lines).

OR new file `tests/integration/affiliate-carve-out-smoke.test.ts` if
the existing file gets too long.

Use the same fixture style as the file you're extending:
- Service-role client only inside `setup()` / `teardown(t)`
- Per-call `phase15-` namespace via
  `Date.now() + Math.random().toString(36).slice(2, 8)`
- Email pattern matches the cleanup script's `EMAIL_PATTERNS`
  (already includes `phase15-%`)
- FK-safe deletion order in teardown

### A1. Schema sanity

```ts
test("Carve-out schema: bookings.affiliate_commission_amount_cents exists", async () => {
  const { error } = await sr
    .from("bookings")
    .select("affiliate_commission_amount_cents")
    .limit(0);
  assert.equal(
    error,
    null,
    `bookings.affiliate_commission_amount_cents missing — run migration 20260505000002`,
  );
});
```

### A2. `calculateMoneySplit` carve-out math (unit-style, no setup needed)

These can also live in `tests/unit/affiliate-commission-math.test.ts`
since they're pure-function tests. Pick one location.

```ts
test("calculateMoneySplit: 15% platform + 20% affiliate on $175 → $113.75 diviner net", async () => {
  const split = calculateMoneySplit({
    grossAmountCents: 17500,
    platformFeePercent: 15,
    affiliateCommissionCents: 3500,
  });
  assert.equal(split.platformFeeCents, 2625);
  assert.equal(split.divinerGrossAmountCents, 14875);
  assert.equal(split.affiliateCommissionCents, 3500);
  assert.equal(split.divinerNetAmountCents, 11375);
});

test("calculateMoneySplit: zero affiliate → diviner net = diviner gross", async () => {
  const split = calculateMoneySplit({
    grossAmountCents: 17500,
    platformFeePercent: 15,
    affiliateCommissionCents: 0,
  });
  assert.equal(split.divinerNetAmountCents, 14875);
  assert.equal(split.affiliateCommissionCents, 0);
});

test("calculateMoneySplit: commission cap clamps at diviner gross (no negative net)", async () => {
  const split = calculateMoneySplit({
    grossAmountCents: 1000,
    platformFeePercent: 15,
    affiliateCommissionCents: 999_999,
  });
  assert.equal(split.divinerNetAmountCents, 0);
  // Capped at divinerGrossAmountCents
  assert.equal(split.affiliateCommissionCents, split.divinerGrossAmountCents);
});
```

Import:
```ts
import { calculateMoneySplit } from "../../src/lib/money-split";
```

### A3. `creditAffiliateConversion` uses stored cents verbatim

This is the regression test for Task 03's behavior change.

```ts
test("creditAffiliateConversion: prefers stampedCommissionCents over recompute", async () => {
  // Stamp says 20% on $175 (would recompute to 3500), but pass 3499
  // explicitly. The function must use 3499.
  const ctx = await setup();
  try {
    const bookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 20,
    });
    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 17500,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 20,
      stampedCommissionCents: 3499, // intentionally NOT 3500
    });
    assert.notEqual(result, null);
    assert.equal(
      result!.commissionCents,
      3499,
      "credit must use stampedCommissionCents verbatim, not recompute",
    );

    const { data: row } = await sr
      .from("campaign_conversions")
      .select("commission_amount_cents")
      .eq("booking_id", bookingId)
      .single();
    assert.equal(row!.commission_amount_cents, 3499);
  } finally {
    await teardown(ctx);
  }
});
```

### A4. Fallback to recompute when `stampedCommissionCents` is null

```ts
test("creditAffiliateConversion: falls back to recompute when stampedCommissionCents is null", async () => {
  // Pre-2026-05-05 booking compatibility — stored column is NULL.
  const ctx = await setup();
  try {
    const bookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 20,
    });
    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 17500,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 20,
      stampedCommissionCents: null,
    });
    assert.notEqual(result, null);
    assert.equal(
      result!.commissionCents,
      3500,
      "fallback recompute should yield 20% × $175 = $35 = 3500 cents",
    );
  } finally {
    await teardown(ctx);
  }
});
```

### A5. Negative `stampedCommissionCents` falls back

Defensive — if somehow a negative value is passed.

```ts
test("creditAffiliateConversion: negative stampedCommissionCents falls back to recompute", async () => {
  const ctx = await setup();
  try {
    const bookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 20,
    });
    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 17500,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 20,
      stampedCommissionCents: -1, // bogus
    });
    assert.equal(result!.commissionCents, 3500); // recomputed
  } finally {
    await teardown(ctx);
  }
});
```

### A6. Existing tests still pass without `stampedCommissionCents`

Existing v2 smoke + Phase-1.5 smoke tests don't pass
`stampedCommissionCents`. The new field is `number | null` and the
function falls back to recompute when null/missing. **No edits to
existing tests required.** Verify:

```bash
npm run test:affiliate-commission
# Expected: all suites green.
```

If existing tests start failing because the field is missing, that
means TypeScript made the field required (a type error on the call
site). Re-check the interface declaration.

## Part B — Spec sync

Update `docs/specs/affiliate-commission-system.md` in four places.

### B1. §3.8 — booking rate stamp columns

**Current column list (find this — around line 254-260):**
```
commission_source_assignment_id   UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL
commission_source_template_id     UUID REFERENCES service_templates(id) ON DELETE SET NULL  -- Phase 1.5
commission_rate_type_stamp        TEXT    ('percent' | 'flat')
commission_rate_value_stamp       NUMERIC(10,4)
```

**Add one line:**
```
commission_source_assignment_id     UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL
commission_source_template_id       UUID REFERENCES service_templates(id) ON DELETE SET NULL  -- Phase 1.5
commission_rate_type_stamp          TEXT    ('percent' | 'flat')
commission_rate_value_stamp         NUMERIC(10,4)
affiliate_commission_amount_cents   INTEGER ≥ 0  -- 2026-05-05: actual cents carved out from diviner's transfer at PaymentIntent time
```

Plus a short explanatory paragraph (insert immediately under the
column list):

> When `resolveStampForBooking` returns `'stamped'`, the
> booking-payment route also computes
> `affiliate_commission_amount_cents` via
> `computeCommissionCents(grossAmountCents, rate_type_stamp,
> rate_value_stamp)` and persists it on the booking row. This cents
> value funds the carve-out from the diviner's
> `transfer_data.destination` at Stripe PaymentIntent creation —
> `application_fee_amount = platformFeeCents +
> affiliate_commission_amount_cents`. The credit paths (§5 Flow F)
> read the stored value verbatim so the conversion row's
> `commission_amount_cents` matches what the platform actually
> retained. **Funding source: the diviner's portion** (diviner gross
> minus the affiliate cents); the platform retains its true fee plus
> the affiliate's share temporarily on its balance. Phase 2 will
> transfer that share to the affiliate's connected account.

### B2. §5 Flow E — booking creation steps

**Find Flow E's step 3** (currently the stamp-write step) and add
two new steps after it:

```
3a. (2026-05-05 carve-out) When stamped, also compute
    affiliate_commission_amount_cents = computeCommissionCents(
      grossAmountCents, rate_type_stamp, rate_value_stamp). Persist on
    bookings.affiliate_commission_amount_cents. Non-stamped bookings
    leave the column NULL.

3b. PaymentIntent created with:
      amount = grossAmountCents
      application_fee_amount = platformFeeCents + affiliate_commission_amount_cents
      transfer_data.destination = diviner.stripe_account_id
    Diviner's connected account receives gross − platformFee −
    affiliate_commission_amount_cents (i.e. divinerNetAmountCents).
    Platform retains platformFeeCents + affiliate_commission_amount_cents
    on its balance.
```

### B3. §5 Flow F — credit step uses stored cents

Inside Flow F step 5 (the INSERT into `campaign_conversions`),
replace the bullet about commission computation:

**Current:**
```
- `rate_type_used` = `booking.commission_rate_type_stamp`
- `rate_value_used` = `booking.commission_rate_value_stamp`
```

**Add a new bullet just above those:**
```
- `commission_amount_cents` = `booking.affiliate_commission_amount_cents`
  verbatim when non-null (post-2026-05-05); falls back to
  `computeCommissionCents(orderAmountCents, rate_type_stamp, rate_value_stamp)`
  for pre-2026-05-05 bookings whose column is NULL.
- `rate_type_used` = `booking.commission_rate_type_stamp`
- `rate_value_used` = `booking.commission_rate_value_stamp`
```

### B4. §12 changelog entry

Insert at the top of §12 (above the existing 2026-04-30 entries):

```markdown
- **2026-05-05 (Affiliate carve-out at booking creation)** — Closed
  the inconsistency where the Stripe PaymentIntent's
  `application_fee_amount` carried only the platform fee, while the
  revenue ledger and `campaign_conversions` accounted for an
  affiliate share that the diviner had already received. Now: when
  `resolveStampForBooking` returns `'stamped'`, the booking-payment
  route computes commission cents and increases
  `application_fee_amount` by that amount; the diviner's destination
  transfer is reduced by the same value. Persists
  `bookings.affiliate_commission_amount_cents` for cross-path
  consistency. The three credit paths (confirm-payment, webhook,
  sync-booking) and the booking revenue-ledger entry now read this
  stored value verbatim. **Funding model:** affiliate commission is
  paid from the diviner's portion (not the platform's). Sets up
  Phase 2 (Stripe Express + transfers to affiliate connected
  accounts) — the cash now lives on platform balance and is
  transferable. Migration:
  `20260505000002_booking_affiliate_commission_cents`. Sprint plan:
  `docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/`.
  Spec §3.8 + §5 Flow E + §5 Flow F updated.
```

## Part C — Manual E2E sign-off (deployed preview)

For each scenario, verify in three places: SQL booking row, Stripe
Dashboard PaymentIntent metadata, Connected account recent transfers.

### C1. Non-affiliate booking — no regression

1. Visit `/<diviner-username>/services/<some-slug>` directly (no `?ref=`).
2. Book + pay $175 with test card 4242 4242 4242 4242.
3. **Expected:**
   - `bookings.affiliate_commission_amount_cents` is NULL
   - Stripe PaymentIntent metadata: `affiliateCommissionCents = "0"`,
     `splitAffiliateRule = "no_affiliate_share"`,
     `applicationFeeCents = "<platform fee only>"` (e.g. 2625 for 15%)
   - Diviner connected account: receives 14875 cents = $148.75

### C2. Per-diviner affiliate carve-out — full carve-out

1. Have a diviner-affiliate campaign at 20% (`cmp_xxx` with
   `owner_affiliate_type='diviner_affiliate'`).
2. Visit `/r/cmp_xxx` → 307 to diviner profile or service.
3. Book + pay $175.
4. **Expected:**
   - `bookings.affiliate_commission_amount_cents = 3500`
   - Stripe metadata: `affiliateCommissionCents = "3500"`,
     `applicationFeeCents = "6125"`,
     `splitAffiliateRule = "stamped_affiliate_share"`
   - Diviner connected account receives 11375 cents = $113.75
   - Cross-table SQL:
     ```sql
     SELECT b.affiliate_commission_amount_cents AS carved_out,
            c.commission_amount_cents AS credited,
            rl.affiliate_commission_cents AS in_ledger
     FROM bookings b
     LEFT JOIN campaign_conversions c
       ON c.booking_id = b.id AND c.reversed_at IS NULL
     LEFT JOIN revenue_ledger_entries rl
       ON rl.source_reference = 'booking:' || b.id::text
       AND rl.source_type = 'booking'
     WHERE b.ref_code = 'cmp_xxx'
     ORDER BY b.created_at DESC LIMIT 1;
     ```
     All three columns equal **3500**.

### C3. General-product affiliate booking

Same as C2 but using a general campaign (`/r/cmp_general_xxx` →
`/services/<general-slug>`). Verify the same cents equality + diviner
transfer reduction.

### C4. Refund of affiliate booking

1. Pick the C2 test booking. Refund via admin/diviner UI.
2. **Expected:**
   - Stripe Refund: $175 returned to customer
   - Refund detail shows `application_fee_refunded = 6125`
     (Stripe handles the proportional `application_fee` refund
     because the original PaymentIntent had `application_fee_amount`
     set; refund pulls from BOTH the platform's balance share and
     the diviner's destination transfer)
   - Conversion row: `reversed_at` set via existing reversal flow
   - Net economics: customer +$175, platform $0, diviner $0,
     affiliate $0 — everything reversed.

### C5. Free booking (no PaymentIntent)

1. Use an unscoped availability slot (`freeSlot=true`, finalPrice=0).
2. Confirm booking — no Stripe payment.
3. **Expected:**
   - `bookings.affiliate_commission_amount_cents = 0` if stamped,
     else NULL (depends on whether stamping fires for free bookings —
     the resolver only stamps when refCode + active campaign + active
     account; free bookings can be stamped if a refCode is present)
   - No PaymentIntent in Stripe Dashboard
   - No `application_fee_amount` to verify

## Sign-off checklist

- [ ] Migration applied on dev Supabase, idempotent on re-run
- [ ] `npm run test:affiliate-commission` returns 0 failures
- [ ] Non-affiliate booking C1 walked top-to-bottom
- [ ] Per-diviner affiliate booking C2 walked top-to-bottom (all 3
      cents columns = expected value)
- [ ] General affiliate booking C3 walked top-to-bottom
- [ ] Refund flow C4 walked top-to-bottom
- [ ] Free booking C5 walked top-to-bottom
- [ ] Spec §3.8 updated (column list + carve-out paragraph)
- [ ] Spec §5 Flow E updated (steps 3a, 3b)
- [ ] Spec §5 Flow F updated (commission_amount_cents bullet)
- [ ] Spec §12 changelog entry recorded with the actual walkthrough
      date
- [ ] Memory file
      `~/.claude/projects/.../memory/project_booking_commission_pipeline.md`
      updated to note: the new column, the carve-out at booking-
      creation time, the three-path stored-cents read pattern, the
      diviner-funded model, and the Phase 2 dependency
- [ ] Memory file MEMORY.md index entry updated if any descriptions
      changed

## Acceptance

- All Part A test cases pass against a freshly migrated dev DB
- Spec changes reviewed against a real test booking's behavior
  (cross-table SQL above)
- Manual E2E walked at least once on preview
- No regression in `npm run test:affiliate-commission` after the
  changes land
- All four files in this sprint plan have committed `Status:` lines
  reflecting ship state

## After this sprint

The platform now actually holds affiliate cash on its balance
(retained via the larger `application_fee_amount`). **Phase 2** (a
separate sprint) will:
- Add `affiliate_accounts.stripe_account_id` + `payouts_enabled`
  columns
- Add `POST /api/affiliate/stripe-onboard` (Stripe Express)
- Add `account.updated` webhook handler to flip `payouts_enabled`
- Add `payAffiliateConversion(conversionId)` — calls
  `stripe.transfers.create` with `idempotency_key = conversion.id`,
  amount = `campaign_conversions.commission_amount_cents`, destination =
  affiliate's connected account, source from platform balance
- Add a cron retry for transfers that failed (account not yet
  payouts-enabled, etc.)
- Add reversal: when `reversed_at` is set on a conversion, also
  `stripe.transfers.createReversal(stripe_transfer_id)` to claw
  back the affiliate's funds
- Add UI: `/affiliate/payouts` page with status column, onboarding
  banner on dashboard, status badge on `/affiliate/earnings` rows
- Add admin payouts report breaking by status

The carve-out work this sprint completes is the prerequisite. The
funds are sitting on platform balance, ready for Phase 2 to settle.
