# Master — Affiliate Commission Carve-Out at Booking Creation (2026-05-05)

- Status: Planned
- Priority: P0
- Sprint window: 1 day focused work
- Spec: `docs/specs/affiliate-commission-system.md` §3.8, §5 Flow E, §5 Flow F
- Migration ordinal reserved: `20260505000002_*` (ordinal `000001` is taken
  by `20260505000001_affiliate_campaigns_channel_marketing_kit.sql`,
  verified by `ls supabase/migrations/20260505*` on 2026-05-05).
  **Re-run that `ls` before starting in case more land today.**

## TL;DR

The booking-payment Stripe `PaymentIntent` currently sends the **full
diviner gross** (gross − platform fee) to the diviner's connected
account, regardless of any affiliate commission owed. The
`campaign_conversions` row that records the commission is just a DB
obligation — the money has already left for the diviner. This sprint
fixes the funding model so the diviner's actual Stripe transfer is
**reduced by the affiliate's stamped commission** at PaymentIntent
creation, and the platform retains the affiliate's share until it can
be transferred (Phase 2 work).

## Why this exists — confirmed via 2026-05-05 audit

`src/lib/money-split.ts::calculateMoneySplit` already accepts an
`affiliateCommissionCents` parameter and returns
`divinerNetAmountCents = divinerGrossAmountCents − affiliateCommissionCents`.
The plumbing is in place. **The booking-payment route caller does NOT
pass it.**

Anchor verification (run before starting):

```bash
grep -n "calculateMoneySplit" src/app/api/stripe/booking-payment/route.ts
# Expected (current): line 545 imports, line 545 call (no affiliateCommissionCents arg)
```

Compare to the webhook side which DOES pass it:

```bash
grep -n "affiliateCommissionCents" src/app/api/stripe/webhooks/route.ts
# Expected: lines 1389, 1395, 1397, 1409 (subscription path),
#           2049, 2059, 2077 (booking ledger path)
```

So the webhook records a ledger entry that says "diviner net is reduced
by the affiliate's share" — but the actual Stripe transfer at
PaymentIntent time DID NOT reduce. The audit trail and the money flow
are inconsistent. This task closes that gap.

Result for a $175 booking with 15% platform fee + 20% affiliate rate:

| Party | Current code | After this task |
|---|---|---|
| Customer | −$175 | −$175 |
| Platform `application_fee_amount` | $26.25 (cents: 2625) | $61.25 (cents: 6125 = 2625 platform + 3500 affiliate) |
| Diviner `transfer_data.destination` | **$148.75 (cents: 14875)** | **$113.75 (cents: 11375)** |
| Affiliate (DB obligation) | $35 owed; money already with diviner | $35 owed; money on platform balance |

Net always sums to $175. Today's state has the diviner already holding
the affiliate's $35 — clawback would be required to make the affiliate
whole. After this task the cash sits on platform balance, ready for
Phase 2 to settle.

## Locked design decisions

1. **Funding source:** affiliate commission is paid **from the
   diviner's portion**, not the platform's. Diviner net is reduced
   by the stamped commission cents. Platform retains its true fee
   plus (temporarily) the affiliate's share via a larger
   `application_fee_amount`.

2. **Rate base — unchanged from current behavior:** commission cents
   are computed via `computeCommissionCents(grossAmountCents,
   stampedRateType, stampedRateValue)`. For a percent rate, this is
   percent-of-gross (the customer's full payment), not
   percent-of-diviner-net or percent-of-diviner-gross. This task
   does NOT change the math; it only wires the result into the
   PaymentIntent. Document the rate base in the spec to lock it.

3. **Stamp source:** the carve-out only happens when
   `resolveStampForBooking` returns `reason === "stamped"`. Any other
   reason → `affiliateCommissionCents = 0` → `application_fee_amount`
   stays at platform fee → diviner gets full gross. **Zero regression
   for non-affiliate bookings.**

4. **Storage:** the computed cents value is persisted on the
   `bookings` row at creation time as
   `affiliate_commission_amount_cents` (new nullable column). Two
   reasons:
   - The webhook + the confirm-payment frontend fallback + the
     manual sync-booking endpoint all need to compute the SAME cents
     when crediting. Storing avoids three different recomputations
     potentially producing off-by-one rounding mismatches against
     the value already carved out at PaymentIntent time.
   - Audit: the revenue ledger entry can read the same source of
     truth as the PaymentIntent.

5. **Idempotency / replays:** if a booking is created and the
   PaymentIntent fails (card declined, etc.), the booking row keeps
   its stamp and stored commission cents. A retry creates a fresh
   PaymentIntent using those stored values. **Out of scope:** retry
   UX is not part of this task — current behavior (customer must
   start a new booking) is preserved.

6. **Free bookings (`freeSlot=true`, `finalPrice=0`):** no
   PaymentIntent is created. The booking insert is reached via the
   `if (shouldCharge)` branch. Set
   `affiliate_commission_amount_cents = 0` on the booking row when
   stamped (the stamp has rate = 0 effective on a $0 base —
   `computeCommissionCents` short-circuits on `orderAmountCents <= 0`
   already). No money movement; no Phase 2 transfer for free bookings.

7. **Subscription bookings:** out of scope. Per spec §1, subscription
   commissions are not in v2/v1.5. The booking PaymentIntent path is
   the only one this task touches. Subscription split logic at
   `src/app/api/stripe/webhooks/route.ts:1389-1409` already passes
   `affiliateCommissionCents` correctly — leave alone.

8. **Phase 2 affiliate payout (transferring the held cash to the
   affiliate's connected account):** explicitly **out of scope** of
   this sprint. After this lands, the platform holds affiliate
   obligations on its balance. Phase 2 will add Express onboarding +
   `stripe.transfers.create` to settle them. This task is the
   prerequisite — it puts the money where Phase 2 can grab it.

9. **Refund flow — Option A (no `refund_application_fee` flag,
   reverse the conversion row instead).** When a booking is refunded,
   the customer gets the full gross back via Stripe's default
   destination-charge refund mechanic; the diviner is debited their
   net portion (gross − application_fee); the platform retains the
   application_fee it was already holding. We do NOT set
   `refund_application_fee: true` because that would return the
   carved-out share to the diviner, who never received it in the
   first place. Instead, Task 05 adds a `campaign_conversions`
   reversal call to every refund surface so the affiliate's credit
   row is canceled in lock-step with the customer refund. End state:
   customer whole, diviner whole, affiliate credit reversed, platform
   net zero. See `05-refund-flow-correctness.md`.

## Required outcome

- New paid bookings with a valid affiliate stamp produce a PaymentIntent
  whose `application_fee_amount = platformFeeCents + affiliateCommissionCents`.
- Diviner's connected account receives `divinerNetAmountCents` (gross −
  platform fee − affiliate commission).
- `bookings.affiliate_commission_amount_cents` is set on the booking
  row (NULL when not stamped — see decision #6).
- `creditAffiliateConversion` reads the stored cents from the booking
  row to ensure the conversion row's `commission_amount_cents` matches
  exactly what was carved out.
- Revenue ledger entry written by the webhook reads the same source of
  truth.
- Refund flow honors the larger `application_fee_amount` (Stripe
  handles the proportional refund automatically; the reversal flow
  on the conversion row stays unchanged).
- No regression on non-affiliate bookings.

## Task breakdown

| # | Task | Priority | Depends on |
|---|---|---|---|
| 00 | Master task + decisions (this file) | P0 | — |
| 01 | [Schema migration](01-schema-migration.md) — add `bookings.affiliate_commission_amount_cents` | P0 | — |
| 02 | [Booking-payment route changes](02-booking-payment-implementation.md) — compute commission cents, wire into split, increase `application_fee_amount`, persist on booking | P0 | 01 |
| 03 | [Credit + ledger sync](03-credit-and-ledger-sync.md) — read stored cents in all 3 credit paths + revenue ledger | P0 | 01, 02 |
| 05 | [Refund flow correctness](05-refund-flow-correctness.md) — reverse `campaign_conversions` row in every refund surface (Option A) | P0 | 01, 02, 03 |
| 04 | [Tests + sign-off + spec sync](04-tests-and-signoff.md) — test extensions, spec §3.8 / Flows E/F / Flow J refund, §12 changelog, manual E2E (incl. refund round-trip) | P1 | 01, 02, 03, 05 |

## Execution order

01 → (02 + 03 in parallel — different files, no shared types after
Task 03 adds `stampedCommissionCents` to `CreditConversionInput`) → 05
→ 04. Task 05 must land in the SAME deploy as Tasks 02–03; otherwise
the first refund post-deploy of a carved-out booking will leave a
phantom affiliate credit on platform balance for Phase 2 to
mistakenly transfer.

## Acceptance gate

Sprint is done when:
- [ ] Migration applied to dev Supabase, idempotent on re-run, sanity
      check raises descriptive errors if column is missing
- [ ] An affiliate-attributed booking (verifiable: $175 with 20%
      campaign → cents) produces a Stripe PaymentIntent with
      `application_fee_amount=6125` and the diviner's connected
      account receives 11375 cents
- [ ] A non-affiliate booking ($175, 15% platform fee) produces a
      PaymentIntent with `application_fee_amount=2625` (just the
      platform fee — no change from current behavior)
- [ ] `bookings.affiliate_commission_amount_cents` matches the
      `application_fee_amount − platformFeeCents` on every new
      stamped booking
- [ ] `campaign_conversions.commission_amount_cents` matches the
      booking's `affiliate_commission_amount_cents` exactly (verified
      by Task 04 SQL)
- [ ] `revenue_ledger_entries.affiliate_commission_cents` matches
      the booking's stored value (verified by Task 04 SQL)
- [ ] Refund of an affiliate booking works end-to-end:
      - Customer gets full gross back (Stripe-guaranteed)
      - Diviner's connected account is debited only their net portion
        (verifiable via Stripe Dashboard balance transactions)
      - `campaign_conversions.reversed_at` is set within seconds of
        the Stripe refund (Task 05 wiring) — verified across all 3
        refund surfaces: shared pipeline, legacy admin route, no-show
        cron
      - `revenue_ledger_entries.refunded_affiliate_commission_cents`
        equals the stamped commission cents
      - **No `refund_application_fee: true` was added anywhere**
        (Option A — see decision §9)
- [ ] Smoke tests added covering: per-diviner carve-out, general
      carve-out, stored-cents-verbatim, recompute-fallback,
      non-affiliate booking
- [ ] Spec §3.8 + §5 Flow E + §5 Flow F + §12 changelog updated
- [ ] No regression in `npm run test:affiliate-commission`

## Risks

| Risk | Mitigation |
|---|---|
| **Rounding mismatch** between stamp-time cents (carved out) and credit-time cents (stored on conversion row) | Task 03 — `creditAffiliateConversion` reads stored cents from the booking row verbatim instead of recomputing |
| **Stripe rejects `application_fee_amount` ≥ amount** | `calculateMoneySplit` already caps `affiliateCommissionCents ≤ divinerGrossAmountCents` (verified at `src/lib/money-split.ts:38-44`), so platform fee + affiliate ≤ amount |
| **Diviner sees lower payout post-deploy** | Diviners with affiliate referrals SHOULD see lower payouts — that's the point. Communicate to diviners before deploy. |
| **Phase 2 not yet built — affiliate's money is stuck on platform balance** | Acceptable. The platform already has DB rows tracking the obligation. Phase 2 builds on this foundation. |
| **Existing in-flight bookings (already paid, conversions already credited)** | No retroactive change. Old bookings keep their existing transfer pattern. Only new bookings post-deploy use the carve-out. Pre-deploy bookings have `affiliate_commission_amount_cents = NULL` → Task 03 falls back to `computeCommissionCents` recomputation for them. |
| **Subscription path also calls `calculateMoneySplit`** | At `src/app/api/stripe/webhooks/route.ts:1395` it already passes `affiliateCommissionCents` (zero today since subscriptions don't credit). Don't touch — out of scope. |

## Out of scope

- Phase 2: Stripe Express onboarding for affiliates +
  `stripe.transfers.create` to settle held cash
- Subscription / non-booking flows
- Multi-currency (USD only — matches existing diviner Connect setup)
- Multi-affiliate per booking
- Diviner-side notification of new payout amounts
- Admin reports breaking out the new affiliate-share-funded-by-diviner
  metric
- Pre-deploy backfill of `affiliate_commission_amount_cents` on
  historical bookings (not needed — credit fallback handles them)

## Pre-flight verification (run before starting)

These commands prove the audit findings the plan is built on. If any
returns unexpected output, re-audit before implementing.

```bash
# Confirm migration ordinal collision check
ls supabase/migrations/20260505* 2>/dev/null
# Expected: 20260505000001_affiliate_campaigns_channel_marketing_kit.sql
# Use 20260505000002 as your ordinal.

# Confirm calculateMoneySplit caller is missing affiliateCommissionCents
grep -A8 "const bookingSplit = calculateMoneySplit({" \
  src/app/api/stripe/booking-payment/route.ts
# Expected: no `affiliateCommissionCents:` line in the args.

# Confirm the helper accepts the parameter
grep -n "affiliateCommissionCents" src/lib/money-split.ts
# Expected: lines 14, 23, 38, 41, 47, 60+

# Confirm computeCommissionCents is exported
grep -n "export function computeCommissionCents" \
  src/lib/affiliate-attribution.ts
# Expected: line 118

# Verify three credit paths
grep -rn "creditAffiliateConversion(" src/app --include="*.ts" \
  | grep -v "import\|export\|//\|test"
# Expected: 4 hits — webhooks/route.ts:1934, confirm-payment/route.ts:131,
#           sync-booking/route.ts:71 (free), sync-booking/route.ts:139 (paid).
#           If you see more or fewer, surface to the user before proceeding.
```

## Reading order for the implementer

1. This file
2. `IMPLEMENTATION-NOTES.md` of the previous Phase 1.5 sprint (in
   `docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/`) —
   for the deviation pattern + the column-name pitfalls
3. Spec §3.8 (current state) + §5 Flow E (current state) + §5 Flow F
   (the three credit paths)
4. `src/lib/money-split.ts` (look at the existing plumbing — your job is to wire it)
5. `src/app/api/stripe/booking-payment/route.ts` (open to lines 540–770)
6. `src/lib/affiliate-attribution.ts::creditAffiliateConversion`
7. `01-schema-migration.md` and start work.

## Post-deploy ordering note

If you bundle this with other commits, the deploy must precede the
migration application by NO MORE THAN A FEW SECONDS. Same risk window
as the Phase 1.5 deploy: between Tasks 02–03 going live and the
column existing, the booking insert errors with PG 42703
(`affiliate_commission_amount_cents` doesn't exist). The booking
fails outright (the spread is required when stamped) — customer
sees a 500. **Migration before deploy** is safer here than the
reverse, since the column is additive nullable.

Recommended order:
1. Apply Task 01 migration FIRST (column exists; nothing reads it yet)
2. Then deploy Tasks 02–04 (code starts writing + reading)
