# Task 06 — Tests + Sign-off + Spec Sync

- Status: Not Started
- Priority: P1
- Depends on: 01–05

## Goal

1. Add SQL-correctness tests for every Postgres helper function
   introduced in Phase 3 (median, velocity, ROI, cohort, 1099)
2. Add page-level smoke tests (LCP budget + auth) for the new admin
   page
3. Cross-check every dashboard number against hand-computed SQL on
   a known fixture set
4. Add §7 "Analytics & Reporting" to the spec
5. Update the §12 changelog

## Files to create

| # | File | Action |
|---|---|---|
| 1 | `tests/affiliate-analytics/phase-3-helpers.test.ts` | **Create** — SQL function correctness tests against a seeded fixture |
| 2 | `tests/affiliate-analytics/phase-3-pages.test.ts` | **Create** — page-level smoke (auth + LCP) |
| 3 | `tests/affiliate-analytics/_phase-3-fixtures.ts` | **Create** — shared fixture builder used by both files |
| 4 | `docs/specs/affiliate-commission-system.md` | **Modify** — add §7, update §12 |

## Fixture skeleton

```ts
// tests/affiliate-analytics/_phase-3-fixtures.ts
import { createAdminClient } from "@/lib/supabase/admin";

export async function seedPhase3Fixture() {
  // Repeatable scenario:
  //  - 3 affiliates (A, B, C)
  //  - 3 campaigns (one each)
  //  - 30 conversions across them spread over 90 days:
  //      A: 15 conversions (all paid)  — high performer
  //      B: 10 conversions (5 paid, 3 unpaid, 2 reversed)
  //      C:  5 conversions (1 paid, 4 still ripening)
  //  - 6 unique clients, half of whom rebook within 60 days
  //
  // The fixture builder returns fixture IDs so tests can assert against
  // exact known-good aggregates.

  const admin = createAdminClient();
  // ... build via INSERTs against the schema ...
  // Return shape:
  //   {
  //     affiliateAccountIds: { A, B, C },
  //     campaignIds: { A, B, C },
  //     clientIds: [...],
  //     bookingIds: [...],
  //     conversionIds: [...],
  //   }
}

export async function teardownPhase3Fixture(): Promise<void> {
  // Delete all fixture rows in FK-safe order using the same TEST_RUN_TAG
  // pattern from Phase 2 Task 08.
}
```

## Test 1 — Helper function correctness

```ts
// tests/affiliate-analytics/phase-3-helpers.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { seedPhase3Fixture, teardownPhase3Fixture } from "./_phase-3-fixtures";

describe("Phase 3 Postgres helpers", () => {
  let admin = createAdminClient();
  let fixture: Awaited<ReturnType<typeof seedPhase3Fixture>>;

  beforeEach(async () => { fixture = await seedPhase3Fixture(); });
  afterEach(async () => { await teardownPhase3Fixture(); });

  it("affiliate_daily_earnings buckets per day", async () => {
    const { data } = await admin.rpc("affiliate_daily_earnings", {
      p_affiliate_account_id: fixture.affiliateAccountIds.A,
      p_cutoff: null,
    });
    // Affiliate A had 15 conversions; cluster into expected daily buckets
    expect(data?.length).toBeGreaterThan(0);
    // Sum across buckets should equal A's total commission cents
    const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.commission_cents), 0);
    expect(total).toBe(/* fixture-known cents */ 0);
  });

  it("affiliate_median_time_to_payout_days", async () => {
    const { data } = await admin.rpc("affiliate_median_time_to_payout_days", { p_cutoff: null });
    // Fixture has known-good payout durations; median should land within
    // the expected band (e.g., 1.0-2.0 days given 24h hold + cron cadence)
    expect(Number(data)).toBeGreaterThanOrEqual(1);
    expect(Number(data)).toBeLessThanOrEqual(3);
  });

  it("affiliate_payout_velocity_histogram returns 6 bands", async () => {
    const { data } = await admin.rpc("affiliate_payout_velocity_histogram", { p_cutoff: null });
    const bands = (data ?? []).map((r: any) => r.days_band);
    expect(bands).toContain("1-2d");
    // Counts sum to fixture's total paid count
    const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.count), 0);
    expect(total).toBe(/* fixture-known paid count */ 21);
  });

  it("affiliate_campaign_roi sums correctly per campaign", async () => {
    const { data } = await admin.rpc("affiliate_campaign_roi", { p_cutoff: null });
    expect(data?.length).toBe(3);
    const aRow = (data ?? []).find((r: any) => r.campaign_id === fixture.campaignIds.A);
    expect(Number(aRow.commission_paid_cents)).toBe(/* fixture cents */ 0);
  });

  it("affiliate_referred_client_retention computes cohort retention", async () => {
    const { data } = await admin.rpc("affiliate_referred_client_retention");
    expect(data?.length).toBeGreaterThan(0);
    const firstCohort = data![0];
    // Half of fixture clients rebook within 60d → retained_60d/cohort_size = 0.5
    expect(Number(firstCohort.retained_60d) / Number(firstCohort.cohort_size)).toBeCloseTo(0.5, 1);
  });

  it("affiliate_1099_ytd_totals filters by year", async () => {
    const thisYear = new Date().getFullYear();
    const { data } = await admin.rpc("affiliate_1099_ytd_totals", { p_year: thisYear });
    // Three affiliates × paid amounts > 0 → 3 rows
    expect(data?.length).toBeGreaterThanOrEqual(1);
    // Affiliate A's YTD should match fixture's known-good total
    const aRow = (data ?? []).find((r: any) => r.affiliate_account_id === fixture.affiliateAccountIds.A);
    expect(Number(aRow.ytd_paid_cents)).toBe(/* fixture cents */ 0);
  });
});
```

## Test 2 — Page-level smoke

```ts
// tests/affiliate-analytics/phase-3-pages.test.ts
import { describe, it, expect } from "vitest";

describe("Phase 3 admin analytics page", () => {
  it("returns 401 for non-admin", async () => {
    const res = await fetch("http://localhost:3000/admin/reports/affiliate-analytics");
    expect(res.status).toBe(401);
  });

  it("LCP < 2.5s on hot cache", async () => {
    // Assumes Lighthouse / Playwright + a logged-in admin session.
    // Run via the project's existing E2E harness; this is a stub.
  });

  it("renders all 8 metric cards even when fixture is empty", async () => {
    // Empty-state safety: 0/0 ratios should display "—" not "NaN%"
  });
});
```

## Spec §7 — Analytics & Reporting

Add to `docs/specs/affiliate-commission-system.md`:

```markdown
## §7 — Analytics & Reporting (Phase 3 — 2026-05-05)

### §7.1 — Affiliate-side performance

Affiliates see at `/affiliate/performance`:

- Total clicks, unique clicks (excl. bots) — from `campaign_clicks`
- Conversion count, conversion rate (conversions / unique clicks)
- Average order value (AOV), average commission per conversion
- 30/90/365-day filterable trend
- Top-10 campaigns by commission

### §7.2 — Diviner-side affiliate mix

Diviners see on `/dashboard/finance`:

- Affiliate-driven gross vs direct gross (donut + pct)
- Top-5 affiliates driving bookings to them
- Total commission outflow from their pool

### §7.3 — Admin platform analytics

`/admin/reports/affiliate-analytics`:

8 platform metrics, payout velocity histogram, per-campaign ROI table,
risk-signals panel (high reversal / refund-after-payout / spike), and:

- Onboarding funnel (5 steps from invited → first-payout)
- Referred-client retention cohort (30/60/90/180-day rebook rate)

### §7.4 — 1099-NEC threshold tracker

`/admin/reports/finance-ops` widget surfaces affiliates with YTD paid:
- ≥ $600 (issued bucket)
- ≥ $540 (approaching)
- ≥ $600 + Stripe requirements outstanding (at risk)

Calendar year defined by `paid_at AT TIME ZONE 'America/New_York'`.
Stripe Express handles actual 1099 issuance; admin uses the tracker
for chase-ups.

### §7.5 — Bot exclusion

`campaign_clicks.is_bot = TRUE` rows are excluded from every dashboard.
Bot classification happens at click-write time in
`src/lib/campaign-click-logger.ts`.

### §7.6 — Click → conversion attribution model

Last-touch only. `campaign_clicks.conversion_id` is set when a booking
linked to that click's campaign converts. Multi-touch attribution
(linear, time-decay, position-based) is out of scope for Phase 3.

### §7.7 — Period filter standard

Every dashboard supports `?period=30d|90d|365d|all`. `all` skips the
date filter entirely. Default is `30d` for affiliate, `90d` for
diviner, `90d` for admin.
```

## §12 changelog entry

```markdown
- **2026-05-05+** — Phase 3 affiliate analytics shipped. Performance
  dashboards for affiliates (clicks, CTR, AOV, top campaigns), diviner
  affiliate-mix card, admin consolidated analytics page (median time-to-
  payout, payout velocity, campaign ROI, risk signals), onboarding
  funnel + referred-client retention cohort, 1099-NEC threshold tracker.
  Read-only on top of existing Phase 2 schema. Sprint plan:
  docs/tasks/2026-05-05/affiliate-analytics-phase-3/.
```

## Manual review (before sign-off)

1. **Cross-check every metric** against hand-computed SQL on the
   Phase 3 fixture. Every number should match within 1¢ tolerance.
2. **LCP audit** on the admin analytics page. If > 2.5s, optimize the
   slowest query (likely cohort or ROI; add covering indexes).
3. **Empty-state review** — log in as a brand-new affiliate with zero
   data; the Performance tab should show "No data yet" placeholders,
   not NaN/0% panels.
4. **Mobile review** — resize the diviner mix donut + admin metric
   grid to phone width; verify they remain legible.
5. **Permission review** — try admin endpoints as a regular user
   (401), as a diviner (still 401), as an affiliate (still 401);
   try affiliate endpoints as a different affiliate (forbidden).
6. **Period-overlap edge case** — a conversion at the boundary
   (e.g., exactly 30 days ago) should be included in `30d` filter
   per `>=` semantics; verify.

## Acceptance for this task

- [ ] All 6 helper-function correctness tests pass
- [ ] Page-level smoke tests pass
- [ ] Manual cross-check on fixture: every dashboard number matches
      hand-SQL within 1¢
- [ ] Spec §7 + §12 changelog updated
- [ ] No regression in Phase 2 dashboards
- [ ] All Phase 3 task acceptance lists fully checked
- [ ] PR description includes screenshots of every new dashboard

## Sign-off

The sprint is COMPLETE when:

1. ☐ All 6 task files' acceptance lists fully checked
2. ☐ Spec §7 reflects shipped behavior
3. ☐ One full week of production traffic flows through the new
      dashboards without query timeouts or error logs
4. ☐ Operations team confirms the admin analytics page meets their
      decision-making needs (no obvious gaps surfaced in week-1 review)
5. ☐ Memory entry added recording Phase 3 ship date + week-1 metrics
      snapshot for future debugging

## Out of scope (Phase 4+)

- Predictive forecasting (next-7-day expected payout volume)
- Multi-touch attribution
- A/B testing infrastructure
- Anomaly detection / fraud ML
- Slack / email digest of weekly admin metrics
- Public partner-program leaderboard
- Time-zone-aware period filters (currently uses server time, which
  is UTC on Vercel)
- International tax forms (W-8BEN tracking)
- Quarterly / annual tax summary export
