# Module 04 - Decan Curriculum and Student Dashboard

- Status: Completed (2026-04-08, verified)
- Completion Notes: decans + student_decan_progress tables, src/app/mystery-school/decans/{page,[id]}/ + src/app/api/mystery-school/{decan,decans}/.

## Objective
Upgrade the decan curriculum model and student-facing dashboard so it covers the full operational behavior expected for Q2-Q5.

## Current State In Repo
- `decans` and `student_decan_progress` exist.
- Student dashboard grid exists.
- Statuses currently include basic locked/upcoming/active/completed/missed.
- Important metadata and lifecycle fields are missing.

## Required Outcome
- Student dashboard clearly represents the full decan year.
- Current decan is prominent.
- Upcoming and missed states are intelligible.
- Admins can manage metadata and inspect student progress.

## Detailed Tasks
- [ ] Audit current `decans` schema and identify the missing metadata needed for the required UX.
- [ ] Add support for the equivalent of:
  - decan name
  - associated tarot card reference
  - artwork/image
  - astronomical date anchors
- [ ] Audit current `student_decan_progress` schema and add the missing lifecycle fields needed for:
  - window open
  - window close
  - grace close
  - completion summary
  - retry bookkeeping if stored here
- [ ] Update `/api/mystery-school/decans` to return richer status data suitable for the intended dashboard.
- [ ] Refactor the student decan grid UI to show:
  - current active decan prominently
  - next 3 upcoming decans
  - status badge with consistent business meaning
  - tarot card reference if available
  - days remaining or unlock timing
- [ ] Add explicit visual states for:
  - locked
  - upcoming
  - active
  - grace
  - complete
  - missed
- [ ] Add read-only preview support for decans that are visible but not yet actionable.
- [ ] Improve completed and missed visual treatment to match the requirement behavior.
- [ ] Build an admin progress overview for all Mystery School students if one does not already exist.
- [ ] Add admin-only status override flow if the final data model supports it.

## Acceptance Criteria
- Students can understand where they are in the 36-decan journey at a glance.
- API data is sufficient for timeline, countdown, preview, and status messaging.
- Admins can inspect student decan progress beyond just content authoring.
