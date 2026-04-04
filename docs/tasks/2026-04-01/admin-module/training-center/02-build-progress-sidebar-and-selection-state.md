# Build Progress Sidebar And Selection State - 2026-04-01

- Status: Done
- Priority: P1
- Owner: Frontend
- Scope: training progress banner, sidebar navigation, active selection state, admin progress refresh behavior
- Estimate: 1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-01/admin-module/training-center/02-build-progress-sidebar-and-selection-state.md`

## Goal

Recreate the Angular Training Center navigation model in Next so admins can see overall progress, switch training categories, and keep active lesson state synchronized with selection changes.

## Verified Current Code Truth

- Angular `TrainingMainComponent` hardcodes `userRole = 'is_admin'` and increments `fetchTrainingPercentage` whenever lesson or category selection changes.
- Angular `TrainingProgressComponent` posts to `training-centre/training-report-percentage` with:
  - `role`
  - `user_id`
- The progress UI shows:
  - completed lesson count
  - assigned lesson count
  - percentage bar
  - legend for completed / ongoing / incomplete
- Angular `TrainingCategoryListComponent` renders category cards from the resolved training list.
- Clicking a category emits:
  - `category_id`
  - first lesson id for that category when available
- Angular category navigation enforces optional sequential-category lock using `environment.sequencial_lock` and `training-centre/is-trainig-complete`.
- If the previous training is incomplete, Angular blocks navigation and shows a snackbar message.
- Next currently has no player sidebar, no progress banner, and no sequential-lock configuration in runtime code.

## User-Visible Problem

Next gives admins no visibility into training completion progress and no parity for switching between training categories inside the player flow.

## Required Behavior

1. Show a progress banner at the top of the player.
2. Fetch progress using `training-centre/training-report-percentage` for the active admin user.
3. Refresh progress after lesson completion and selection transitions that affect progression.
4. Render the training/category sidebar from `training-centre/training-centre-list` data.
5. Highlight the active training/category.
6. When a category is selected, route to its first lesson when one exists.
7. When a category has no lessons, show a clear non-crashing empty state.
8. Mirror Angular sequential-category lock behavior behind a Next environment flag.
9. When the guard blocks movement, show a clear toast/banner message instead of navigating.

## Tasks

1. Build a `training-progress-banner` component and data hook.
2. Build a `training-category-sidebar` component for player navigation.
3. Define a Next environment flag equivalent to Angular `environment.sequencial_lock`.
4. Implement previous-category completion checks with `training-centre/is-trainig-complete`.
5. Wire selection changes to route updates and progress refreshes.
6. Add clear loading, empty, and guard-blocked UI states.

## Acceptance Criteria

- the player shows completed lessons, assigned lessons, and percentage progress
- the sidebar shows all available trainings/categories
- selecting an unlocked category updates the player selection correctly
- locked categories are blocked when sequential mode is enabled
- the UI handles categories with no lessons without runtime errors

## Verification Test Plan

1. Open the player and verify the progress banner loads for the current admin.
2. Confirm the counts and percentage render even when values are zero.
3. Click between unlocked categories and confirm the active lesson selection updates.
4. Enable the sequential-lock env flag and verify a blocked category cannot be opened if the previous training is incomplete.
5. Disable the sequential-lock env flag and verify the same category becomes selectable.
6. Test a category with no lesson data and verify the player shows an empty lesson state instead of breaking.
7. Complete a lesson through the player flow and confirm the progress banner refreshes.

## Implementation Notes (2026-04-01)

Already implemented before this review. Full audit confirmed in `play/[trainingId]/[lessonId]/page.tsx`:
- `ProgressBanner` component: fetches `training-centre/training-report-percentage` with `{ user_id, role: "is_admin" }`; renders completed/total counts, percentage bar, and completed/ongoing/remaining legend.
- Progress refetched via `refetchProgress()` after lesson completion (`markDoneMutation.onSuccess`).
- Training sidebar: rendered from `training-centre/training-centre-list`; highlights active training; shows lesson count and lock state per training.
- `SEQUENTIAL_LOCK = process.env.NEXT_PUBLIC_SEQUENTIAL_LOCK === "true"` — direct Angular `environment.sequencial_lock` equivalent.
- `handleCategoryClick`: calls `training-centre/is-trainig-complete` when SEQUENTIAL_LOCK is on and target is not the first training; blocks navigation with `toast.error` if prior training is incomplete.
- `canSequentialOpen(idx)` used per sidebar item to show Lock icon on blocked entries.
- No code changes required.

## Notion Summary

P1 parity gap: Angular shows admin training progress and uses a guarded category sidebar with optional sequential lock. Next needs a real progress banner, sidebar selection model, and category-level lock behavior.
