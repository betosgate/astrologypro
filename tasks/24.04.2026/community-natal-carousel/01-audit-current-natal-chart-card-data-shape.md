# Task 01 - Audit Current Natal Chart Card Data Shape

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Astrology
- Page Route: `/community`

---

## Goal

Understand the exact data contract currently powering the `Natal Charts` card before introducing a member-carousel UI.

## What To Inspect

Inspect:

- `src/components/community/astro-charts-section.tsx`
- any APIs this component calls for natal chart status/data

Confirm:

- whether the current ready-state only exposes one chart row
- whether member id, full name, DOB, and chart readiness are already available for multiple members
- whether the card is using primary-member data only or family-member data
- whether the carousel can be built frontend-only or needs API shape changes

## Deliverable

Document:

- the current data source
- the current ready-state object shape
- the minimum additional data needed, if any, for a member-carousel implementation

## Acceptance Criteria

- [ ] The current data contract is clearly documented
- [ ] It is clear whether the carousel can be built with existing data
- [ ] Any backend dependency is identified before UI implementation starts
