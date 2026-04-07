# Module 02 - Wire Trigger Player Into Trainee Lesson Page

## Objective
Make the trigger-aware video quiz player the real trainee lesson experience where trigger records exist.

## Why This Task Exists
The codebase already contains trigger playback support, but it is not fully connected to the live trainee lesson page. Until that wiring is complete, the intended learner experience is dormant.

## Current Repo State
- The lesson API returns `triggers`.
- `LessonViewerClient` accepts a `triggers` prop and contains a trigger-aware player.
- The main trainee lesson page builds `viewerProps` without passing `lessonData.triggers`.

## Exact Gap
- Trigger playback support exists in component code but is not fully connected to the main trainee lesson page.
- This leaves the legacy lesson quiz flow effectively dominant in the real UI.

## Fixed Behavior Decisions
- If a lesson has trigger records and the active video source supports trigger enforcement, the trainee page must use the trigger-aware playback flow automatically.
- If a lesson has no triggers, the current non-trigger flow remains valid.
- Trigger data must come from the existing lesson-detail payload, not from a new dedicated API call.

## Required Implementation
- Pass trigger data from the lesson API into `LessonViewerClient`.
- Ensure the trigger-aware player is used automatically when:
  - the active lesson has trigger records
  - the selected active video can support trigger enforcement
- Ensure the page still behaves safely when a lesson has:
  - no triggers
  - legacy quiz questions only
  - multiple videos but triggers are intended for only the active playable lesson video
- Update any client props/types necessary so trigger state is fully represented on the page.

## Files To Read First
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/components/trainee/lesson-viewer-client.tsx`

## Likely Files To Change
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- any shared lesson-viewer prop/type definition used by both

## API and Schema Constraints
- Reuse existing `triggers` payload from `/api/trainee/training/lessons/[id]`
- Do not create a new lesson detail API just for triggers

## Dependencies
- Execute after Module 01 or in parallel if there is no overlap

## Acceptance Criteria
- Lessons with trigger records use the trigger-aware playback flow in the real trainee page.
- Lessons without triggers still work normally.
- Trigger overlay, rewind countdown, and seek blocking are visible in the actual UI route.
- Prop and type mapping between the page and the viewer are complete and do not rely on implicit `any`-style assumptions.

## Verification Test Plan
- [ ] Open a lesson with trigger data and confirm the trainee page uses trigger playback.
- [ ] Open a lesson without trigger data and confirm the old non-trigger experience still works.
- [ ] Verify the trainee page receives and uses the `triggers` payload from the lesson API.
- [ ] Confirm the active video-selection path does not silently drop triggers for lessons with multiple videos.

## Out Of Scope
- authoritative completion logic
- certificate flow
