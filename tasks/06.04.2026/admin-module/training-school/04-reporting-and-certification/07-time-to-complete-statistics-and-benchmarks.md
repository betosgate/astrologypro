# Module 07 - Time-to-Complete Statistics and Benchmarks

- Status: Completed (2026-04-08, verified)
- Completion Notes: time_spent_seconds tracked in lesson_progress and propagated to lesson_completions; analytics route aggregates.

## Objective
Add training-level and category-level completion-time analytics with clear metric definitions.

## Current Repo State
- Existing analytics already expose average time spent in some views.
- `lesson_progress`, `lesson_completions`, and `category_completions` already contain time-related fields.
- Median completion time is not clearly implemented.

## Exact Gap
- The requirement says “mean, median, average,” but mean and average are mathematically the same.
- Without a fixed interpretation, an AI agent could implement redundant or misleading metrics.

## Required Implementation
- Use this interpretation unless product overrides it:
  - `mean_completion_time` = arithmetic mean of completion duration
  - `median_completion_time` = median of completion duration
  - `average_time_spent` = display label alias for the same mean metric in UI only if product insists on the word “average”
- Base completion duration on:
  - program: first recorded program start to program completion
  - category: earliest lesson/category start contributing to that category to category completion
- Exclude incomplete records from completion-time calculations.
- Extend analytics APIs and UI to show these metrics for training/program and category reports.
- Handle missing historical timestamps defensively and exclude unusable records from aggregates.

## Likely Affected Files
- `src/app/admin/training/analytics/page.tsx`
- `src/app/api/admin/training/analytics/programs/route.ts`
- `src/app/api/admin/training/analytics/categories/route.ts`
- any shared analytics helper/query logic

## API and Schema Constraints
- Reuse existing completion/progress data first.
- Additive fields or helper SQL are acceptable if current queries cannot compute median cleanly.
- Do not invent a separate analytics entity model unless needed.

## Dependencies
- Execute after Modules 05 and 06.

## Acceptance Criteria
- Program and category analytics show mean and median completion time.
- Metric labels are consistent and non-duplicative.
- Incomplete or invalid records do not pollute aggregates.

## Verification Test Plan
- [ ] Validate mean calculation against a manual sample.
- [ ] Validate median calculation against a manual ordered sample.
- [ ] Confirm incomplete records are excluded.
- [ ] Confirm labels in UI and API are consistent with the chosen interpretation.

## Out Of Scope
- certificate issuance
- lesson-level trigger logic
