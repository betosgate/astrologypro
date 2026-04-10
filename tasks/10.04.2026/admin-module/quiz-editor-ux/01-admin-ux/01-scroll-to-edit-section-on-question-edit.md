# 01-Scroll to Edit Section on Question Edit

- Status: Planned
- Date: 2026-04-10

## Objective
Automatically scroll the user's view to the "Edit Question" form section when they click the edit button on an existing question in the quiz editor.

## Why This Task Exists
In long quizzes, the "Add/Edit Question" form can be far from the list of existing questions. When a user clicks "Edit", they shouldn't have to manually scroll back up to find the form that has been populated with the question data.

## Current Repo State
- `TrainingQuizForm` (in `src/components/admin/training-quiz-form.tsx`) handles question editing via `handleEditQuestion(index)`.
- The "Add/Edit Question" section is inside a `Card` component with a title that changes based on `editingIndex`.
- There is currently no `ref` or scroll logic in the `handleEditQuestion` function.

## Exact Gap
1. A way to reference the "Edit Question" section in the DOM (e.g., `useRef`).
2. Logic within `handleEditQuestion` to trigger a scroll event (e.g., `element.scrollIntoView({ behavior: 'smooth' })`).

## Required Implementation
- [ ] Add a `formRef` using `useRef<HTMLDivElement>(null)` in the `TrainingQuizForm` component.
- [ ] Attach this `ref` to the `Card` that contains the "Add/Edit Question" form (line 313).
- [ ] Update `handleEditQuestion` to check if `formRef.current` exists and call `scrollIntoView`.
- [ ] Use `behavior: "smooth"` to ensure a high-quality user experience.
- [ ] Verify that the scroll target is comfortable (e.g., slightly above the card header).

## Files To Read First
- `src/components/admin/training-quiz-form.tsx`

## Likely Files To Change
- `src/components/admin/training-quiz-form.tsx`

## Acceptance Criteria
- Clicking "Edit" on a question scrolls the page smoothly so that the "Edit Question" form is prominently visible.
- The scroll behavior happens immediately after the form is populated with the question data.
- The change does not affect the "Add Question" flow or other parts of the form.

## Verification Test Plan
- [ ] Create a quiz and add several questions until the page is long enough to require scrolling.
- [ ] Scroll down to the bottom of the question list.
* [ ] Click "Edit" on one of the questions.
- [ ] Confirm the page smoothly scrolls up to the "Edit Question" form.
