# Master — Affiliate Payouts Phase 2 (2026-05-05)

- Status: Planned
- Priority: P0 (queued behind Phase 1.5 carve-out sprint)
- Sprint window: 5–7 days focused work
- Spec: `docs/specs/affiliate-commission-system.md` — adds new §6 "Affiliate Payouts (Phase 2)"
- Hard prerequisite: **Phase 1.5 carve-out sprint must ship first.**
  Phase 2 transfers money the platform only holds because of the
  carve-out's `application_fee_amount` change. Without carve-out, the
  affiliate's share is already in the diviner's connected account and
  there's nothing for Phase 2 to transfer.

## TL;DR

After Phase 1.5 ships, every booking with an affiliate stamp leaves
the carved-out commission cents on platform balance, recorded in
`campaign_conversions`. Phase 2 makes that money actually move:
affiliates connect a Stripe Express account, the platform transfers
their balance 24 hours after the booked session ends, and any refund
that lands after payout is offset against the affiliate's next
earnings (DB-level offset, not Stripe negative balance).

## Locked design decisions (from 2026-05-05 conversation)

1. **Scope:** `diviner_affiliate` identity only.
   `social_advocate` payouts are a separate sprint.

2. **Onboarding:** Stripe **Express** (hosted onboarding, Stripe
   handles 1099-NEC for US affiliates automatically). Same pattern
   the diviners already use — see `src/lib/stripe/connect.ts`.

3. **Gate:** an affiliate must have `affiliate_accounts.stripe_account_id`
   set AND `payouts_enabled = true` in their Stripe account before they
   can create new campaigns or generate new share links. Existing
   active campaigns are **grandfathered** — they keep working, share
   links keep working, conversions keep accruing. New campaign
   creation, new link generation, and payout release require
   connection.

4. **Hold period:** **24 hours after session end** (booking
   `scheduled_at + duration_minutes + 24h`). A `campaign_conversions`
   row becomes "ripe" only after that boundary. Until then, any
   refund just reverses the conversion in place (Phase 1.5 Task 05
   already wires this) — no payout has happened, nothing to claw.

5. **Trigger:** **piggyback on the existing
   `src/app/api/cron/no-show-refunds/route.ts`** cron. After it
   processes no-show refunds for the bookings whose session window
   has closed, a new second pass scans for ripe conversions and
   fires transfers. **No new cron, no new schedule.**

6. **Threshold:** **none** — pay every cent. Stripe transfers
   between platform and connected accounts in the same
   currency/country are free, so there's no per-transfer fee
   incentive to batch.

7. **Country / currency:** US-only, USD-only at launch. Stripe
   Express US handles 1099-NEC reporting. International support is
   a separate sprint.

8. **Refund-after-payout (Path 1 — DB-level offset):** if a
   booking is refunded **after** the affiliate has been paid for
   it, the platform does NOT touch the affiliate's Stripe account.
   Instead, `affiliate_accounts.balance_offset_cents` is incremented
   by the affiliate share. The next payout cycle reduces the gross
   payable by the offset before transferring. If the affiliate
   never earns again, the offset sits dormant; admin can write it
   off after 90 days via the admin UI (Task 07). **Net result: no
   negative Stripe balance ever, no Stripe API call ever clawed
   money from the affiliate.**

9. **Idempotency:** every transfer uses an idempotency key of
   `affiliate-payout-${payout_id}`. Every conversion gets stamped
   `payout_id` once paid; double-firing is impossible.

10. **Audit:** every payout produces a row in `affiliate_payouts`
    + N rows in `affiliate_payout_items` (one per conversion).
    Stripe `transfer.id` and `transfer.created` are stored on the
    `affiliate_payouts` row. `applyOffsetCents` movements are
    logged in `admin_action_log` for the system actor.

## Required outcome

- Every active `diviner_affiliate` has either:
  - `stripe_account_id` set + `payouts_enabled = true`, or
  - a "Connect Stripe" CTA in the dashboard with no new-campaign /
    new-link affordances available.
- Ripe conversions (24h past session end, not reversed) for a
  connected affiliate get transferred via `stripe.transfers.create`
  on the next no-show-refunds cron tick.
- A successful transfer stamps `campaign_conversions.payout_id`,
  `paid_at`, and `paid_amount_cents` on every included row, plus
  inserts the corresponding `affiliate_payouts` + `affiliate_payout_items`
  records.
- A booking refund post-payout increments
  `affiliate_accounts.balance_offset_cents`. The next payout
  computes `payable = ripe_total − balance_offset_cents` and
  transfers only the positive remainder; if `<= 0`, no transfer.
- Affiliate UI shows: connection status, total earned, total paid,
  pending (ripe but offset-reduced), upcoming payout estimate, and
  outstanding offset (with explanation of which refunded booking
  caused it).
- Admin UI shows: per-affiliate balance, offset, payout history,
  manual write-off action.
- No regression in Phase 1.5 carve-out behavior.

## Task breakdown

| # | Task | Priority | Depends on |
|---|---|---|---|
| 00 | Master task + decisions (this file) | P0 | — |
| 01 | [Schema migration](01-schema-migration.md) — Stripe FK on accounts, payout tables, conversion payout columns, balance_offset_cents | P0 | — |
| 02 | [Stripe Express onboarding](02-stripe-express-onboarding.md) — helper + start/return routes + webhook | P0 | 01 |
| 03 | [Campaign creation gate](03-campaign-gate-middleware.md) — block new campaign / share link generation if Stripe not ready | P0 | 01, 02 |
| 04 | [Payout trigger + execution](04-payout-trigger-and-execution.md) — extend no-show-refunds cron, ripeness query, transfer + idempotency | P0 | 01, 02, 05 |
| 05 | [Refund-after-payout offset](05-refund-offset-tracking.md) — increment `balance_offset_cents` when post-payout refund fires; payout subtracts | P0 | 01 |
| 06 | [Affiliate UI](06-affiliate-ui.md) — Connect Stripe CTA, status panel, payout history, offset visibility | P0 | 01, 02, 04 |
| 07 | [Admin UI](07-admin-ui.md) — payouts list at `/admin/reports/affiliate-payouts`, manual write-off, retry controls | P1 | 01, 04 |
| 09 | [Notifications + existing-page integrations + failed-payout alert](09-notifications-and-integrations.md) — wires the 4 new affiliate.* notification kinds + extends existing admin/affiliates reports + adds failed-payout admin widget | P0 | 04, 05, 06 |
| 10 | [Phase 3 instrumentation prep](10-phase-3-instrumentation.md) — adds `first_conversion_at` / `first_payout_at` milestone columns + `affiliate_onboarding_rejections` log table; stamping logic in attribution + payout helpers. Phase 3 analytics depend on this data being collected from day 1 of Phase 2 deploy. | P1 | 01, 02, 04 |
| 08 | [Tests + sign-off + spec sync](08-tests-and-signoff.md) — extend `npm run test:affiliate-commission`, add §6 to spec, manual E2E | P1 | 01–07, 09, 10 |

## Execution order

01 → (02 + 03 + 05 in parallel — different files, no shared types) →
04 → (06 + 07 + 09 in parallel — Task 09's notification helpers can be
written before 04/06/07 are merged; the wiring lands when those files
exist) → 08.

Tasks 02, 03, 05 can ship as a single "infrastructure" PR because none
of them flip user-visible behavior on its own. Task 04 is the
behavior-flipping PR — once it merges, money starts moving on the next
cron tick. **Deploy 04 last, with the kill-switch flag described
below set to OFF**, then flip the flag in `platform_settings` after
verifying the dry-run output looks right.

## Kill-switch

A new column `platform_settings.affiliate_payouts_enabled BOOLEAN
NOT NULL DEFAULT FALSE` (added in Task 01) gates the actual
`stripe.transfers.create` call. While `FALSE`, the cron still
writes a "would-have-paid" entry to `affiliate_payouts` with
`status = 'dry_run'`, but no money moves. This lets you see
exactly what the first real run will do before flipping it on.

After 7 days of clean dry-runs, set the flag to `TRUE` via the
admin UI (Task 07) or directly in the DB. To kill payouts at any
time, flip back to `FALSE` — in-flight transfers continue (Stripe
won't unwind), but no new ones start.

## Acceptance gate

Sprint is done when:

- [ ] All migrations applied to dev Supabase, idempotent on re-run,
      sanity checks raise descriptive errors if any column or table
      is missing
- [ ] An affiliate clicking "Connect Stripe" in the affiliate
      dashboard completes Stripe Express onboarding and returns to
      the dashboard with `stripe_account_id` populated and
      `payouts_enabled = true` reflected in the UI
- [ ] An affiliate without `payouts_enabled = true` cannot create a
      new campaign (API + UI both blocked) and cannot generate a new
      share link
- [ ] An affiliate with existing campaigns sees those campaigns
      remain functional (grandfathering verified — no 403s on legacy
      campaigns or links)
- [ ] A test affiliate booking that completes the 24h hold appears
      in the next no-show-refunds cron output as `dry_run` while
      the kill-switch is OFF
- [ ] Flipping the kill-switch ON and running the cron transfers the
      money to a real test Stripe Express account in test mode
- [ ] `affiliate_payouts.stripe_transfer_id` matches the transfer
      visible in the Stripe Dashboard
- [ ] `campaign_conversions.payout_id` is stamped on every included
      row, with `paid_at` matching the transfer timestamp ±5 seconds
- [ ] Refunding a paid booking via every refund surface (shared
      pipeline, admin route, no-show cron) increments
      `affiliate_accounts.balance_offset_cents` by the affiliate
      share, and the next cron run reduces the payable by the
      offset before transferring
- [ ] `affiliate_payouts.status = 'completed'` for successful runs
      and `status = 'failed'` with `failure_reason` populated for
      transfer failures (e.g., Stripe account in disabled state)
- [ ] Admin UI shows a per-affiliate balance with breakdown into
      pending / paid / offset / ripe-now
- [ ] Spec §6 added; §3.8 + §5 Flow F + §12 changelog updated
- [ ] No regression in `npm run test:affiliate-commission`
- [ ] Phase 1.5 carve-out invariants still hold (Phase 1.5 Task 04
      tests pass without modification)

## Risks

| Risk | Mitigation |
|---|---|
| **First cron run after deploy fires real transfers immediately** before anyone reviews | Kill-switch defaults FALSE (Task 01). Dry-run mode writes the would-have-paid records but skips Stripe. Flip the flag manually after verifying output. |
| **Stripe account in restricted state** (verification incomplete, capability missing) | Task 02 check on `payouts_enabled` + `details_submitted`. If false, transfer is skipped and `affiliate_payouts.status = 'failed'` with reason. Affiliate sees CTA in dashboard. |
| **Affiliate connects a new Stripe account** mid-sprint, leaving the old one with a balance | Old account's stripe_account_id moves to `prior_stripe_account_ids JSONB[]`; ripe conversions go to the *current* account. The audit row records which account each conversion paid to. |
| **Refund fires the second the cron is mid-transfer** (race) | Stripe's `idempotencyKey` is `affiliate-payout-${payout_id}`. Conversions are locked into a `affiliate_payouts` row before the Stripe call. A refund landing during the call can still increment offset; next cycle catches up. |
| **Affiliate disputes a payout amount** | Admin UI (Task 07) shows the line items per `affiliate_payout_items` row. Admin can mark a payout `disputed` and trigger a manual investigation note. Stripe transfer itself isn't reversible from your side; if proven wrong you'd reverse via offset on the next cycle. |
| **`balance_offset_cents` grows large enough to bankrupt the next payout indefinitely** | Admin write-off action (Task 07) can zero out an offset and log to `admin_action_log`. After 90 days of zero earnings, an admin alert surfaces in `/admin/reports/finance-ops` (Task 07 widget). |
| **Phase 1.5 carve-out hasn't shipped yet** | Phase 2 migration's verification step (Task 01 last DO block) refuses to run if `bookings.affiliate_commission_amount_cents` doesn't exist. Hard fail, descriptive error. |
| **Cron timeout exceeded** with many ripe conversions on the first run | Page through `bookings` 50 at a time (existing pattern); the second pass for payouts also pages 50 at a time. Process incrementally; next tick (10 min later) picks up the rest. |
| **Affiliate's Stripe account is closed** between earning and payout | `getConnectAccountStatus` check before transfer; if `chargesEnabled=false` and `payoutsEnabled=false`, payout enters `status='blocked'` with reason. Notification fires. Conversion remains ripe (not paid) and retries on next tick. |
| **Tax form (1099-NEC) status missing** for US affiliates earning >$600/year | Stripe Express handles 1099-NEC automatically when configured; we surface `stripe.accounts.retrieve().requirements` in the affiliate dashboard so they see what's outstanding before earnings build up. Out of scope: chasing affiliates to complete tax forms. |

## Out of scope

- **Social advocate payouts** — separate identity, separate sprint
- **Subscription commission payouts** — subscriptions don't credit
  affiliates today (per spec §1)
- **International / multi-currency** — US/USD only. Task 02's
  country-precheck rejects non-US affiliates with a friendly message
  before the Stripe call.
- **Crypto / alternative payout methods** — Stripe Express only
- **Tax document chasing UX** — relying on Stripe Express's built-in
  flow + a "View tax documents" link (Task 06) that opens Stripe's
  hosted tax page. Admin alert surfaces if Stripe reports outstanding
  requirements.
- **Reversing a posted Stripe transfer** — irreversible; reconciliation
  goes through offset
- **Per-conversion payout** (real-time, one-per-booking) — batched
  per-affiliate by cron tick instead
- **Backfill of pre-Phase-1.5 conversions** — those have no carved-out
  cents on platform balance to transfer; handled separately if at all
  (likely write-off via admin UI)
- **Affiliate-initiated disconnect / Stripe account swap** —
  affiliate cannot disconnect via the affiliate portal. To switch
  Stripe accounts they must (a) revoke access from their Stripe
  Dashboard (which fires `account.application.deauthorized` —
  handled in Task 02; cache nulls out, prior_stripe_account_ids gets
  appended), then (b) re-onboard via the Connect CTA. Phase 3 may
  add an in-app disconnect button if it becomes a recurring request.
- **Email-on-payout content polish** — Task 09 ships the
  notification kinds + minimal copy; long-form HTML emails / branded
  templates are a follow-up
- **Test-mode → prod migration of `stripe_account_id`** — test-mode
  account IDs (e.g. `acct_1NX...test...`) stored in dev are NOT
  valid in prod Stripe. Each affiliate must re-onboard once when the
  prod environment goes live. Communicate this in the rollout email
  (Task 08 sign-off).

## Pre-flight verification (run before starting)

```bash
# 1. Phase 1.5 carve-out is shipped (column exists, code reads it)
grep -n "affiliate_commission_amount_cents" src/app/api/stripe/booking-payment/route.ts
# Expected: at least 2 hits — compute + spread into insert.
psql "$SUPABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='affiliate_commission_amount_cents';"
# Expected: 1 row.

# 2. The existing connect helper still uses the diviner pattern (we'll fork it)
grep -n "createConnectAccount" src/lib/stripe/connect.ts
# Expected: line 8, signature takes { email, divinerId } — Task 02 adds an
# affiliate variant or generalizes the metadata.

# 3. The no-show-refunds cron is the right cron to extend
grep -n "no-show-refunds" src/app/api/cron/no-show-refunds/route.ts
ls src/app/api/cron/ | grep -i affiliate
# Expected: cron route exists; no separate affiliate-payouts cron.

# 4. Migration ordinal collision check
ls supabase/migrations/2026050* 2>/dev/null
# Expected: 20260505000001 + 20260505000002 (carve-out) at most.
# Use 20260505000003 or whatever's next free.

# 5. Existing affiliate_accounts table state
psql "$SUPABASE_URL" -c "\d affiliate_accounts"
# Expected: no stripe_account_id column yet, no balance_offset_cents.

# 6. Test affiliate exists for E2E (or note to create one)
psql "$SUPABASE_URL" -c "SELECT id, email, status FROM affiliate_accounts WHERE status='active' LIMIT 3;"
```

## Reading order for the implementer

1. This file
2. `docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/00-master-task.md` (Phase 1.5 sets the foundation)
3. Spec §3.8, §5 Flow F, §5 Flow J (current state)
4. `src/lib/stripe/connect.ts` (the diviner pattern Phase 2 mirrors)
5. `src/app/api/cron/no-show-refunds/route.ts` (the cron Phase 2 extends)
6. `src/lib/affiliate-attribution.ts::creditAffiliateConversion` (writes the rows Phase 2 reads)
7. `01-schema-migration.md` and start work

## Post-deploy ordering note

This is a **two-stage deploy**:

**Stage 1 (Tasks 01, 02, 03, 05, 06, 07):**
- Apply migration 01 first (additive, idempotent)
- Deploy code: onboarding routes, gate middleware, offset writes,
  affiliate + admin UI all live
- Affiliates can connect Stripe immediately
- New campaign creation gate kicks in immediately
- **No money moves yet** — Task 04 (the cron extension) hasn't shipped
- Kill-switch defaults to FALSE

**Stage 2 (Task 04):**
- Deploy the cron extension. First few ticks run in dry-run mode
  (because kill-switch is FALSE), writing `affiliate_payouts` rows
  with `status='dry_run'` for review.
- Verify dry-run output across at least 3 cron ticks (30 minutes)
- Flip kill-switch to TRUE via admin UI
- Next tick fires the first real transfers
- Monitor Stripe Dashboard + admin payouts UI for the first 24h

The two-stage pattern lets you ship the infrastructure without
flipping the money-movement bit. If you discover a bug in Stages 1's
ledger writes, fix it before flipping; affiliates already see "Connect
Stripe" CTAs but haven't been promised an exact payout date.
