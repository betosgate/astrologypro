# Build Training Quiz Answer Authoring Flow - 2026-04-02

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: structured answer editor, add/edit answer interactions, correct-answer validation, quiz authoring UX
- Estimate: 1-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-quiz/02-build-training-quiz-answer-authoring-flow.md`

## Goal

Implement the missing answer-authoring workflow so quiz add/edit in Next can actually create valid quizzes instead of only saving scalar metadata.

## Verified Current Code Truth

- Angular quiz authoring includes these core scalar fields:
  - `question`
  - `lesson_id`
  - `priority`
  - `review_start_time_in_second`
  - `review_end_time_in_second`
  - `status`
- Angular also includes an `answer` external-data field driven by a custom modal flow.
- Angular answer entries are structured objects with:
  - `answer`
  - `correct_answer`
- Angular supports adding and editing answers through `AnswerModal`.
- Angular submit refuses to save when:
  - `answer` array is empty
  - no answer has `correct_answer = true`
- Next quiz form currently has no answer-authoring interface at all.
- Next add/edit pages currently include only scalar fields and explicitly note that answer authoring still needs a bespoke implementation.

## User-Visible Problem

The Next quiz form is not actually capable of authoring a complete quiz because the required answer array is missing from the UI.

## Required Behavior

1. Admins must be able to add multiple answer choices to a quiz.
2. Admins must be able to edit and remove existing answer choices.
3. Each answer must capture answer text and whether it is correct.
4. The form must block submit if there are no answers.
5. The form must block submit if no answer is marked correct.
6. Edit mode must hydrate existing answers so they can be updated safely.

## Tasks

1. Build a bespoke answer-editor component for quiz forms.
2. Add add/edit/remove interactions for answer entries.
3. Store answer rows in a stable client-side array model.
4. Hydrate answer data correctly in edit mode.
5. Enforce validation for minimum answer presence and at least one correct answer.
6. Integrate the answer model into final form submit.

## Acceptance Criteria

- admins can add, edit, and remove quiz answers
- answer rows preserve `answer` and `correct_answer` fields
- edit mode prepopulates existing answer data
- submit is blocked when answer array is empty
- submit is blocked when no answer is marked correct
- valid quizzes can be submitted successfully

## Verification Test Plan

1. Open add quiz form and verify answer-authoring UI is present.
2. Add multiple answers and mark one correct; confirm the form accepts the state.
3. Try submitting with no answers and confirm validation blocks the submit.
4. Try submitting with answers but no correct answer and confirm validation blocks the submit.
5. Open edit quiz and verify existing answer rows are hydrated.
6. Edit one answer, remove another, save, and verify persisted changes reload correctly.

## Implementation Notes (2026-04-02)

Already implemented before this task was executed. Verification confirmed in `quiz-form.tsx`:
- `useFieldArray` manages answer rows with stable client-side IDs.
- Each row has an answer text `Input` and a correct-answer `Checkbox`; the label shows `✓ Correct` when checked.
- "Add Answer" appends `{ answer: "", correct_answer: false }`; remove is disabled when only one row remains.
- Zod schema enforces `answers.min(1)` and `.refine(arr => arr.some(a => a.correct_answer))`.
- Edit mode: `useEffect` on `quizData` calls `reset()` with hydrated answer array; falls back to one empty row when `quizData.answers` is absent.
- No changes required.

## Notion Summary

P1 authoring gap: the Next Training Quiz form still cannot create valid quizzes because answer-array authoring is missing. Build the bespoke answer-editor flow and enforce correct-answer validation before considering quiz authoring migrated.
