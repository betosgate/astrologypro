# Master Task - Community Relationship Saved Report Lifecycle

- Status: Planned
- Priority: P0
- Area: Perennial / Community / Relationship Reports
- Routes: `/community/charts`, `/community/charts/detailed`
- Related Task Sets:
  - `tasks/27.04.2026/community-saved-chart-report-lifecycle`
  - `tasks/27.04.2026/community-chart-cache-and-regeneration`

---

## Goal

Implement production-grade saved report lifecycle for community relationship reports.

Once a relationship report is generated for a pair and report type, the exact generated payload must be saved and reused. Opening the report again must fetch saved DB data and must not call live compute / chart / AI APIs unless the user explicitly chooses Regenerate.

## Supported Report Types

- romantic/love: `romantic_forecast_report_tropical_v2`
- friendship: `friendship_report_tropical_v2`
- business/partnership: `business_partner_v2`

Canonical report type values:

```txt
romantic
friendship
partnership
```

Map UI mode `business` to canonical report type `partnership`.

## Existing Foundation To Reuse

- Full artifact table: `astro_ai_responses`
- Existing save/fetch APIs:
  - `POST /api/astro-ai/save-astro-ai-response`
  - `POST /api/astro-ai/fetch-save-astro-ai-response`
  - `POST /api/astro-ai/lookup-saved`
- Existing domain lifecycle table:
  - `community_relationship_reports`
- Existing helper module:
  - `src/lib/community/saved-report-link.ts`
  - `saveAndLinkRelationshipReport(...)`
  - `loadLinkedRelationshipReport(...)`
- Existing CTA state model:
  - `src/lib/community/chart-report-state.ts`
  - `deriveRelationshipReportState(...)`

## Current Problem

`/community/charts/detailed` always mounts `HoroscopeToolkitPage` with pair prefill. The toolkit then runs live compute / wheel / AI calls for the selected relationship report type.

Even if the user already generated the report once, reopening the report can regenerate expensive data instead of loading the saved artifact.

## Required Behavior

For each `(member_id, sorted person_a_id, sorted person_b_id, report_type)`:

- Show Generate when no valid saved report exists.
- Generate through the current production toolkit flow.
- Save the exact generated full payload to `astro_ai_responses`.
- Link it through `community_relationship_reports`.
- Show View when a valid saved artifact exists.
- View loads the linked saved artifact and renders the same report UI without live compute / AI generation.
- Regenerate is explicit and replaces the link only after a new artifact is saved.
- Existing old `relationship_charts.chart_data` may remain a lightweight compatibility signal, but it must not count as a complete full report.

## Out Of Scope

- No astrology calculation changes.
- No prompt/content changes except saving and hydrating already generated output.
- No browser-only cache, localStorage, or dummy state.
- No monthly transit changes.
- No natal chart lifecycle changes except using existing valid natal chart readiness as prerequisite.

## Task Breakdown

1. `01-audit-current-relationship-flow.md`
   Confirm current routes, APIs, toolkit slugs, DB tables, and exact live calls.

2. `02-add-relationship-save-link-endpoint.md`
   Add the minimal authenticated server entrypoint that calls existing `saveAndLinkRelationshipReport(...)`.

3. `03-add-relationship-saved-hydration.md`
   Load linked saved report before generation and hydrate `HoroscopeToolkitPage` without live calls.

4. `04-wire-relationship-list-cta-state.md`
   Make `/community/charts` show Generate/View/Regenerate state per pair/type from saved lifecycle.

5. `05-regenerate-and-invalidations.md`
   Add explicit Regenerate behavior and ensure natal chart changes invalidate affected relationship saved reports.

6. `06-regression-and-qa-checklist.md`
   Verify save, fetch, no-live-call, ownership, and each relationship type.

## Acceptance Criteria

- [ ] Romantic report saves once and views from DB afterward.
- [ ] Friendship report saves once and views from DB afterward.
- [ ] Business/partnership report saves once and views from DB afterward.
- [ ] Saved View makes no compute / synastry / composite / AI interpretation calls.
- [ ] Only Show More or explicit Regenerate may call live AI after saved report exists.
- [ ] Same pair can have separate saved reports by type.
- [ ] Regenerate one type does not overwrite another type.
- [ ] Cross-household person ids cannot save, link, or fetch reports.
- [ ] Dashboard/list state uses saved lifecycle, not old dummy relationship data.
