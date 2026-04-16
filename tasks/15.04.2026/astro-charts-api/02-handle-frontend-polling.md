# 02 Handle Frontend Polling State - 2026-04-15

- Status: Planned
- Priority: P0
- Owner: Frontend
- Parent: `00-master-task.md`
- Task File: `tasks/15.04.2026/astro-charts-api/02-handle-frontend-polling.md`

## Goal

Update the frontend dashboard Astro Charts component to handle the updated API response contract, particularly preventing infinite polling if the data is genuinely missing.

## Context

The component currently polls `GET /api/community/astro-charts` endlessly if it receives `null` payload because it assumes "null means preparing". This leads to a stuck UI ("Your chart is being prepared..."). 

## Files To Change

| File | Change |
|---|---|
| `src/components/dashboard/...` (Find exact component name) | Update fetch parsing logic and React query/polling conditions. |

## Required Behavior

1. Read the newly added `status` field from the API response.
2. If `status === "missing"`, halt polling immediately. Update UI to show a "No chart data available" message or a "Create Chart" button.
3. If `status === "pending"`, continue polling but implement a reasonable absolute timeout (e.g., 2 minutes) whereafter it fails gracefully to a "Generation took too long" state.
4. If `status === "complete"`, load the `data.natalChart` and `data.monthlyTransit` into the view and stop polling.

## Acceptance Criteria

- [ ] Polling stops when API indicates `status: "missing"`.
- [ ] UI reflects missing state appropriately, not as a never-ending spinner.
- [ ] Polling timeout logic prevents indefinite networking overhead.
- [ ] Chart displays properly upon successful load.
