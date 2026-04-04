# Training Quiz Parity Task Index - 2026-04-02

- Module: Admin -> Training -> Quiz
- Angular Source Route: `admin-dashboard/training/quiz`
- Next Route: `/admin/training/quizzes`
- Status: Planned
- Analysis Type: Angular vs Next parity gap review
- Folder Path: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/training-quiz`
- GitHub Folder URL: `https://github.com/debasiskar-devel-007/Divine-infinite-ui-next/tree/main/docs/tasks/2026-04-02/admin-module/training-quiz`

## Scope Of This Review

This folder contains the validated parity tasks for the Admin Training module review of **Quiz**.

The Next quiz module already has list and basic form scaffolding, but quiz authoring is not yet feature-complete because the answer-builder flow is still missing.

## Verified Current Comparison Summary

### Already Implemented In Next

- quiz list route at `/admin/training/quizzes`
- quiz add route at `/admin/training/quizzes/add`
- quiz edit route at `/admin/training/quizzes/edit/[id]`
- list uses `admin/quiz-list` and `admin/quiz-list-count`
- list supports status toggle and delete actions
- list includes question, lesson, priority, status, and created date
- form already includes question, lesson, priority, review start, review end, and active status

### Implemented In Angular But Not Yet Fully Closed In Next

- explicit Preview action on the quiz list using `admin/quiz-preview`
- preview displays answer options and highlights the correct answer set
- quiz edit prepopulation should be validated against the actual returned record shape before treating the current Next flow as parity-complete
- Angular lesson selection loads from `admin/lesson-list` with an explicit large-body fetch, not a minimal generic select request
- Angular quiz authoring includes an answer-builder flow via modal-based add/edit of answer records
- Angular stores quiz answers as structured array entries with `answer` and `correct_answer`
- Angular submit blocks save if:
  - there are no answers
  - no answer is marked correct
- Next currently has no answer-authoring UI at all

## Recommended Execution Order

1. `01-close-training-quiz-list-parity-and-preview-flow.md`
2. `02-build-training-quiz-answer-authoring-flow.md`
3. `03-align-training-quiz-fetch-model-and-submit-semantics.md`

## Source Files Reviewed

### Angular

- `src/app/admin-dashboard/training/quiz/quiz-main/quiz-main.component.ts`
- `src/app/admin-dashboard/training/quiz/quiz-main/quiz-main.component.html`
- `src/app/admin-dashboard/training/quiz/quiz-main/quizcustompreview.html`
- `src/app/admin-dashboard/training/quiz/quiz-add-edit/quiz-add-edit-main/quiz-add-edit-main.component.ts`
- `src/app/admin-dashboard/training/quiz/quiz-add-edit/quiz-add-edit-main/quiz-add-edit-main.component.html`
- `src/app/admin-dashboard/training/quiz/quiz-add-edit/quiz-add-edit-main/answermodal.html`
- `src/app/admin-dashboard/training/quiz/quiz-routing.module.ts`

### Next

- `src/app/(admin)/admin/training/quizzes/page.tsx`
- `src/app/(admin)/admin/training/quizzes/add/page.tsx`
- `src/app/(admin)/admin/training/quizzes/edit/[id]/page.tsx`
- `src/app/(admin)/_components/generic-list-page.tsx`
- `src/app/(admin)/_components/generic-form-page.tsx`
- `src/app/(admin)/_components/form-fields/dynamic-select-field.tsx`

## Notes

- This folder is the canonical task set for this module.
- Quiz authoring should not be considered migrated until structured answer creation and validation are implemented.
