# Module 07 - Time-to-Complete Statistics and Benchmarks

## Objective
Add the required completion-time statistics for training-wise and category-wise reporting, including mean, median, and average as requested.

## Current State In Repo
- `lesson_progress`, `lesson_completions`, and `category_completions` already store time-tracking related fields.
- Admin analytics already exposes average time spent in several places.
- Median-oriented statistics are not clearly present today.
- The architect request includes both "mean" and "average," which are mathematically the same unless business language intends a different benchmark.

## Required Outcome
- The statistics definitions are explicit so the product does not ship duplicated labels for the same number.
- Training-wise and category-wise completion-time analytics are available and trustworthy.

## Detailed Tasks
- [ ] Resolve the metric definition ambiguity:
  - if "mean" and "average" are intended as the same value, collapse to one label in UI while documenting the clarification
  - if stakeholders want two different numbers, define the second metric explicitly
- [ ] Define the measurement window from training start to completion for:
  - lesson
  - category
  - program/training
- [ ] Decide whether paused/inactive time should count, and document that rule.
- [ ] Extend existing analytics queries to calculate:
  - mean completion time
  - median completion time
  - the final approved average/benchmark metric
- [ ] Add training-level and category-level views for those metrics.
- [ ] Ensure incomplete learners do not corrupt completion-time statistics.
- [ ] Validate data quality when completion timestamps are missing or were created before the richer tracking fields existed.

## Acceptance Criteria
- Training/program and category reporting expose the final approved completion-time metrics.
- Metric labels are mathematically and product-wise defensible.
- Historic and new completion records are handled safely.

## Verification Test Plan
- [ ] Seed or identify records with different completion times and validate the mean calculation manually.
- [ ] Validate the median calculation manually against an ordered sample set.
- [ ] Confirm incomplete records are excluded from completion-time statistics.
- [ ] Confirm training-level and category-level dashboards display the final approved metric labels consistently.
