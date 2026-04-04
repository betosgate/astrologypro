# Align Class Configuration Edit Hydration And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit hydration, dependent option rehydration, submit safety
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/class-configuration/03-align-class-configuration-edit-hydration-and-submit-semantics.md`

## Goal

Ensure the Next edit flow remains correct after schedule-dependent session logic is introduced.

## Verified Current Code Truth

- Angular edit fetch uses `quatermanagement/edit_class_data`.
- Angular edit flow repopulates the session option list from the saved `schedule` before the selected `session` is used.
- Next edit flow already fetches the existing record from `quatermanagement/edit_class_data`.
- Next form currently resets scalar values directly, but it does not yet rebuild session options from the fetched schedule because session options are still static.

## User-Visible Problem

Once dependent session logic is added, edit mode can still break if the saved schedule is not used to rebuild the session option set before rendering the saved session value.

## Required Behavior

1. Edit mode must rebuild session options from the fetched schedule.
2. The saved session must remain selected when it is valid for that schedule.
3. The submit payload must keep using the expected keys:
  - `quater_id`
  - `schedule`
  - `session`
  - `admin_id`
  - `id` on edit
4. Add mode must not rely on edit-only assumptions.

## Tasks

1. Build edit hydration so session choices derive from fetched `schedule`.
2. Ensure the saved `session` value stays selected after hydration when valid.
3. Verify edit submit still sends the current record id and expected scalar keys.
4. Re-test add flow after the dependent session logic is added.

## Acceptance Criteria

- edit mode shows the correct schedule-specific session options
- existing valid session values remain selected on edit
- update payload stays backend-compatible
- add flow and edit flow both remain stable

## Verification Test Plan

1. Open `/admin/training/classes/edit/[id]` for a record on `schedule_a` and verify only `session_1*` options are shown.
2. Open a record on `schedule_b` and verify only `session_2*` options are shown.
3. Save an edited class configuration and confirm update succeeds.
4. Reopen the saved record and verify the session value still hydrates correctly.
5. Create a new record after the edit changes and confirm add flow still works.

## Notion Summary

P1 integration gap: the Next Class Configuration edit flow needs dependent session rehydration so saved schedule/session combinations load and persist correctly after the form logic is upgraded.
