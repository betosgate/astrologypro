# Task 06 - UX States And Regression Checklist

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Monthly Transits QA
- Routes: `/community/transits`, `/community/transits/detailed`

---

## Goal

Define the expected monthly transit user states and regression checks.

## User-Facing States

### No Natal Chart

Show:

- no current monthly summary yet
- CTA to generate natal chart first

Do not show:

- fake monthly transit data
- old dummy chart rows

### Generating

Show:

- "Preparing this month's transits" style state
- non-blocking loading/polling behavior if applicable

Use when:

- row is `pending`
- lazy fallback just started generation
- subscription catch-up is running

### Generated

Show:

- family/member summary cards from valid `monthly_transits` rows
- "Open Full Monthly Report" CTA to `/community/transits/detailed`

### Failed

Show:

- friendly failure state
- retry/contact support path

Do not hide the full report CTA if birth data is complete and the toolkit route can still run.

### Full Monthly Report

`/community/transits/detailed` should:

- remain available to active Perennial users with valid birth data
- render the shared toolkit report
- use saved full report data when available after persistence alignment

## Regression Checklist

- [ ] Existing active member with current-month summary sees summary cards.
- [ ] Existing active member with no natal chart sees generate-natal guidance.
- [ ] New mid-month subscriber with generated natal chart receives current-month summary.
- [ ] New mid-month subscriber without natal chart does not get fake monthly data.
- [ ] New family member added mid-month receives summary after natal chart generation.
- [ ] Failed current-month row can be retried.
- [ ] Valid current-month row is not regenerated unnecessarily.
- [ ] Old/dummy/invalid row is not shown as complete.
- [ ] `/community/transits/detailed` still opens the full toolkit monthly report.
- [ ] Full report does not depend on `monthly_transits`.
- [ ] Summary cards do not depend on `astro_ai_responses`.
- [ ] `astro_ai_responses` report reuse is scoped by target month and birth data.

## Technical QA

- [ ] Verify row uniqueness on `monthly_transits(family_member_id, month)`.
- [ ] Verify race behavior if cron and lazy fallback run close together.
- [ ] Verify RLS/household visibility still restricts summary rows correctly.
- [ ] Verify active membership requirement.
- [ ] Verify inactive/cancelled members are skipped.
- [ ] Verify generated counts, skipped counts, and failed counts are logged or returned.
