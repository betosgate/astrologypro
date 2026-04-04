# Close Class Configuration Dependent Session Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: add/edit form logic, dependent field options, schedule/session UX
- Estimate: 1-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/class-configuration/02-close-class-configuration-dependent-session-parity.md`

## Goal

Bring the Next class configuration form to Angular parity for schedule-driven session selection.

## Verified Current Code Truth

- Angular form exposes:
  - `quater_id`
  - `schedule`
  - `session`
  - `admin_id`
- Angular derives `session` options from the selected `schedule`:
  - `schedule_a` maps to `session_1a`, `session_1b`, `session_1c`
  - `schedule_b` maps to `session_2a`, `session_2b`, `session_2c`
- Angular uses long descriptive labels for those session options.
- Next currently exposes a flat static `SESSION_OPTIONS` list with all six sessions regardless of schedule.
- Next currently uses abbreviated labels like `Session 1A`, `Session 2B`, rather than the fuller Angular labels.

## User-Visible Problem

Admins in Next can select invalid or irrelevant sessions for the chosen schedule and do not get the clearer session descriptions Angular currently provides.

## Required Behavior

1. Session choices must be constrained by the selected schedule.
2. Changing schedule must refresh the allowed session options.
3. Session labels should communicate the intended schedule/time context clearly.
4. The form must not preserve an invalid session when schedule changes.

## Tasks

1. Replace the flat session option list with schedule-derived session options.
2. Use the fuller session labels Angular admins currently see, or an intentionally equivalent label set that preserves the same operational clarity.
3. Clear or revalidate `session` when `schedule` changes and the current selection is no longer valid.
4. Keep quarter and admin dropdown behavior unchanged while introducing the dependent session logic.

## Acceptance Criteria

- selecting `schedule_a` only shows schedule A sessions
- selecting `schedule_b` only shows schedule B sessions
- changing schedule clears or corrects invalid existing session selections
- session labels are operationally clear to admins
- add flow still saves valid quarter, schedule, session, and admin values

## Verification Test Plan

1. Open `/admin/training/classes/add` and choose `schedule_a`; verify only `session_1*` options are available.
2. Change to `schedule_b`; verify only `session_2*` options are available.
3. Select a session, then switch schedule and verify invalid session state is cleared or revalidated.
4. Submit a valid new class configuration and confirm save succeeds.

## Notion Summary

P1 form parity gap: the Next Class Configuration form needs schedule-driven session options so admins cannot choose invalid session values and can see the same schedule-specific context Angular provides.
