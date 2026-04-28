# Task 01 - Audit Current Monthly Flow

- Status: Planned
- Priority: P0
- Area: Audit / Monthly Transits
- Routes: `/community/transits`, `/community/transits/detailed`

---

## Goal

Document the current monthly transit behavior before changing it.

This task is read-only. Do not edit files.

## Inspect

- `/community/transits`
  - How current month is calculated.
  - How `ensureCurrentMonthTransitsForMember(...)` is called.
  - How eligible members are counted.
  - How `monthly_transits` rows are listed.
  - Where the global `Open Full Monthly Report` CTA appears.

- `/community/transits/detailed`
  - How self user birth data is resolved.
  - How current month prefill is built.
  - How `HoroscopeToolkitPage` is mounted.
  - Whether any dummy/demo monthly report path exists that does not call the legitimate production external API/toolkit flow.

- `src/lib/community/ensure-monthly-transits.ts`
  - Existing first-of-month compatibility assumptions.
  - Mid-month catch-up behavior.
  - Existing skip-if-current logic.

- `src/lib/community/saved-report-link.ts`
  - `saveAndLinkMonthlyReport(...)`
  - `loadLinkedMonthlyReport(...)`

## Deliverable

Write a short audit note in this task file or PR description with:

- Current monthly summary generation behavior.
- Current self-only detailed report limitation.
- Existing DB fields available for full report linking.
- Any existing cleanup/month rollover behavior found in code.
- A list of any dummy/demo paths found, with the exact file/section that must be commented out or removed from active production flow.

## Acceptance Criteria

- [ ] Current self-only detailed route is documented.
- [ ] Existing current-month summary generation is documented.
- [ ] Existing saved full-report helpers are documented.
- [ ] Dummy/demo non-production monthly paths are identified.
- [ ] No code changes are made in this task.
