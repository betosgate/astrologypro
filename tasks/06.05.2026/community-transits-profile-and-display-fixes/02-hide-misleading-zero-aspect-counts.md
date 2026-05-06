# Task 02 - Hide Misleading Zero Aspect Counts

- Status: Planned
- Priority: P1
- Area: Perennial / Community / Monthly Transits / UI
- Routes: `/community/transits`
- Related Files:
  - `src/app/community/transits/page.tsx`
  - `src/app/community/transits/TransitCardExpander.tsx`
  - `src/lib/community/chart-validators.ts`

---

## Goal

Remove or replace the misleading transit-card subtitle:

```txt
0 supportive · 0 challenging aspects
```

This appears when the card does not have a valid monthly transit summary payload. It looks like real astrology data, but it is only the zero fallback from missing/invalid summary data.

## Current Problem

`src/app/community/transits/page.tsx` computes zero counts when `validTransitData` is null:

```txt
harmoniousCount = 0
challengingCount = 0
```

`src/app/community/transits/TransitCardExpander.tsx` always renders those counts:

```txt
{harmoniousCount} supportive · {challengingCount} challenging aspects
```

This suggests the summary was calculated and there are exactly zero aspects, which may be false.

## Required Behavior

- Do not show `0 supportive · 0 challenging aspects` as a fallback.
- Show supportive/challenging counts only when a valid monthly transit summary exists.
- For missing or invalid monthly summary data, show a neutral label or hide the subtitle.
- Keep `Generate Transit Report`, `View Transit Report`, and natal chart CTAs unchanged.
- Keep this as a display/data-contract cleanup only.

## Implementation Notes

- Add an explicit field to `TransitCardData`, for example:

```ts
hasValidTransitSummary: boolean;
transitSummaryLabel: string | null;
```

- In `page.tsx`, derive the flag from:

```ts
validTransitData !== null
```

- In `TransitCardExpander.tsx`, render the aspect-count text only when `hasValidTransitSummary` is true.
- Also check the expanded `Snapshot` block so it does not repeat misleading fallback zeros.
- Do not use `0` as proof that summary data is valid.

## Acceptance Criteria

- [ ] `/community/transits` no longer shows `0 supportive · 0 challenging aspects` for missing/invalid summaries.
- [ ] Valid monthly summaries still show accurate supportive/challenging counts.
- [ ] Expanded `Snapshot` does not show misleading zero-count fallback data.
- [ ] Transit and natal CTA routing remains unchanged.
- [ ] No monthly transit generation logic is changed.

## QA Checklist

- [ ] Load `/community/transits` with a member whose monthly summary is missing.
- [ ] Confirm no misleading zero-aspect subtitle appears.
- [ ] Load `/community/transits` with a member whose monthly summary exists and has aspects.
- [ ] Confirm accurate aspect counts still appear.
- [ ] Expand both card types and verify the snapshot text is clear.

## Out Of Scope

- No monthly transit generation rewrite.
- No saved-report lifecycle changes.
- No chart/readiness eligibility changes.
- No database migration.
- No prompt/content rewrite.
