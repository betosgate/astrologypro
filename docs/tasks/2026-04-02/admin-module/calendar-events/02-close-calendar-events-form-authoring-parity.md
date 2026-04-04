# Close Calendar Events Form Authoring Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: form input ergonomics, notification template authoring, time entry UX
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/calendar-events/02-close-calendar-events-form-authoring-parity.md`

## Goal

Bring the Next calendar events form closer to Angular parity for the remaining authoring details that affect admin usability.

## Verified Current Code Truth

- Angular form uses:
  - explicit time-picker style inputs for `start_time` and `end_time`
  - richer editor authoring for `notification_template` when `subscription_availability` is enabled
  - dynamic recurring-day and subscription-template sections
- Next form already supports:
  - the full event field set
  - recurring-day controls
  - conditional notification template field
  - role and quarter multi-select
  - visibility flags
- Next form currently differs mainly in authoring UX:
  - `start_time` and `end_time` are plain text inputs
  - `notification_template` is a plain textarea

## User-Visible Problem

Admins in Next can still enter invalid or inconsistent time text more easily than in Angular and do not get the richer authoring experience Angular uses for notification templates.

## Required Behavior

1. Time entry for `start_time` and `end_time` must be safer and clearer than plain free-text input.
2. `notification_template` authoring should match Angular’s richer editing expectations when subscription availability is enabled.
3. Existing recurring-day, subscription, quarter, role, and visibility logic must keep working.
4. Edit mode must continue to hydrate all event fields correctly after the input upgrade.

## Tasks

1. Replace or constrain plain text time inputs with a more reliable time-entry control or validated time-input pattern.
2. Upgrade `notification_template` from plain textarea to the project-appropriate rich text authoring approach used for admin content.
3. Re-test edit hydration for time, recurring, and subscription-template fields after the input changes.
4. Verify submit payload remains backend-compatible for add and edit.

## Acceptance Criteria

- time entry is more reliable than plain unconstrained text
- notification template uses richer authoring when enabled
- recurring and subscription sections still behave correctly
- add and edit both save successfully with backend-compatible payloads

## Verification Test Plan

1. Open `/admin/calendar-events/add` and enter start/end time using the upgraded control path.
2. Enable subscription availability and verify notification template authoring is usable for formatted content.
3. Create a new event and confirm save succeeds.
4. Reopen the saved event in edit mode and confirm all upgraded fields hydrate correctly.
5. Update the event and verify no regression in recurring-day or visibility behavior.

## Notion Summary

P1 authoring gap: the Next Calendar Events form needs safer time entry and richer notification-template editing to match Angular’s admin authoring workflow more closely.
