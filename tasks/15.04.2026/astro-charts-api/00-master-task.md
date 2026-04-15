# Master Task - Astro Charts API Polling Fix - 2026-04-15

- Status: Planned
- Priority: P0
- Owner: Full-stack
- Scope: Astro Charts API null handling, Frontend Polling Component State, QA
- Task File: `tasks/15.04.2026/astro-charts-api/00-master-task.md`

---

## Problem

The endpoint `GET /api/community/astro-charts` is returning `{"natalChart":null,"monthlyTransit":null}` when there is no chart data available for the user. 
The dashboard frontend is continuously polling this endpoint expecting data. Because the API perpetually returns `null`, the UI remains stuck forever in a "Your chart is being prepared..." and "Monthly transit is being calculated..." loading state.

## Goal

Distinguish between "no charts requested", "charts generating", and "charts complete" states. Ensure the frontend handles these states gracefully without getting stuck in an infinite polling loop.

## Expected Architecture

| State | API Response | Frontend UI |
|---|---|---|
| Never Generated | `404` or `{ status: "missing" }` | "Create Chart" button / "No chart generated" message |
| Generating | `202` or `{ status: "pending" }` | "Your chart is being prepared..." (with timeout) |
| Complete | `200` with actual payload | Display the chart data |

## Sub-Tasks

| # | File | What to do | Depends on | Status |
|---|---|---|---|---|
| 01 | `01-update-api-response-contract.md` | Update the `/api/community/astro-charts` endpoint to return explicit status context. | - | Planned |
| 02 | `02-handle-frontend-polling.md` | Update the dashboard component to accurately reflect the API status and halt polling if charts are missing. | 01 | Planned |
| 03 | `03-end-to-end-qa-checklist.md` | Verify the Astro Charts generation flow from empty state to generated state. | 01, 02 | Planned |

## Implementation Notes

- Investigate where the "generation" logic lives. Does the background worker set a status flag? The API needs to read that flag to return "pending" vs "missing".
- If no background flag exists, we need to determine how to safely identify the generating state.
- Do not break existing users whose charts are already generated.

## Acceptance Criteria

- [ ] Uninitialized users see a clear "No Data" or actionable prompt, not an infinite spinner.
- [ ] Users with generating charts see the spinner but it times out/fails gracefully if generation silently fails.
- [ ] Users with generated charts see their charts properly.
- [ ] Frontend network tab shows polling stopping gracefully instead of continuing forever when the status is `missing`.
