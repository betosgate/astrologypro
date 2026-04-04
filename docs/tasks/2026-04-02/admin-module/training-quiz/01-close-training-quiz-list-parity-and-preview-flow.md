# Close Training Quiz List Parity And Preview Flow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: list actions, quiz preview fetch/render behavior, read-only quiz inspection
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-quiz/01-close-training-quiz-list-parity-and-preview-flow.md`

## Goal

Close the remaining quiz list gap by adding the missing preview flow that exists in Angular.

## Verified Current Code Truth

- Angular quiz list uses `admin/quiz-list` with count from `admin/quiz-list-count`.
- Angular list supports:
  - edit
  - delete
  - status toggle
  - preview
- Angular preview triggers an API call to `admin/quiz-preview` using the selected `_id`.
- Angular preview modal displays:
  - question
  - lesson name
  - priority
  - status
  - all answer choices
  - the correct answer(s)
- Next quiz list already supports edit/delete/status/search/filter, but there is no preview action yet.

## User-Visible Problem

Admins can manage quiz records in Next, but they cannot preview a full quiz question and answer set from the list the way they can in Angular.

## Required Behavior

1. Add a preview action for each quiz row.
2. Preview must fetch selected quiz data using `admin/quiz-preview`.
3. Preview must display all answer choices and clearly indicate the correct answer(s).
4. Preview must remain read-only.
5. Existing list CRUD behavior must remain intact.

## Tasks

1. Extend the quiz list action model to support preview.
2. Implement a read-only quiz preview modal/drawer/page.
3. Fetch preview data from `admin/quiz-preview`.
4. Render answer arrays and correct-answer markers clearly.
5. Handle sparse/invalid preview payloads safely.

## Acceptance Criteria

- quiz list exposes a visible preview action per row
- preview fetches and displays the selected quiz correctly
- preview shows all answers and correct-answer state
- preview is read-only
- list edit/delete/status/search/filter behavior remains intact

## Verification Test Plan

1. Open `/admin/training/quizzes` and confirm list still renders as before.
2. Confirm each row has a preview action in addition to edit/delete/status controls.
3. Open preview for a quiz with multiple answers and verify all answers render.
4. Confirm the correct answer is visually distinguishable.
5. Re-test edit, delete, search, filter, and status toggle after preview support is added.

## Implementation Notes (2026-04-02)

Already implemented before this task was executed. Verification confirmed:
- `quizzes/page.tsx` sets `previewEndpoint: "admin/quiz-preview"` and `previewFields` including the `answers` type.
- `GenericListPage` renders a `PreviewDialog` that fetches `{ _id }` against the endpoint, displays all fields, and uses a dedicated `answers` renderer (green highlight for correct answers, `CheckCircle2` icon).
- Eye icon action per row is present when `previewEndpoint` is configured.
- No changes required. Existing list CRUD (edit / delete / status / search / filter) intact.

## Notion Summary

P1 list parity gap: Angular Training Quiz includes an API-backed Preview action from the list. Next already has the CRUD list, but still needs the preview entrypoint and read-only quiz preview surface.
