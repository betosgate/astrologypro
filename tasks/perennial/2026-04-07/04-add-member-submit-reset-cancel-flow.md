# Wire Add Member Submit, Reset, And Cancel Flow - 2026-04-07

- Status: Planned
- Priority: P1
- Owner: Fullstack
- Scope: form submission, reset behavior, cancel redirect, success handling, dashboard return path
- Estimate: 0.5-1 day
- Task File: `tasks/perennial/2026-04-07/04-add-member-submit-reset-cancel-flow.md`

## Goal

Complete the member-creation interaction so submit creates the member through the new API, reset clears the form, and cancel returns the user to the dashboard.

## Verified Current Code Truth

- Existing lightweight member flows already submit to smaller APIs.
- The requested dedicated legacy-style form and expanded payload flow do not yet exist.
- The requested action behavior for `Submit`, `Reset`, and `Cancel` is not yet fully implemented for the new full-screen flow.

## Required Behavior

1. `Submit` must call the new create-member API.
2. Successful submit must create the member and transition the user to the intended post-create state.
3. `Reset` must restore the form to its default values.
4. `Cancel` must redirect the user to the dashboard.
5. Errors must be surfaced clearly without losing entered values unless reset is intentionally used.

## Tasks

1. Connect the dedicated form screen to the new create-member API.
2. Add loading, success, and error handling around submit.
3. Implement full-form reset behavior.
4. Implement cancel redirect back to the dashboard.
5. Confirm the dashboard reflects the new member-creation entry and post-submit behavior cleanly.

## Acceptance Criteria

- submit triggers the create-member API
- successful submit creates the member
- reset clears the form
- cancel returns to dashboard
- validation or API errors are shown clearly

## Verification Test Plan

1. Fill the form and click submit; verify the API is called and the member is created.
2. Enter partial values and click reset; verify the form returns to defaults.
3. Enter partial values and click cancel; verify redirect to dashboard.
4. Trigger an invalid submission and verify errors display without destroying entered state.

## Notion Summary

P1 create-flow gap: the new Perennial add-member screen needs final submit, reset, and cancel wiring so the experience behaves like a complete member-creation journey instead of only a static form.
