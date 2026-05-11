# Mystery School Foundation Training - Completion Gap Task

## Scope - 2026-05-05

This task is only for the Mystery School Foundation Training portion.

Keep out of this task:

- decan dashboards, decan detail pages, rituals, scrying, mundane journals
- final graduation certificate pages
- post-graduation Ritual Builder
- broad enrollment or Stripe checkout work

The only exception is where Foundation completion tracking affects the learner's Foundation progress.

## Answer: Are All 12 Weeks Controlled From Admin Training?

**Not fully guaranteed yet.**

The current Training-backed path is controlled from Admin Training when the `Mystery School Foundation` Training program has active lessons:

- Program source: `training_programs`
- 12 week/category source: `training_categories`
- lesson source: `training_lessons`
- lesson audio source: `training_lessons.audio_url`
- lesson videos/assets/quizzes: `lesson_videos`, `lesson_assets`, quiz tables
- completion source: `lesson_completions` and `category_completions`

Admin editing surfaces:

- `/admin/training/programs`
- `/admin/training/categories`
- `/admin/training/lessons`
- `/admin/training/quizzes`

However, this is only true for Training-backed content. The app still has a legacy Foundation fallback:

- learner fallback API: `/api/mystery-school/foundation`
- legacy task completion API: `/api/mystery-school/foundation/complete-task`
- legacy admin editor: `/admin/mystery-school`
- legacy tables: `mystery_school_foundation_weeks`, `student_foundation_progress`

So the answer is:

- **If `/mystery-school/training` shows lesson rows with `Open`, those rows are coming from Admin Training.**
- **The seed creates the 12 Admin Training week categories, but it does not guarantee all 12 weeks have real lesson content.**
- **If Training has no active lessons, the learner page can still fall back to legacy Foundation weeks/tasks, which means Admin Training is not yet the only source of truth.**

## Answer: Can It Track Training Activity?

**Partially yes.**

The shared lesson viewer used by Mystery School Training already records modern Training activity:

- opening a lesson calls `/api/trainee/training/lessons/[id]/start`
- lesson start writes `lesson_progress.started_at` and `last_active_at`
- heartbeat calls write `lesson_progress.time_spent_seconds`
- heartbeat can write `lesson_progress.last_position_seconds` for resume
- manual completion calls `/api/trainee/training/lessons/[id]/complete`
- completion writes `lesson_completions`
- completing every active lesson in a week/category writes `category_completions`
- quiz and in-video trigger gates can block lesson completion until passed

Main tracking gap:

- Mystery School learner overview reads Training progress correctly when it uses the Training-backed path.
- But Mystery School admin student progress pages still count Foundation progress from `student_foundation_progress`, not from Training completion tables.
- Legacy fallback task completion still writes `student_foundation_progress`, creating two competing progress systems.

Required outcome:

- Foundation learner progress should be tracked from `lesson_progress`, `lesson_completions`, and `category_completions`.
- Admin Mystery School student views should either read the same Training completion source or clearly stop claiming Foundation week completion from the legacy table.

## Compared Against The Product Document

The training-only product document says Foundation Training is:

- 12 weeks
- sequentially unlocked
- weekly audio introductions
- reading/material content
- task/checklist-like work
- progress tracked through completion
- managed by admin

Current implementation match:

- 12 week categories exist in the Training CMS seed.
- Sequential unlock is implemented in `/api/mystery-school/training/foundation`.
- Weekly lessons can include audio through `training_lessons.audio_url`.
- Lesson pages can show audio, content, video, PDF/assets, quizzes, and completion.
- Lesson open flow uses `/mystery-school/training/[categoryId]/[lessonId]`.
- Lesson completion and category completion are tracked in Training tables.

Current implementation mismatch:

- Product text still describes `/api/mystery-school/foundation` and task checklists as the primary Foundation path.
- Code still contains that legacy fallback.
- Admin Mystery School still exposes the old Foundation week/task editor.
- The Training seed creates week categories only, not complete 12-week lesson content.
- Admin Mystery School student progress still reports Foundation weeks from `student_foundation_progress`.
- The learner overview only becomes Admin Training-controlled when active `training_lessons` exist.

## Current Code State

### Done

- `20260504000001_training_lessons_audio_url` exists and is registered.
- `20260504000002_mystery_school_foundation_seed` exists and is registered.
- The seed creates `Mystery School Foundation` plus 12 active week categories.
- Admin Training lessons support `audio_url`.
- `/api/mystery-school/training/foundation` adapts Training CMS data into the Mystery School week-card shape.
- `/mystery-school/training` tries the Training-backed Foundation adapter first.
- `/mystery-school/training/[categoryId]/[lessonId]` uses the shared `LessonViewerClient`.
- The lesson page now fetches lesson data directly from Supabase instead of server-side HTTP self-fetch.
- Mystery School lesson sidebar links can remain under `/mystery-school/training/...`.
- Lesson start, heartbeat, resume position, completion, quiz gates, and category completion use the existing Training activity system.
- Training completion can call the Mystery School Foundation transition helper after all active Foundation lessons are complete.

### Still Not Done

- `/mystery-school/training/page.tsx` still contains legacy fallback code.
- Legacy UI pieces still exist in the active learner page:
  - `LegacyWeekCard`
  - `TaskChecklist`
  - legacy `AudioPlayer`
  - `handleTaskComplete`
- The learner page can still call:
  - `/api/mystery-school/foundation`
  - `/api/mystery-school/foundation/complete-task`
- `/admin/mystery-school` still looks like the Foundation curriculum editor even though Foundation content should now live in Admin Training.
- Admin Mystery School student lists/details still count Foundation progress from `student_foundation_progress`.
- There is no Foundation status screen showing whether all 12 Training categories have active lessons.
- There is no guaranteed starter lesson population for all 12 weeks.

## Required Fixes

### 1. Make Admin Training The Only Normal Foundation Content Source

Update:

- `src/app/mystery-school/training/page.tsx`

Remove the normal learner fallback to legacy Foundation weeks/tasks.

Acceptance:

- Learner page always requests `/api/mystery-school/training/foundation`.
- If the Training program or lessons are missing, show a clear setup/empty state.
- No normal learner render path calls `/api/mystery-school/foundation`.
- No normal learner render path calls `/api/mystery-school/foundation/complete-task`.
- `LegacyWeekCard`, `TaskChecklist`, and `handleTaskComplete` are removed from the active page.

### 2. Keep All Foundation Progress In Training Tables

Training progress source of truth:

- started/in-progress: `lesson_progress`
- lesson complete: `lesson_completions`
- week/category complete: `category_completions`
- program start/time spent: `program_enrollments`

Acceptance:

- Opening a Mystery School lesson creates/updates `lesson_progress`.
- Staying on a lesson accumulates `time_spent_seconds`.
- Completing a lesson writes `lesson_completions`.
- Completing all lessons in a week writes or derives `category_completions`.
- Returning to `/mystery-school/training` reflects completed lessons and completed weeks.

### 3. Update Mystery School Admin Progress To Match Training

Current admin student routes still use `student_foundation_progress`.

Update:

- `src/app/api/admin/mystery-school/students/route.ts`
- `src/app/api/admin/mystery-school/students/[id]/route.ts`
- related Mystery School admin UI labels if they claim "Foundation weeks completed"

Required behavior:

- Foundation progress for the Training-backed path should be derived from the `Mystery School Foundation` program's active categories and lessons.
- Completed weeks should mean completed Training categories or all active lessons completed in that category.
- Legacy `student_foundation_progress` should not be the only source displayed for Foundation progress.

Acceptance:

- A student who completes Admin Training Foundation lessons shows Foundation progress in Mystery School admin.
- Admin counts match the learner overview.
- The UI does not show `0/12` when the learner has completed Training-backed Foundation lessons.

### 4. De-Emphasize Legacy Foundation Editing In `/admin/mystery-school`

Update:

- `src/app/admin/mystery-school/page.tsx`

Required behavior:

- Admin Training should be the visible editing surface for Foundation curriculum.
- `/admin/mystery-school` should not present the legacy week/task editor as the primary Foundation editor.

Recommended minimal fix:

- Replace the legacy Foundation editor section with status/cards linking to:
  - `/admin/training/programs`
  - `/admin/training/categories`
  - `/admin/training/lessons`
  - `/admin/training/quizzes`

Acceptance:

- Admins are directed to Admin Training for Foundation content.
- Legacy Foundation task content is not silently edited as the active curriculum.

### 5. Ensure 12-Week Content Exists

Current seed guarantees:

- one active `Mystery School Foundation` program
- 12 active week categories

Current seed does not guarantee:

- active lesson rows in every week
- real audio/content/video/PDF per lesson

Acceptance:

- All 12 week categories have at least one active `training_lessons` row.
- Week 1 through Week 12 content opens from `/mystery-school/training`.
- Audio, reading content, downloads, and quizzes render when configured by admin.

Possible implementation:

- Admin manually populates lessons in `/admin/training/lessons`.
- Or add an idempotent seed/migration that creates starter Foundation lesson shells from existing legacy Foundation content.

## Immediate Verification Checklist

- Confirm `Mystery School Foundation` exists in `/admin/training/programs`.
- Confirm 12 categories exist in `/admin/training/categories`.
- Confirm every week has active lessons in `/admin/training/lessons`.
- Open `/mystery-school/training`.
- Confirm week cards show Training lesson rows, not legacy task checklists.
- Click `Open`.
- Confirm `/mystery-school/training/[categoryId]/[lessonId]` renders.
- Confirm audio/content/video/PDF/quizzes render when configured.
- Confirm opening the lesson creates `lesson_progress`.
- Confirm time spent and last position update via heartbeat.
- Mark lesson complete.
- Confirm `lesson_completions` updates.
- Complete all lessons in a week.
- Confirm week progress updates from `category_completions` or all lessons complete.
- Confirm Mystery School admin student progress shows the same Foundation progress.

## Out Of Scope

- Decan lifecycle and windows
- Decan journals and rituals
- Decan retry/grace logic
- Final graduation certificate
- Ritual Builder
- Pricing and checkout
