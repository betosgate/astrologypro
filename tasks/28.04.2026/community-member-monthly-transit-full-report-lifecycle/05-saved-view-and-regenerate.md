# Task 05 - Saved View And Regenerate

- Status: Planned
- Priority: P0
- Area: Toolkit / Saved Monthly Full Reports
- Route: `/community/transits/detailed`

---

## Goal

Render saved full monthly report data without re-running live APIs.

## Saved View Behavior

Before generation:

- Load `monthly_transits` by `family_member_id + month`.
- If `full_report_id` exists and status is valid:
  - fetch linked `astro_ai_responses` row with `loadLinkedMonthlyReport(...)`
  - hydrate saved report into the same UI shape as generated output
  - skip live compute / natal wheel / AI interpretation calls

## Regenerate Behavior

- Show `Regenerate` only as explicit action.
- Regenerate runs live generation.
- On successful generation:
  - save new full artifact
  - update `monthly_transits.full_report_id`
  - update timestamp/status
- If regeneration fails:
  - previous saved full report remains available
  - do not clear valid `full_report_id`

## Acceptance Criteria

- [ ] Saved View makes no live compute calls.
- [ ] Saved View makes no AI interpretation calls.
- [ ] Saved View renders same report sections as generated output.
- [ ] Regenerate updates only selected member/month.
- [ ] Failed Regenerate keeps previous saved report usable.
