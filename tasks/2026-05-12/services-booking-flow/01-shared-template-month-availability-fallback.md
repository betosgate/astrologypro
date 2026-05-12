# Task SBF-01 - Shared Template Month Availability Fallback

- Status: Completed
- Priority: P0
- Owner: Full Stack
- Area: Services booking flow
- Source: Local QA of `/book/template/[slug]`
- Created: 2026-05-12
- Commit: `197ab867` - `enhance month availability fetching logic for diviners`

## Files

- `src/app/api/services/[slug]/template-availability/month/route.ts`

## Problem

The shared template booking calendar could show that a compatible reader
offered a reading, but the calendar month displayed no selectable dates.

Root cause: the month endpoint only queried per-diviner availability with
`serviceId=<service row id>`. Generic availability templates where
`availability_templates.service_id IS NULL` were filtered out by the lower-level
availability API.

The day endpoint already handled this with a scoped-to-generic fallback, but the
month endpoint did not.

## Implementation

1. Keep the existing scoped month lookup first:
   - `/api/availability/[ownerId]/month?serviceId=<service id>`
2. If the scoped lookup returns dates, use those dates.
3. If the scoped lookup returns no dates, retry with:
   - `/api/availability/[ownerId]/month?allSlots=1`
4. Union the resulting dates across compatible diviners as before.

## Acceptance Criteria

- Shared template page can show dates for diviners using generic availability.
- Exact service-scoped availability still takes priority when present.
- Month view and day view now follow the same fallback model.
- No change to template/diviner eligibility gates.

## Verification

```bash
./node_modules/.bin/eslint src/app/api/services/[slug]/template-availability/month/route.ts
```

Manual QA:

- Open `/book/template/[slug]` for a template with a compatible diviner.
- Confirm dates appear when the diviner only has generic availability.
- Pick an available date and confirm the day-level slots resolve.
