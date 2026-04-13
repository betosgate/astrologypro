# Training School Quiz Editor UX - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Improve the training quiz editor experience by adding automatic scrolling to the "Edit Question" section when an administrator clicks to edit a question.

## Canonical Folder
- Repo path: `tasks/10.04.2026/admin-module/quiz-editor-ux`

## Why This Pack Exists
The current quiz editor can grow quite long as questions are added. When an admin scrolls down to the list of questions and clicks the "Edit" button, the edit form remains at the top of the "Add/Edit Question" section, which might be out of view. Automatically scrolling to this section improves the flow and clarity of the editing process.

## Requested Change Set
1. Implement automatic scrolling in `TrainingQuizForm` component when `handleEditQuestion` is triggered.
2. Use a `ref` to target the "Add/Edit Question" card or header.
3. Ensure smooth scrolling behavior for a premium feel.

## Execution Order
1. `01-admin-ux/01-scroll-to-edit-section-on-question-edit.md`

## Done Definition
- Clicking "Edit" on any question in the quiz question list scrolls the user's view smoothly to the "Edit Question" form.
- The scroll target is accurately positioned to show the start of the form.
- The behavior works across both New and Edit quiz flows (as they share the same form component).
