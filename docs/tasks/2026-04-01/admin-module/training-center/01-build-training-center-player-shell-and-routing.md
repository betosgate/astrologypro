# Build Training Center Player Shell And Routing - 2026-04-01

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: player shell, route model, deep-link behavior, dual-panel layout, entrypoint from CRUD list
- Estimate: 1-2 days
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/01-build-training-center-player-shell-and-routing.md`

## Goal

Add the real Training Center experience to Next.js so `/admin/training/center` is no longer only CRUD scaffolding and admins can enter the same interactive course-player flow that exists in Angular.

## Verified Current Code Truth

- Angular admin routing sends `training-center` to the shared Training Center module instead of a CRUD page.
- `src/app/astrologer-dashboard/training-center/training-center-routing.module.ts` supports three route states:
  - ``
  - `:training_id`
  - `:training_id/:lesson_id`
- All three Angular route states resolve `training-centre/training-centre-list` before rendering `TrainingMainComponent`.
- `TrainingMainComponent` selects the first training and first lesson by default when route params are absent.
- `TrainingMainComponent` renders a two-column shell made of:
  - `app-training-progress`
  - `app-training-lesson-show`
  - `app-training-category-list`
- The Angular shell uses `ResizeObserver` logic so the shorter column becomes sticky while the taller column scrolls.
- Next currently renders only `GenericListPage` at `/admin/training/center` using:
  - `training-centre/training-centre-list`
  - `training-centre/training-centre-list-count`
  - `training-centre/training-centre-status-change`
  - `training-centre/training-centre-delete`

## User-Visible Problem

Admins can manage Training Center records in Next, but they cannot use the actual lesson-consumption flow that exists in Angular. The migrated route is functionally incomplete because the core module behavior is missing.

## Architecture Decision

Keep the existing CRUD list page, but add a dedicated player route tree and explicit entry action from the list. The player should not be hidden inside generic CRUD components because it has its own navigation model, loading model, and state transitions.

## Required Behavior

1. Add a Training Center player route tree in Next.js.
2. Support these route states:
   - `/admin/training/center/play`
   - `/admin/training/center/play/[trainingId]`
   - `/admin/training/center/play/[trainingId]/[lessonId]`
3. On empty route, load training list and auto-select first available training and first available lesson.
4. On training-only route, load that training and auto-select its first lesson.
5. On deep-link route, open the specific training and lesson.
6. Preserve the existing CRUD list at `/admin/training/center`.
7. Add a row-level `Play` or `Preview` action from the CRUD list into the player route.
8. Build a responsive two-panel player layout with:
   - lesson-detail/content area
   - category/training sidebar
9. Preserve the Angular behavior where the shorter panel becomes sticky on desktop and the layout stacks on smaller screens.

## Tasks

1. Create a player page tree under `src/app/(admin)/admin/training/center/play`.
2. Build a player-shell component that fetches the training list and drives the active training/lesson state.
3. Map route params into selected training and selected lesson state.
4. Add fallback selection logic when params are absent or incomplete.
5. Add list-row entry action from the existing CRUD page.
6. Implement the dual-panel layout and sticky behavior in a maintainable React/Tailwind component structure.
7. Define empty states for:
   - no trainings
   - no lessons in selected training
   - invalid deep-link params

## Acceptance Criteria

- admins can launch a player flow from the existing Training Center list
- `/admin/training/center/play` selects the first available training and lesson
- `/admin/training/center/play/[trainingId]` selects that training and its first lesson
- `/admin/training/center/play/[trainingId]/[lessonId]` opens the requested lesson directly
- the player layout contains a lesson area and a category/training navigation area
- the existing CRUD list/add/edit flows continue to work unchanged

## Verification Test Plan

1. Open `/admin/training/center` and confirm list CRUD still renders.
2. Confirm each row exposes a `Play` or equivalent player entry action.
3. Open `/admin/training/center/play` and verify the first training and first lesson are auto-selected.
4. Open `/admin/training/center/play/[trainingId]` and verify the first lesson of that training is selected.
5. Open `/admin/training/center/play/[trainingId]/[lessonId]` and verify that lesson opens directly.
6. Test with a training record that has no lessons and confirm the UI shows a safe empty state.
7. Resize desktop to mobile width and confirm the layout stacks cleanly without sticky overlap.

## Implementation Notes (2026-04-01)

Already implemented before this review. Full audit confirmed:
- Route tree: `play/page.tsx` (auto-select first training + first lesson), `play/[trainingId]/page.tsx` (auto-select first lesson of training, redirect to deep link), `play/[trainingId]/[lessonId]/page.tsx` (1352-line main player page).
- `training/center/page.tsx`: row-level `Play` button routes to `play/[course._id]`; top-level `Play Training Center` button routes to `play`.
- Two-panel layout: lesson content area (left) + training sidebar (right) with responsive stacking.
- Empty states handled for no-training, no-lessons-in-training, and invalid deep-link params.
- CRUD list/add/edit at `/admin/training/center` preserved unchanged.
- No code changes required.

## Notion Summary

P1 parity gap: Next has Training Center CRUD only, while Angular routes admins into a real interactive player shell with training and lesson deep-link states. Build the player route tree, dual-panel shell, and list-to-player entrypoint.
