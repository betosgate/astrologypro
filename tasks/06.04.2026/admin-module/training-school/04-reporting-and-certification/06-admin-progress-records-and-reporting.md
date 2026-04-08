# Module 06 - Admin Progress Records and Reporting Matrix

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/app/admin/training/analytics/page.tsx + src/app/api/admin/training/analytics/.

## Objective
Implement the required training/category/lesson/user reporting model in a way that is concrete enough for direct coding.

## Current Repo State
- Admin analytics already has overview, users, programs, categories, lessons, and quizzes tabs.
- Existing APIs already return several aggregate metrics.
- The architect requirement asks for four report types with four parameters each, but that matrix is not fixed in the current task pack.

## Exact Gap
- The reporting requirement is too ambiguous for an AI agent to implement safely without a fixed metric matrix.
- The repo has analytics, but not a locked reporting contract for these four views.

## Required Implementation
- Implement this baseline metric matrix unless product provides a stricter replacement before coding:
  - training/program view:
    - total enrolled users
    - completed users
    - completion rate
    - average time spent
  - category view:
    - users started
    - users completed
    - completion rate
    - average time spent
  - lesson view:
    - users started
    - users completed
    - completion rate
    - quiz pass rate
  - user view:
    - enrolled programs
    - completed lessons
    - progress percent
    - last activity
- Reuse existing analytics endpoints where possible and extend them only for missing metrics.
- Add drill-down capability from user-level reporting into that user’s program/category/lesson status where current UI is insufficient.
- If the UI displays “training,” it may map to the existing `program` entity, but table/API names must remain unchanged.

## Likely Affected Files
- `src/app/admin/training/analytics/page.tsx`
- `src/app/api/admin/training/analytics/overview/route.ts`
- `src/app/api/admin/training/analytics/users/route.ts`
- `src/app/api/admin/training/analytics/programs/route.ts`
- `src/app/api/admin/training/analytics/categories/route.ts`
- `src/app/api/admin/training/analytics/lessons/route.ts`

## API and Schema Constraints
- Keep existing analytics route names.
- Keep existing entity names in schema and API layers.
- Add new fields to response payloads only where needed.

## Dependencies
- Execute after Module 05.

## Acceptance Criteria
- Each report type exposes the defined metric set.
- Admins can inspect both hierarchy-level and user-level progress.
- Existing analytics pages are extended coherently rather than duplicated.

## Verification Test Plan
- [ ] Verify training/program report returns the defined four metrics.
- [ ] Verify category report returns the defined four metrics.
- [ ] Verify lesson report returns the defined four metrics.
- [ ] Verify user report returns the defined four metrics.
- [ ] Confirm filters and drill-downs work where implemented.

## Out Of Scope
- median time-to-complete calculations
- certificate logic
