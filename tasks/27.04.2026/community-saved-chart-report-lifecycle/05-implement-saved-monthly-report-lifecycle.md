# Task 05 - Implement Saved Monthly Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Community Monthly Transits
- Routes: `/community/transits`, `/community/transits/detailed`

---

## Goal

Make the full monthly transit report use the same saved-report lifecycle:

```txt
Generate Report -> save full report -> View Report -> load saved report -> Regenerate when requested
```

## Boundary

Keep the existing architecture:

- `/community/transits/detailed` remains the full report route
- it uses `HoroscopeToolkitPage`
- it is locked to `tropical_transits_monthly_v3`
- `monthly_transits` remains lightweight summary-card storage
- `astro_ai_responses` stores the full rich report artifact

## Required Behavior

- Check for saved current-month full report before expensive generation.
- Generate only when missing, stale, invalid, or forced.
- Save full report to `astro_ai_responses`.
- Link monthly/domain row to saved report.
- View full report from saved artifact without re-calling external APIs.
- Preserve mid-month catch-up summary behavior from the monthly architecture task.

## Acceptance Criteria

- [ ] Full monthly report saves to local `astro_ai_responses`.
- [ ] Full monthly report can be viewed from saved DB payload.
- [ ] Reopening a saved monthly report does not repeat expensive generation.
- [ ] `monthly_transits` remains lightweight summary storage.
- [ ] Saved report identity includes target month.
- [ ] Regenerate explicitly refreshes full report artifact.
