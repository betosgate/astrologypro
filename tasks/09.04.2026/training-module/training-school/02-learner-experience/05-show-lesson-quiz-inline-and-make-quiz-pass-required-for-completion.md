# Show Lesson Quiz Inline And Make Quiz Pass Required For Completion

- Status: Planned

## Objective
Fix the trainee lesson experience so quiz questions are visibly rendered within the lesson content flow and learners cannot complete a quiz-gated lesson without successfully passing the quiz.

## Why This Task Exists
The lesson quiz is currently failing at the learner-experience level:
- the learner cannot clearly see the quiz questions
- the quiz does not feel like a first-class part of the lesson content
- completion enforcement must remain strict so learners cannot bypass required quizzes

The intended lesson flow should be straightforward:
- consume the lesson content
- see the quiz in the same lesson experience
- answer it successfully
- only then unlock lesson completion

## Current Repo State
- The trainee lesson runtime is currently built around:
  - `src/components/trainee/lesson-viewer-client.tsx`
  - `src/components/trainee/lesson-viewer-quiz.tsx`
- The lesson page and/or future inline workspace lesson surface load lesson detail from:
  - `src/app/api/trainee/training/lessons/[id]/route.ts`
- Quiz grading uses:
  - `src/app/api/trainee/training/lessons/[id]/quiz/answer/route.ts`
  - `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- Lesson completion button behavior currently depends on:
  - quiz presence/pass state
  - trigger-gated lesson state
  - `canComplete` logic in `lesson-viewer-client`

## Exact Gap
- Quiz questions are not currently visible in the lesson experience in the way the learner expects.
- The quiz needs to appear naturally as part of the lesson content flow, not as a hidden, missing, or secondary fragment.
- Required quiz lessons must remain non-completable until the learner passes the quiz successfully.

## Fixed Behavior Decisions
- For lessons with standard lesson quizzes:
  - the quiz must be visibly rendered inside the lesson experience
  - it should appear as part of the lesson content flow, not as an invisible or disconnected element
- The learner must not be able to complete a quiz-gated lesson unless the quiz has been passed.
- The UI should clearly communicate the gating rule when completion is blocked.
- Trigger-gated in-video quiz lessons should keep their authoritative trigger-based completion path unless this task explicitly needs to improve how those questions are surfaced.
- Prefer fixing the actual lesson runtime and gating logic rather than adding superficial copy.

## Required Implementation
- Trace why quiz questions are not currently visible in the lesson experience.
- Fix the rendering path so standard lesson quiz questions are shown inline within the lesson flow.
- Ensure the quiz appears in a clear position relative to:
  - lesson content
  - video/content assets
  - completion controls
- Verify the lesson completion path remains blocked until quiz success for lessons that have a required quiz.
- Review both the UI gating and the API-backed lesson completion behavior so the learner cannot bypass the requirement through stale or inconsistent client state.
- Preserve the existing stepwise/per-question grading model if that is the intended runtime, unless the root cause requires a different but still compatible rendering path.

## Files To Read First
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/answer/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`

## Likely Files To Change
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/components/trainee/lesson-viewer-quiz.tsx`
- optionally `src/app/api/trainee/training/lessons/[id]/route.ts` if lesson quiz payload shaping is the reason questions are missing
- optionally `src/app/api/trainee/training/lessons/[id]/complete/route.ts` if completion enforcement needs hardening for standard quiz lessons

## API and Schema Constraints
- Do not expose `correct_answer` to the client.
- Reuse the existing trainee quiz endpoints and lesson detail API where possible.
- Do not introduce a second quiz-completion state model.
- Keep trigger-gated lessons and standard lesson quizzes distinct if the system already treats them as separate authoritative paths.

## Dependencies
- Can be executed independently, but should remain compatible with any in-workspace lesson-content task.

## Acceptance Criteria
- A lesson with quiz questions visibly shows those questions within the lesson experience.
- The learner can interact with the quiz without leaving the lesson flow.
- A standard quiz-gated lesson cannot be completed unless the learner has successfully passed the quiz.
- The completion UI clearly reflects the blocked state before quiz success.
- Passing the quiz correctly unlocks lesson completion and preserves existing progression behavior.

## Verification Test Plan
- [ ] Open a lesson with a standard lesson quiz and confirm the quiz questions are visible in the lesson flow.
- [ ] Confirm the learner cannot mark the lesson complete before passing the quiz.
- [ ] Confirm the blocked completion state includes a clear explanation.
- [ ] Confirm passing the quiz unlocks lesson completion and the lesson can then be completed normally.
- [ ] Confirm a lesson without a standard quiz is not incorrectly blocked by this change.
- [ ] Confirm trigger-gated lessons still follow their own completion path correctly.

## Out Of Scope
- redesigning the quiz question content itself
- changing question authoring schema
- changing trigger-based in-video quiz semantics beyond what is necessary for compatibility
