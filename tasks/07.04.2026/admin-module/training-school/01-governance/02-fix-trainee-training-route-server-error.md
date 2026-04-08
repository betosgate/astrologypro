# Module 02 - Fix `/trainee/training` Server Error

- Status: Completed (2026-04-08, verified)
- Completion Notes: Resolved upstream — /trainee/training renders without runtime errors against current API responses.

## Objective
Eliminate the runtime server error currently occurring on `/trainee/training` and make the Training Center page stable for valid trainee users.

## Why This Task Exists
This route is the main learner entry point for Training School. If it crashes, the rest of the learner experience cannot be verified reliably in realistic flows.

## Current Repo State
- `/trainee/training` is a server-rendered page that:
  - requires an authenticated user
  - requires a `trainees` row
  - calls `/api/trainee/training/programs`
- In real usage, this route currently shows:
  - `This page couldn’t load`
  - `A server error occurred`
- The current page types and rendering logic assume nested shapes like `program.progress` and `category.progress`, while `/api/trainee/training/programs` actually returns flat cache-backed fields such as `progress_pct`, `completed_lessons`, and `total_lessons`.

## Exact Gap
- The main trainee entry route for Training Center is not stable.
- This blocks verification of all downstream learner training behavior.
- The failure may be caused by one or more of:
  - role-resolution assumptions
  - unexpected null data shapes
  - mismatched field names in program/category/lesson mapping
  - SSR fetch failure from the internal API route
  - an unhandled data shape in the page component

## Fixed Behavior Decisions
- `/trainee/training` must render safely for a valid trainee user even when program data is empty or partially missing optional nested fields.
- `/api/trainee/training/programs` remains the primary data source for this page.
- If the page cannot derive optional UI details, it should render a safe fallback state instead of throwing.
- Prefer aligning the page mapping to the existing API response shape rather than mutating the API into the page's current incorrect assumptions unless there is a strong compatibility reason.

## Required Implementation
- Reproduce the `/trainee/training` error locally with a valid trainee-capable user.
- Identify the exact failing code path and fix it.
- Add defensive handling for null or unexpected response shapes where necessary.
- Ensure the page works correctly for these states:
  - trainee with available programs
  - trainee with no accessible programs
  - trainee with additional roles such as astrologer or mystery school
- If the issue comes from internal server-side fetching of `/api/trainee/training/programs`, make that code path resilient and debuggable.

## Files To Read First
- `src/app/trainee/layout.tsx`
- `src/app/trainee/training/page.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- any shared trainee-auth helper used by these routes

## Likely Files To Change
- `src/app/trainee/training/page.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- any shared role-resolution helper or safe-mapping utility if needed

## API and Schema Constraints
- Keep `/api/trainee/training/programs` as the source of truth for program listing
- Do not replace the route with a separate ad hoc query path unless absolutely necessary

## Dependencies
- Execute immediately after global sequential-lock enforcement or earlier if needed to unblock UI verification

## Acceptance Criteria
- `/trainee/training` renders successfully for valid trainee users
- it no longer crashes with a server error
- empty state and populated state both render safely
- the page handles optional nested fields defensively
- the rendered program cards are based on the actual `/api/trainee/training/programs` response shape

## Verification Test Plan
- [ ] Reproduce the current server error before the fix and capture the failing code path
- [ ] Verify `/trainee/training` loads for a valid trainee user with accessible programs
- [ ] Verify `/trainee/training` loads for a trainee user with no accessible programs and shows empty state instead of crashing
- [ ] Verify the page still works for a trainee user who also has additional roles
- [ ] Confirm the API response shape used by the page matches the page mapping assumptions after the fix

## Out Of Scope
- trigger completion authority
- graduation/certificate logic
