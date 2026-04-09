# Show Lesson Content Inside Program Workspace Panel And Demote Deep Links

- Status: Planned

## Objective
Refactor the trainee program workspace so lesson content is shown directly inside the lessons panel instead of forcing the learner into deep-linked lesson pages as the primary workflow, while preserving the existing training flow, completion logic, lock rules, and progress tracking.

## Why This Task Exists
The current program workspace stops too early:
- it lists lessons
- it exposes `Start Lesson`, `Resume Lesson`, or `Review lesson` actions
- it then pushes the learner into a deep-linked lesson route for the actual content

That creates an unnecessarily fragmented workflow. The workspace should feel like the main learning surface, not just a directory of outbound buttons.

The requested direction is more standard:
- choose category
- choose lesson
- consume the lesson content in the same workspace context
- keep progression and completion actions nearby

## Current Repo State
- `/trainee/training/[programId]` renders `ProgramWorkspace`.
- `src/components/trainee/program-workspace.tsx` currently shows:
  - category navigation
  - lesson cards
  - CTA buttons linking to `/trainee/training/[programId]/[categoryId]/[lessonId]`
- The full lesson experience currently lives on the deep-linked lesson page:
  - `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
  - `src/components/trainee/lesson-viewer-client.tsx`
- That deep-linked lesson page currently owns:
  - lesson content display
  - video player
  - sidebar lesson nav
  - quiz flow
  - trigger-based video quiz flow
  - mark-complete behavior
  - next-route progression

## Exact Gap
- The workspace is only a launcher, not the actual learning surface.
- Learners must leave the program workspace to see lesson content.
- This makes the experience feel more complex than necessary and reduces continuity between category navigation and lesson consumption.
- The current CTA wording is reasonable, but the underlying behavior is not aligned with the desired simplified visual flow.

## Fixed Behavior Decisions
- The program workspace should become the primary lesson-consumption surface.
- Selecting or opening a lesson in the workspace should reveal lesson content inside the workspace itself.
- Deep-linked lesson routes should not be the primary entry path from the program workspace.
- Keep deep links available only if they are still useful as:
  - refresh-safe route state
  - direct-share support
  - fallback or dedicated full-screen lesson mode
- Preferred aligned approach:
  - keep the existing program workspace shell
  - expand the lesson area into a richer lesson-detail panel
  - load and render the selected lesson’s content in that panel
  - preserve sequential locking, completion rules, resume behavior, and quiz gating

## Required Implementation
- Design a standard in-workspace lesson-reading pattern for `/trainee/training/[programId]`.
- Replace the lesson list’s current “outbound only” behavior with an inline lesson-detail experience inside the lesson pane.
- Decide and document the recommended interaction model, aligned with the proposal:
  - clicking a lesson row opens its content inside the panel
  - CTA may change from route-navigation wording to content-oriented wording where appropriate
  - deep link can become a secondary action rather than the default action
- Preserve the existing learner workflow semantics:
  - lesson start tracking
  - heartbeat tracking
  - completion and category completion
  - quiz progression
  - trigger-based in-video quizzes
  - next-item routing logic
  - sequential lock enforcement
- Prefer reusing the existing lesson viewer/runtime components or extracting shared lesson-detail composition logic rather than duplicating the entire lesson runtime in a second implementation.
- Ensure the workspace remains usable for:
  - not-started lessons
  - in-progress lessons
  - completed lessons
  - locked lessons

## Files To Read First
- `src/app/trainee/training/[programId]/page.tsx`
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/start/route.ts`
- `src/app/api/trainee/training/lessons/[id]/heartbeat/route.ts`
- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`

## Likely Files To Change
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- one or more extracted lesson-detail/viewer composition helpers
- optionally `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx` if it should reuse the same shared composition

## API and Schema Constraints
- Do not break the existing trainee lesson APIs.
- Do not create a second independent lesson-state model for the inline workspace flow.
- Reuse the current lesson runtime, progress APIs, and completion semantics wherever practical.
- If route state is needed for refreshability, prefer URL-backed selection inside the program workspace over abandoning routes entirely.

## Dependencies
- Best executed after the program-workspace layout tasks, since this expands that workspace into the primary lesson surface.
- Otherwise independent from backend data-model changes.

## Acceptance Criteria
- The program workspace can display the selected lesson’s content directly inside the lesson area.
- Learners do not need to leave the workspace just to view lesson content.
- Existing progress, locking, quiz, and completion flows still work correctly.
- The lesson selection model remains clear for new, in-progress, completed, and locked lessons.
- Deep-linked lesson pages are no longer the primary workflow from the workspace.

## Verification Test Plan
- [ ] Open `/trainee/training/[programId]` and confirm a lesson can be opened and consumed inside the workspace.
- [ ] Confirm a not-started lesson begins tracking correctly when opened inline.
- [ ] Confirm heartbeat/resume behavior still updates while consuming lesson content inline.
- [ ] Confirm lesson quizzes and trigger-based video quizzes still behave correctly in the inline workflow.
- [ ] Confirm marking a lesson complete still updates next-lesson/category progression correctly.
- [ ] Confirm locked lessons remain blocked with the same visible messaging.
- [ ] Confirm completed lessons can still be reviewed inline without breaking progress state.

## Out Of Scope
- redesigning the underlying lesson-completion rules
- changing training content data structure
- removing deep-linked lesson routes entirely if they still serve a valid fallback purpose
