# Task - Community Charts Pairwise Accordion UI - 2026-05-08

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: Community relationship charts list UX
- Route: `/community/charts`
- Task File: `tasks/08.05.2026/community-charts-pairwise-accordion-ui/00-community-charts-pairwise-accordion-ui.md`

## Objective

Replace the pairwise relationship report type dropdown with an accordion flow that matches the Family Chart Overview design.

## Current Problem

`/community/charts` has two generation experiences:

1. Family total chart view opens an accordion and shows three matching cards: Romantic, Friendship, and Business.
2. Pairwise relationship rows use a right-side dropdown selector for report type.

The pairwise dropdown feels inconsistent with the family overview section and does not match the page theme or expected accordion interaction.

## Required Outcome

1. Each pairwise row should expand as an accordion.
2. Expanded pairwise content should show the same three-card layout style as Family Chart Overview:
   - Romantic
   - Friendship
   - Business
3. Each card should show the correct Generate/View/In Progress CTA based on saved report lifecycle state.
4. Pairwise rows should be expandable even when legacy synastry summary data is missing.
5. The right-side `Select type` dropdown should be removed from pair rows.

## Implementation Notes

- Review `src/app/community/charts/page.tsx`.
- Reuse `RELATIONSHIP_MODES`, `getReportStateForMode`, `ctaLabelForState`, and `statusToneClass`.
- Preserve existing detailed report route:

```txt
/community/charts/detailed?personAId=<id>&personBId=<id>&mode=<mode>
```

- Keep legacy synastry summary hidden unless product direction changes.
- Ensure the new accordion does not depend on `relationship_charts.chart_data`.

## Acceptance Criteria

- [ ] Pairwise rows open and close using chevron accordion behavior.
- [ ] Expanded pairwise rows show Romantic/Friendship/Business cards.
- [ ] Card buttons route to the correct detailed report for the selected pair and mode.
- [ ] CTA labels reflect saved report lifecycle state.
- [ ] The pairwise right-side dropdown is removed.
- [ ] Family Chart Overview behavior remains unchanged.
- [ ] Targeted lint passes.

## Verification Gate

1. Open `/community/charts` with at least three family members.
2. Expand Family Chart Overview and observe the three-card layout.
3. Expand each pairwise row and confirm the pairwise layout matches the same design language.
4. Click each pairwise card CTA and confirm the detailed route receives the correct `personAId`, `personBId`, and `mode`.
5. Confirm rows can open even if no legacy synastry data exists.
6. Run targeted lint on the community charts page.

