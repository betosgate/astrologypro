# Task 01 - Audit Current Relationship Flow

- Status: Planned
- Priority: P0
- Area: Audit / Relationship Reports
- Routes: `/community/charts`, `/community/charts/detailed`

---

## Goal

Document the exact current relationship report flow before changing behavior.

This task is read-only. Do not edit files.

## Inspect

- `/community/charts`
  - How pairs are listed.
  - How relationship type is selected.
  - Whether existing `relationship_charts` data affects CTA state.

- `/community/charts/detailed`
  - How `personAId`, `personBId`, and `mode` are validated.
  - How `RELATIONSHIP_TAB_MAP` maps UI mode to toolkit slug.
  - How `HoroscopeToolkitPage` is mounted.

- `HoroscopeToolkitPage`
  - Which live compute calls run for two-person tabs.
  - Where full generated payload is assembled.
  - Where romantic currently saves to `/api/astro-ai/save-astro-ai-response`.
  - Whether friendship/business save anything today.

- Existing DB/helpers
  - `community_relationship_reports`
  - `relationship_charts`
  - `saveAndLinkRelationshipReport(...)`
  - `loadLinkedRelationshipReport(...)`
  - `deriveRelationshipReportState(...)`

## Deliverable

Write a short audit note in this task file or PR description with:

- Current live API calls for each report type.
- Existing saved-report gaps.
- Confirmed canonical relationship type mapping:
  - `romantic` → `romantic`
  - `friendship` → `friendship`
  - `business` → `partnership`
- Any existing route that must remain backward-compatible.

## Acceptance Criteria

- [ ] Current relationship route flow is documented.
- [ ] All save/fetch/link helpers are identified.
- [ ] No code changes are made in this task.
