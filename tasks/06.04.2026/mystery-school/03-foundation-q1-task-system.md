# Module 03 - Foundation Q1 Task System

## Objective
Convert the current 12-week foundation from a simple week-complete flow into a true task-driven Q1 system while reusing existing tables where possible.

## Current State In Repo
- `mystery_school_foundation_weeks` exists.
- `student_foundation_progress` exists.
- Student UI allows a week to be marked complete directly.
- There is no task checklist model yet.

## Required Outcome
- Each week has:
  - title
  - description
  - task list
  - Beto audio
- Students complete tasks individually.
- A week is only complete when all tasks are done.
- Week N+1 unlocks only after Week N is complete.
- Completing week 12 unlocks the decan phase.

## Detailed Tasks
- [ ] Decide whether to extend `mystery_school_foundation_weeks` with a task JSON column or equivalent existing structure.
- [ ] Add support for week-level fields that map functionally to:
  - title
  - description
  - tasks
  - audio
- [ ] Extend `student_foundation_progress` so it can store task-level completion state, not just completed week rows.
- [ ] Design a normalized or JSON approach for:
  - checklist items
  - per-task completion
  - week completion flag
  - completed timestamp
- [ ] Update `/api/mystery-school/foundation` to return:
  - all tasks
  - per-task completion state
  - locked/current/complete status
  - week-level progress counts
- [ ] Replace the simple “Mark Week Complete” interaction with a checklist-based completion flow.
- [ ] Create or refine the week detail UI so it includes:
  - Beto audio player
  - full description/instructions
  - task checklist
  - progress summary like `Week 4 of 12 — 3 of 7 tasks complete`
- [ ] Keep Q1 student-paced. Do not add date locking.
- [ ] Ensure week unlock logic is based strictly on previous week completion.
- [ ] Ensure Week 1 unlocks immediately on enrollment.
- [ ] Ensure Week 12 completion advances the student to the decan phase.
- [ ] Update admin UI for foundation content entry so admins can manage tasks, not just free-text content and audio.

## Acceptance Criteria
- Students cannot complete a week without completing all tasks.
- Admins can author and edit task lists per week.
- Q1 progression is sequential and student-paced.
- Decans unlock only after Q1 is truly complete.
