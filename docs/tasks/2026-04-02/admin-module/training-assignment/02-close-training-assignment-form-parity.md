# Close Training Assignment Form Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: field parity, lesson option loading, rich description editing, add/edit authoring UX
- Estimate: 0.5-1.5 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-assignment/02-close-training-assignment-form-parity.md`

## Goal

Bring the Training Assignment add/edit form in Next into parity with the Angular assignment form where those fields are active and materially used.

## Verified Current Code Truth

- Angular assignment form includes:
  - `assignment_title`
  - `assignment_lesson`
  - `priority`
  - `assignment_description`
  - `status`
- Angular lesson options are loaded from `admin/fetch-lesson-list` using a POST body.
- Angular description uses a rich editor configuration, not a plain textarea.
- Next assignment form already includes the same core field names.
- Next lesson field uses `DynamicSelectField` against `admin/fetch-lesson-list`, but shared dynamic select currently posts an empty body unless explicitly configured.
- Next description field is currently a plain textarea.

## User-Visible Problem

The Next assignment form exists, but it still simplifies authoring behavior compared with Angular, particularly for lesson option loading semantics and rich description editing.

## Required Behavior

1. Lesson option loading must be reliable and backend-compatible.
2. Description editing must support the intended authoring fidelity if assignment content relies on formatted HTML.
3. Existing required fields and save behavior must continue to work.
4. Edit mode must prepopulate all supported fields correctly.

## Tasks

1. Ensure assignment lesson options are loaded with the correct request body and response mapping.
2. Replace plain textarea description editing with a richer content-authoring field if formatted HTML is required.
3. Confirm add/edit prepopulation works correctly for all in-scope fields.
4. Keep the Next route structure stable even if Angular code has inconsistent cancel-route strings.

## Acceptance Criteria

- lesson dropdown loads reliably for assignment authoring
- description supports the required authoring fidelity
- add and edit forms both prepopulate correctly
- form save still works without regressing existing fields

## Verification Test Plan

1. Open add assignment form and verify all in-scope fields are present.
2. Confirm the lesson dropdown loads valid lesson options.
3. Enter formatted description content and verify it is preserved after save and reload if rich text is implemented.
4. Open edit form and confirm existing assignment data prepopulates correctly.
5. Re-test a simple add/edit flow with minimal required data to ensure no regressions.

## Implementation Notes (2026-04-02)

Already implemented before this task was executed. Verification confirmed in `assignment-form.tsx`:
- All 5 Angular fields present: `assignment_title`, `assignment_lesson`, `priority`, `assignment_description`, `status`.
- `LessonSelect` fetches `admin/fetch-lesson-list` with `{ condition: {}, limit: 200, skip: 0 }` — paginated body matching Angular.
- `assignment_description` uses `RichHtmlEditor` (not a plain textarea).
- `status` uses an inline custom switch (`role="switch"`) that stores boolean and normalizes to `0`/`1` at submit.
- Edit prefill via `useEffect` on `record` correctly resets all fields. Lesson ID round-trips correctly.
- No code changes required.

## Notion Summary

P1 form parity gap: Next Training Assignment form still simplifies Angular authoring behavior. Close the remaining gaps around lesson option loading and rich description editing so assignment authoring matches backend expectations.
