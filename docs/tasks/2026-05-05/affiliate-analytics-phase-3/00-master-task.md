# Master — Affiliate Analytics Phase 3 (2026-05-05 plan, ships post-Phase-2)

- Status: Planned (cannot start until Phase 2 has shipped + been
  collecting data ~30 days)
- Priority: P1
- Sprint window: 3–5 days
- Spec: `docs/specs/affiliate-commission-system.md` — adds new §7
  "Analytics & Reporting"
- Hard prerequisite: **Phase 2 carve-out + payouts shipped**, including
  Phase 2 Task 10 (instrumentation prep). Phase 3 reads data Phase 2
  produces — without ≥30 days of click + conversion + payout data,
  most charts will be flat.

## TL;DR

Phase 2 made every dollar accurate. Phase 3 makes every **insight**
accurate: who's converting, where they came from, how fast money
moves, and which affiliates / campaigns / channels are pulling weight.

No new money flows. No new payouts. Just dashboards, calculations,
and decision-grade visibility on top of existing schema.

## What this sprint is NOT

- New tables for click data — already exists ([campaign_clicks](supabase/migrations/20260417000010_campaign_destinations_and_clicks.sql))
- New money flows — Phase 2 covers all transfers
- A/B testing for landing pages — Phase 4
- Multi-touch attribution — Phase 4
- Predictive forecasting — Phase 4 (needs more historical data first)

## Locked design decisions

1. **Read-only** — Phase 3 is dashboards + aggregations. No new
   writes to existing tables (the milestone stamps from Phase 2
   Task 10 cover the writer side).

2. **Server-rendered Supabase queries** — every dashboard runs
   server-side aggregations, hands JSON to a Client Component for
   chart rendering. Matches the existing admin/reports/* pattern.
   No TanStack Query client refetching for these read-mostly views.

3. **Period filter standard** — every dashboard supports the same
   filter shape: `?period=30d|90d|365d|all` plus optional
   `?start=YYYY-MM-DD&end=YYYY-MM-DD`. Matches existing
   `/admin/reports/payouts` and `/admin/reports/finance-ops`.

4. **Currency unit** — cents in API, dollars formatted in UI. Same
   convention as Phase 2.

5. **Charts library** — use whatever's already in
   `/admin/reports/finance-ops/page.tsx` and the existing affiliate
   portal (verify before starting; likely Recharts or a similar
   shadcn/Radix-friendly lib).

6. **Cohort window** — referred-client retention measured at
   30/60/90/180 days post-first-booking. Industry-standard intervals
   for service-business cohort.

7. **Click attribution model** — last-touch (most recent unique
   click before booking). Already implicit in `campaign_clicks
   .conversion_id` linkage; multi-touch is Phase 4.

8. **Bot filtering** — exclude `campaign_clicks.is_bot = TRUE` from
   all dashboards. The existing schema already classifies bots at
   click time.

## Required outcome

After Phase 3 ships:

**Affiliates** see at `/affiliate/performance`:
- 9 metric cards: clicks, unique clicks, conversion rate, conversions,
  AOV, avg commission, **effective rate**, **reversal rate**, **avg
  days to payout**
- Earnings trend chart (filterable 30/90/365d/all)
- Top-10 campaigns by commission
- **Geographic breakdown** of clicks (top-10 countries)
- **Own-cohort retention** (do my referred clients book again?)

**Diviners** see on `/dashboard/finance`:
- Affiliate-driven gross vs direct gross (donut + %)
- Top-5 affiliates driving bookings to them
- Total commission outflow

**Admin** has one consolidated `/admin/reports/affiliate-analytics`
page with:
- 9 platform metrics: paid total, outstanding, median time-to-payout,
  **average payout amount**, payout success rate, reversal rate,
  refund-after-payout rate, commission % of GMV, active affiliates
- Payout velocity histogram, campaign ROI table, risk signals panel
- Onboarding funnel (5 steps: invited → first-payout)
- Referred-client retention cohort (30/60/90/180-day rebook %)
- **Click-through funnel** (clicks → conversions → paid)
- **UTM source attribution** (top-20 by commission)
- **Cron health pill** (last tick, consecutive failures)
- **International-demand widget** (rejected non-US onboarding attempts)

**Admin** also has on `/admin/reports/finance-ops`:
- 1099-NEC threshold tracker (issued / approaching / at-risk)
- Failed-payout widget (Phase 2 Task 09)
- Stale-offset widget (Phase 2 Task 07)

## Task breakdown

| # | Task | Priority | Depends on |
|---|---|---|---|
| 00 | Master (this file) | P1 | Phase 2 + Task 10 shipped |
| 01 | [Affiliate performance dashboard](01-affiliate-performance.md) — clicks, CTR, conversion rate, AOV, top campaigns, trend | P1 | — |
| 02 | [Diviner affiliate-mix breakdown](02-diviner-mix.md) — % of bookings via affiliates, top affiliates per diviner, affiliate-driven gross vs direct | P1 | — |
| 03 | [Admin consolidated analytics page](03-admin-analytics.md) — median time-to-payout, payout velocity, reversal rate, refund-after-payout rate, commission % of GMV, per-campaign ROI | P0 | — |
| 04 | [Funnel + cohort calculations](04-funnel-cohort.md) — affiliate-onboarding funnel + referred-client retention curves | P1 | 01, 02, 03 (component) |
| 05 | [1099-NEC threshold tracker](05-1099-tracker.md) — admin compliance widget | P0 | — |
| 06 | [Tests + sign-off + spec sync](06-tests-and-signoff.md) — query tests, snapshot tests, spec §7, manual review | P1 | 01–05 |

## Execution order

(01 + 02 + 03 + 05 in parallel — independent dashboards, different
files, no shared types) → 04 (depends on chart components built in
01–03) → 06.

## Acceptance gate

Phase 3 is done when:

- [ ] Affiliate dashboard `Performance` tab live with 6 metrics
      (lifetime + period filtered) and 1 trend chart
- [ ] Diviner dashboard shows affiliate-mix card on the finance page
- [ ] `/admin/reports/affiliate-analytics` page live with platform
      metrics, funnel chart, and cohort retention chart
- [ ] 1099-NEC threshold widget on `/admin/reports/finance-ops`
      surfaces affiliates within 90% of $600 YTD
- [ ] All numbers cross-check against hand-computed SQL on a known
      fixture set (1 affiliate, 5 conversions, 2 payouts) within 1¢
      tolerance for rate-derived calculations
- [ ] Spec §7 added with the canonical query for each metric
- [ ] No regression in Phase 2 dashboards
- [ ] Page LCP < 2.5s on the admin analytics page (per project §2)

## Risks

| Risk | Mitigation |
|---|---|
| **Insufficient data on day 1** — funnel chart empty if Phase 2 hasn't run for 30+ days | Wait at least 30 days post-Phase-2 deploy before starting Phase 3 implementation. Document in master task. Optionally backfill `first_conversion_at` from `MIN(converted_at)` (Phase 2 Task 10 noted this). |
| **Slow aggregation queries** at scale | Every aggregation is by `affiliate_account_id` or `campaign_id` — both indexed. Run `EXPLAIN ANALYZE` on each query before merging; add covering indexes if any tops 200ms. |
| **1099 threshold miscalculation** (calendar year vs payout year) | Use `paid_at` (the date money actually moved) for YTD totals, not `converted_at`. Verify against Stripe Express's own 1099 figures during E2E. |
| **Cohort math drift** when bookings are refunded after the cohort window | Define cohort metric as "client made another booking, regardless of refund status." Refunds aren't part of retention math here — that's a separate refund-rate metric. |
| **Chart library mismatch** with existing portal style | Verify which lib `/admin/reports/finance-ops/page.tsx` already uses; reuse same. Don't introduce a second charting lib. |

## Pre-flight verification

```bash
# Phase 2 Task 10 columns exist
psql "$SUPABASE_URL" -c "\d affiliate_accounts" | grep -E "first_conversion_at|first_payout_at"
# Expected: 2 rows

# Phase 2 has been collecting data
psql "$SUPABASE_URL" -c "SELECT count(*), min(transferred_at), max(transferred_at) FROM affiliate_payouts WHERE status='completed';"
# Expected: enough completed rows to make charts non-trivial. If <50 rows
# total, dashboards will look anemic — wait longer before shipping Phase 3.

# Click data is flowing
psql "$SUPABASE_URL" -c "SELECT count(*), min(clicked_at), max(clicked_at) FROM campaign_clicks WHERE is_bot=FALSE;"

# Click → conversion linkage is populated
psql "$SUPABASE_URL" -c "SELECT count(*) FROM campaign_clicks WHERE conversion_id IS NOT NULL;"
# Expected: should match (or be close to) the count of campaign_conversions

# Existing chart library
grep -n "from \"recharts\"\|from 'recharts'\|@nivo\|chart.js" src/app/admin/reports/finance-ops/page.tsx
# Expected: identifies which lib to use
```

## Out of scope (Phase 4+)

- Multi-touch attribution (linear, time-decay, position-based) —
  Phase 3 uses last-touch only
- Predictive forecasting (next-7-day expected payout volume,
  affiliate churn risk) — needs ≥6 months historical data
- A/B testing infrastructure for affiliate landing pages
- Slack / email digest of weekly admin analytics summary —
  on-screen only for now
- Per-affiliate fraud-detection ML — surfaced as static thresholds
  ("reversal rate > 25%") in Phase 3, not a model
- Public partner-program leaderboard — internal only

## Reading order for the implementer

1. This file
2. Phase 2 master + Task 10 (the schema this reads from)
3. Spec §6 (Phase 2 behavior — context for the metrics)
4. The existing `/admin/reports/finance-ops/page.tsx` (the design + chart pattern Phase 3 mirrors)
5. The existing `/admin/reports/affiliates/page.tsx` (the affiliate-side admin pattern)
6. `01-affiliate-performance.md` and start work.
