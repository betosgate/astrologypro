# 01 Update API Response Contract - 2026-04-15

- Status: Planned
- Priority: P0
- Owner: Backend
- Parent: `00-master-task.md`
- Task File: `tasks/15.04.2026/astro-charts-api/01-update-api-response-contract.md`

## Goal

Modify `/api/community/astro-charts` to return explicit status context rather than just returning `null` when data is missing.

## Context

The current `GET` endpoint searches for a compiled `natal_chart` and `monthly_transits` row. If it doesn't find them, it returns `{ "natalChart": null, "monthlyTransit": null }`. The frontend has no way of knowing if the chart is actively being generated or simply doesn't exist yet, causing an infinite polling loop.

## Files To Change

| File | Change |
|---|---|
| `src/app/api/community/astro-charts/route.ts` | Change response format to include a status indicator. |

## Required Behavior

Update the API response structure to the following, depending on the backend state:
1. **Missing / Uninitiated**: `{ "status": "missing", "data": null }`
2. **Pending (If discoverable)**: `{ "status": "pending", "data": null }`
3. **Complete**: `{ "status": "complete", "data": { "natalChart": {...}, "monthlyTransit": {...} } }`

*Note: You must investigate if there is a way to determine the "pending" state (e.g. checking a job queue table or another status column). If it cannot be determined, discuss with the team if "missing" is sufficient to stop polling.*

## Acceptance Criteria

- [ ] Returns structured response with `status`.
- [ ] Correctly identifies when data is missing.
- [ ] Backward compatibility is not strictly needed for this internal route, but all consuming components must be updated (handled in Task 02).
