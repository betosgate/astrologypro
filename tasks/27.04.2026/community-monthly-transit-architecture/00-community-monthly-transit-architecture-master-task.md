# Master Task - Community Monthly Transit Architecture

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Monthly Transits
- Page Routes: `/community/transits`, `/community/transits/detailed`
- Related Task Set: `tasks/27.04.2026/community-chart-cache-and-regeneration`

---

## Goal

Make the Perennial community monthly transit architecture clear, reliable, and user-friendly without rebuilding the existing full monthly report flow.

The system must separate two responsibilities:

- full monthly report: `/community/transits/detailed`, powered by the shared `HoroscopeToolkitPage` and `tropical_transits_monthly_v3`
- lightweight community summary: `/community/transits`, powered by `monthly_transits`

## Current Architecture

### Full Monthly Report

`/community/transits/detailed` is already the correct production-level full monthly report implementation.

It:

- resolves the active community member's birth data
- builds toolkit prefill data
- passes the current month as `futureMonth`
- renders `HoroscopeToolkitPage`
- locks the toolkit to `allowedSlugs={["tropical_transits_monthly_v3"]}`
- makes birth data read-only

This path must remain the source of truth for the full monthly report.

### Lightweight Monthly Summary

`/community/transits` reads rows from `monthly_transits` and displays short family/member summary cards.

This is useful, but it is not the full monthly report. It should be treated as a lightweight community summary layer only.

## Why This Task Exists

The current implementation has three architecture gaps:

1. The full monthly toolkit report and the lightweight `monthly_transits` summary are easy to confuse.
2. The monthly summary generation assumes the 1st-of-month cron will cover every active member.
3. A user who subscribes mid-month can miss the current month's summary until the next cron run.

Example:

- cron runs on April 1, 2026
- user subscribes on April 15, 2026
- no current-month `monthly_transits` row exists for that user/family
- the user sees "generated on the 1st" behavior even though they are now active

That is not a good Perennial/community UX.

## Required Outcome

The monthly transit system should behave like this:

- `/community/transits/detailed` remains the full report path and uses `tropical_transits_monthly_v3`
- `monthly_transits` remains the lightweight family/member summary cache
- full report output is saved/reused through the DB-backed `astro_ai_responses` APIs, not the old CloudFront save endpoint
- current-month summary rows are generated for eligible active members even if they subscribe after the monthly cron has already run
- new family members with newly generated natal charts get current-month summary rows without waiting for next month
- existing valid rows are reused
- failed, stale, dummy, or invalid rows are regenerated through the current production summary generator

## Task Breakdown

1. `01-lock-full-report-boundary.md`
   Document and preserve `/community/transits/detailed` as the full monthly report boundary.

2. `02-align-toolkit-report-persistence.md`
   Move `tropical_transits_monthly_v3` saved report persistence toward the DB-backed `astro_ai_responses` APIs.

3. `03-define-monthly-summary-contract.md`
   Define `monthly_transits` as a lightweight summary cache and add validation rules for current rows.

4. `04-add-mid-month-catch-up-generation.md`
   Add current-month catch-up generation for new Perennial subscribers and newly eligible family members.

5. `05-integrate-generation-triggers.md`
   Wire the reusable ensure-generation service into cron, subscription activation, natal chart completion, and optional lazy fallback.

6. `06-ux-states-and-regression-checklist.md`
   Define user states, admin/support states, and QA coverage.

## Out Of Scope

- Rebuilding `HoroscopeToolkitPage`
- Creating a duplicate full monthly report API
- Replacing `/community/transits/detailed`
- Moving lightweight summary cards into `astro_ai_responses`
- Treating `monthly_transits` as the full detailed report store
- Changing Perennial entitlement rules beyond active-member eligibility checks

## Acceptance Criteria

- [ ] `/community/transits/detailed` still renders the shared toolkit with `tropical_transits_monthly_v3`.
- [ ] Full monthly report output can be saved and reused through local DB-backed `astro_ai_responses` APIs.
- [ ] `/community/transits` clearly uses `monthly_transits` only as lightweight summary data.
- [ ] Active users who subscribe mid-month receive current-month summary rows.
- [ ] Newly generated family natal charts receive current-month summary rows when eligible.
- [ ] Existing valid current-month rows are reused.
- [ ] Invalid, dummy, legacy, failed, or stale rows are not treated as complete.
- [ ] The 1st-of-month cron remains supported.
- [ ] User-facing states handle missing natal chart, generating, generated, failed, and retry cases.
