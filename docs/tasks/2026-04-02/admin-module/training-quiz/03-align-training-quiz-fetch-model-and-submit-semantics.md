# Align Training Quiz Fetch Model And Submit Semantics - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: edit prefill behavior, lesson option loading, payload normalization, answer-array submit compatibility
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-quiz/03-align-training-quiz-fetch-model-and-submit-semantics.md`

## Goal

Audit and align the quiz module so add/edit flows use stable prefill behavior, complete option loading, and backend-compatible payload shapes.

## Verified Current Code Truth

- Angular edit prepopulation uses a resolver-backed record fetch and hydrates the quiz form before editing.
- Angular lesson options for the quiz form are loaded by posting to `admin/lesson-list` with a large pagination body, not by a bare empty request.
- Next dynamic lesson select currently points to `admin/lesson-list`, but shared dynamic select behavior posts an empty body unless explicitly configured.
- Angular submit normalizes:
  - `status` to `1` or `0`
  - `priority` to integer
  - adds `_id` on edit
  - includes structured `answer` array
- Next generic form currently uses generic transformations and sends `id` on edit by default.
- Quiz submit cannot be considered aligned until scalar fields and answer-array payload structure both match backend expectations.

## User-Visible Problem

Even after building the answer-authoring UI, the quiz module can still fail if edit prefill is incomplete, lesson options are incomplete, or the payload identity/shape differs from backend expectations.

## Required Behavior

1. Edit route must prepopulate reliably from the available quiz record data.
2. Lesson option loading for quizzes must be reliable and sufficiently complete.
3. Submit payload must use backend-compatible identity and answer-array structure.
4. Numeric and boolean fields must be normalized correctly.
5. Add route should not rely on misleading entity fetch behavior.

## Tasks

1. Validate that the current Next edit fetch returns the full functional quiz data needed for prefill.
2. Remove or correct unnecessary add-page fetch behavior.
3. Ensure lesson options are loaded with an appropriate request body and result mapping.
4. Add explicit quiz payload transformation logic if shared generic form behavior is insufficient.
5. Verify `_id` vs `id` expectations for edit submit.
6. Confirm final payload includes the structured `answer` array in backend-compatible shape.

## Acceptance Criteria

- edit route prepopulates correctly from the active fetch flow
- add route does not perform unnecessary entity fetch behavior
- lesson options load reliably for quiz authoring
- submit payload uses correct identity and normalized scalar values
- answer-array payload is backend-compatible
- no hidden data-shape regression remains in the quiz module

## Verification Test Plan

1. Open add quiz page and confirm no unnecessary entity fetch is attempted.
2. Open edit quiz page and confirm existing quiz data loads correctly.
3. Confirm lesson dropdown is populated as expected for quiz authoring.
4. Submit add and edit flows and verify payload key/type correctness.
5. Confirm answer arrays persist and rehydrate correctly after save.
6. Validate status and priority type conversion on both add and edit.

## Implementation Notes (2026-04-02)

Two bugs found and fixed in `quiz-form.tsx`:

**Bug 1 — Status type mismatch**
- `SwitchField` calls `onCheckedChange(boolean)` but the schema declared `status: z.number()`.
- Zod rejected the boolean on submit validation, breaking the toggle path.
- Fix: schema changed to `status: z.boolean()` (default `true`). Edit hydration now uses `quizData.status !== 0`. `onSubmit` normalizes via `status: values.status ? 1 : 0` before building the payload.

**Bug 2 — Incomplete lesson option loading**
- Lesson-list fetch sent `body: JSON.stringify({})`, which may return a default-paginated subset.
- Angular uses an explicit pagination body to retrieve all records.
- Fix: body changed to `{ condition: {}, limit: 200, skip: 0 }`.

All other semantics confirmed correct: add page performs no entity fetch; edit fetch uses `{ _id: quizId }` against `admin/quiz-edit`; submit uses `_id` (not `id`) on edit; answer array is included as structured objects in every payload; `priority` is rounded to integer at submit.

## Notion Summary

P1 integration gap: the Next Training Quiz module needs an explicit prefill and payload audit so add/edit flows remain backend-compatible. Align edit hydration, lesson option loading, identity handling, and answer-array submit structure before considering the quiz module fully migrated.
