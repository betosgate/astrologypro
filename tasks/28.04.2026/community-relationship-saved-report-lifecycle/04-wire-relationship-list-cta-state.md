# Task 04 - Wire Relationship List CTA State

- Status: Planned
- Priority: P0
- Area: UI / Relationship Report State
- Route: `/community/charts`

---

## Goal

Make `/community/charts` show saved lifecycle state per pair and relationship type.

The list must not imply a report is complete from old lightweight `relationship_charts.chart_data` alone.

## Required Behavior

For every valid pair:

- If both natal charts are not ready, keep current blocked state.
- If no full saved relationship report exists for a selected type, show Generate/Open generation flow.
- If a full saved report exists for a selected type, show View.
- Same pair can have different states for:
  - romantic
  - friendship
  - partnership

## Data Source

Use `community_relationship_reports` as the full-report lifecycle source.

Do not use old `relationship_charts.chart_data` as the full-report completion source.

## UI Behavior

- Relationship type selector should open the detailed page for the selected type.
- The detailed page decides whether it is View or Generate by checking saved linkage.
- If adding status labels in the list, derive from saved lifecycle:
  - generated → View
  - missing → Generate
  - failed → Retry
  - stale → Regenerate

## Acceptance Criteria

- [ ] List supports separate saved state by relationship type.
- [ ] Old `relationship_charts` data does not unlock View for full reports.
- [ ] Pair selector routes preserve `mode`.
- [ ] User can clearly tell saved reports from missing reports.
