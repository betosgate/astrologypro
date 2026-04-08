# Module 06 - Scrying and Mundane Journals

- Status: Completed (2026-04-08, verified)
- Completion Notes: scry_journals + mundane_journals (migration 20260406000025) with submission UI in mystery-school/scrying and /mundane.

## Objective
Bring the journaling flows up to the required data and validation depth while reusing the existing journal tables where possible.

## Current State In Repo
- `scry_journals` and `mundane_journals` exist.
- Student submission UI exists.
- Each submission currently stores only a single free-text content field.

## Required Outcome
- Scrying supports card association behavior.
- Mundane journaling enforces three distinct required sections.
- Student and admin experiences support review and lifecycle restrictions.

## Detailed Tasks
- [ ] Extend `scry_journals` or equivalent schema to support:
  - assigned decan card reference
  - optional alternate card drawn
  - experience text
- [ ] Extend `mundane_journals` or equivalent schema to support:
  - relationships section
  - business/work section
  - shifts in perception section
- [ ] Update student scry UI to:
  - show the assigned decan card
  - allow alternate-card selection if required by business rules
  - validate required experience text
- [ ] Update student mundane journal UI to:
  - split the form into 3 sections
  - require all 3 sections
  - enforce minimum character count per section
- [ ] Update APIs to validate these rules server-side.
- [ ] Decide whether scrying should allow multiple submissions while only the first counts for task completion.
- [ ] If multiple submissions are allowed, update schema and UI accordingly.
- [ ] Make past entries read-only after the submission window closes.
- [ ] Build or extend admin review screens so admins can inspect actual student submissions by decan and student.
- [ ] Add export capability for student journal history if required by the operational workflow.

## Acceptance Criteria
- Student journal submissions match the required structure.
- Validation exists server-side, not only in the browser.
- Admins can review real student submissions, not only static decan content.
