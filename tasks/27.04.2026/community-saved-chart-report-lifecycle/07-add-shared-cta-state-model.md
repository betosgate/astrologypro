# Task 07 - Add Shared CTA State Model

- Status: Planned
- Priority: P1
- Area: Community UX / Chart Lifecycle

---

## Goal

Standardize chart/report CTA states across all PM/community chart surfaces.

## Required States

Use a shared model like:

```ts
type ChartReportState =
  | "missing"
  | "generating"
  | "generated"
  | "failed"
  | "stale"
  | "locked_for_review";
```

## CTA Mapping

Suggested mapping:

```txt
missing           -> Generate Chart / Generate Report
generating        -> Generating
generated         -> View Chart / View Report + Regenerate
failed            -> Retry Generate
stale             -> Regenerate
locked_for_review -> View Chart or Locked for Review, depending governance rules
```

## Required Surfaces

- `/community/family`
- `/community/family/[id]`
- `/community/horoscope`
- `/community/transits`
- `/community/transits/detailed`
- `/community/charts`
- `/community/charts/detailed`
- dashboard/community chart cards if they display chart readiness

## Acceptance Criteria

- [ ] CTA state does not rely only on raw JSON truthiness.
- [ ] Generate/View state is consistent across PM/community.
- [ ] Failed and stale states are visible.
- [ ] Regenerate is explicit, not accidental.
- [ ] View only appears when a valid saved report or compatible legacy chart exists.
