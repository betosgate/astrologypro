# Close Assignment Notification Preview Parity - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list preview, preview dialog content, assignment answer visibility
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/assignment-notification/01-close-assignment-notification-preview-parity.md`

## Goal

Bring the Next assignment notification list to Angular parity for row preview.

## Verified Current Code Truth

- Angular list includes a Preview action.
- Angular preview shows:
  - `added_by_name`
  - `added_by_email`
  - `lesson_title`
  - `createdon_datetime`
  - assignment entries from `answerdata` with each assignment title and answer
- Next list currently renders the main list columns but does not expose preview.
- The shared Next list preview system exists, but this module’s preview content needs to accommodate assignment answer entries rather than only flat scalar fields.

## User-Visible Problem

Admins in Next cannot inspect a trainee’s submitted assignment answers directly from the notification list, which slows review and follow-up.

## Required Behavior

1. `/admin/training/notifications` must expose preview from the list.
2. Preview must show the same practical metadata Angular shows.
3. Preview must show submitted assignment answer entries in a readable format.
4. Preview must be usable without navigating away from the list.

## Tasks

1. Add a preview action to the assignment notification list.
2. Implement preview rendering for the notification metadata fields.
3. Implement preview rendering for `answerdata` entries so each assignment title and answer is readable.
4. Use the most reliable row-data or fetch-backed path available for this module without introducing unnecessary endpoint churn.

## Acceptance Criteria

- preview is available from the notification list
- preview shows added by name, email, lesson, and created datetime
- preview shows assignment answer entries clearly
- preview does not break existing sorting, pagination, or search behavior

## Verification Test Plan

1. Open `/admin/training/notifications` and trigger preview for a row.
2. Verify the preview shows the expected metadata fields.
3. Verify multiple assignment answer entries render clearly when present.
4. Close the preview and confirm the list state remains intact.

## Implementation Notes (2026-04-02)

`GenericListPage` extended with `previewFromRow?: boolean` config option:
- When set, clicking the preview eye-icon stores `row.original` as `previewRowData` instead of making an API call.
- `PreviewDialog` extended with `staticRecord?: Record<string, unknown> | null` prop; when provided, skips the TanStack Query fetch and renders fields directly from the passed data.
- Action-column render condition and preview-dialog mount condition both updated to include `previewFromRow`.

`training/notifications/page.tsx`:
- Added `previewFromRow: true` and `previewFields` with `added_by_name`, `added_by_email`, `lesson_title`, `createdon_datetime` (date type), `answerdata` (answers type).
- No extra API endpoint needed; `answerdata` is already present in the list response rows.

## Notion Summary

P1 review-flow gap: the Next Assignment Notification list needs preview so admins can inspect submitted assignment answers directly from the notification row.
