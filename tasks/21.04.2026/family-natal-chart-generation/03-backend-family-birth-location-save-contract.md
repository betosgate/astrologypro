# Backend Task - Family Birth Location Save Contract

- Status: Planned
- Priority: P0
- Area: Backend / Community Family / Birth Location
- Files:
  - `src/app/api/community/family/route.ts`
  - `src/app/api/community/family/[id]/route.ts`
- Related Endpoint: `GET /api/community/family`
- Related Endpoint: `POST /api/community/family`
- Related Endpoint: `PATCH /api/community/family/[id]`

---

## Problem

Family member birth-location data is not saved consistently.

The frontend can send:

- `birthCity`
- `birthCountry`
- `birthLat`
- `birthLng`

But `POST /api/community/family` currently inserts only:

- `birth_city`
- `birth_country`

and does not persist:

- `birth_lat`
- `birth_lng`

This can leave new family members without reliable chart-generation coordinates.

There is also a read-contract issue: edit screens load family members from
`GET /api/community/family`, so that endpoint must return `birth_lat` and
`birth_lng` or the frontend cannot prefill/edit existing coordinates.

## Required Backend Fix

### 1. Return Coordinates on Read

Update `GET /api/community/family` to include:

- `birth_lat`
- `birth_lng`

so all add/edit entry points can load existing structured location data.

### 2. Save Coordinates on Create

Update `POST /api/community/family` to accept:

- `birthLat`
- `birthLng`

and save them into:

- `birth_lat`
- `birth_lng`

Validate as finite numbers when present. Store `null` when missing or intentionally empty.

### 3. Save Coordinates on Edit

Update `PATCH /api/community/family/[id]` to allow updates to:

- `birth_city`
- `birth_country`
- `birth_lat`
- `birth_lng`

### 4. Invalidate Chart When Birth Location Changes

If any birth-location field changes, clear or invalidate stale chart data:

- `natal_chart`
- `chart_updated_at`

If natal lifecycle fields are available after Task 1, also set status back to the appropriate regeneration-needed state if that matches existing project rules.

## Acceptance Criteria

- [ ] `POST /api/community/family` persists `birth_lat`.
- [ ] `POST /api/community/family` persists `birth_lng`.
- [ ] `GET /api/community/family` returns `birth_lat`.
- [ ] `GET /api/community/family` returns `birth_lng`.
- [ ] `PATCH /api/community/family/[id]` can update `birth_lat`.
- [ ] `PATCH /api/community/family/[id]` can update `birth_lng`.
- [ ] Updating birth city/country/lat/lng invalidates stale natal chart data.
- [ ] Existing ownership/RLS checks remain intact.

## QA Checklist

- [ ] Create a family member with city, country, lat, and lng.
- [ ] Verify DB row stores all four structured fields.
- [ ] Edit that member’s birth location.
- [ ] Verify DB row updates all structured fields.
- [ ] Verify old chart data is cleared/invalidated when location changes.

## Important Constraints

- Do not change the frontend form contract in this task.
- Do not repair existing bad rows in this task.
- Do not change natal generation API behavior in this task.
- Do not weaken ownership checks.
