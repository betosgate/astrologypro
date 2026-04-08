# Task - Fix Empty Quiz Options in Trainee Portal

- Status: Completed (2026-04-08, verified)
- Completion Notes: normalizeQuizOptions() in src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx:38-41 handles both string[] and {text}[] formats; lesson-viewer-quiz.tsx:40-45 also defends against both shapes.

## Objective
Fix the issue where quiz options appear as empty bubbles in the Trainee Lesson Viewer.

## Analysis
The issue is caused by a data format mismatch in the `options` field of the `quiz_questions` table. The frontend expects an array of objects (`{ text: string }[]`), but the database may contain an array of strings (`string[]`). When the mapping logic in the page component incorrectly casts the array, the UI attempts to access `.text` on a string, resulting in `undefined` and empty boxes.

## Current Repo State
- **Component**: `src/components/trainee/lesson-viewer-quiz.tsx` (renders `{opt.text}`)
- **Page Mapping**: `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx` (incorrectly casts `options`)

## Required Implementation
### 1. Robust Data Mapping
Update the `quizQuestions` mapping in the server-side page component to handle both string and object formats for options.

**File**: `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`

```tsx
// Current
options: Array.isArray(q.options)
  ? (q.options as { text: string }[])
  : [],

// Proposed Fix
options: Array.isArray(q.options)
  ? q.options.map((opt: any) => 
      typeof opt === 'string' ? { text: opt } : opt
    )
  : [],
```

### 2. Component Safety
Ensure the `LessonViewerQuiz` component handles cases where the option might not be in the expected format.

**File**: `src/components/trainee/lesson-viewer-quiz.tsx`

```tsx
// Ensure safe rendering
{typeof opt === 'string' ? opt : opt.text}
```

## Verification Test Plan
- [ ] Find a lesson with a quiz (e.g., using the provided screenshot's question: "Which planet governs love, beauty, harmony, and values?").
- [ ] View the lesson as a trainee.
- [ ] Verify that the options (Venus, Mars, etc.) are visible and selectable.
- [ ] Submit the quiz and verify that validation still works (requires server-side check parity).
