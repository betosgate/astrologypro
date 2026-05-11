# Mystery School Foundation -> Decan Access Flow

## Scope - 2026-05-06

Complete the Mystery School access flow so Decans are not available until the student has completed the Admin Training-backed Foundation curriculum.

This task focuses on:

- Foundation completion source of truth
- Foundation -> Decans transition
- Decan dashboard access gating
- Decan detail and decan action API gating
- Graduation Foundation count alignment
- Cron behavior for decan lifecycle rows
- Admin student phase/status badge alignment

Keep out of this task:

- Redesigning Foundation lesson UI
- Rebuilding Decan ritual/journal UX
- Enrollment or Stripe checkout changes
- Post-graduation Ritual Builder changes
- Admin Training CRUD/filter improvements unless directly needed for this flow

## Desired Product Behavior

Mystery School has two learner phases:

1. **Foundation phase**
   - Student has `mystery_school_students.training_status = "foundation"`.
   - Student can access `/mystery-school/training`.
   - Student completes the 12 Admin Training-backed Foundation weeks in sequence.
   - Decan dashboard may show an educational locked state, but Decan work must not be available.

2. **Decan phase**
   - After all active Foundation weeks/lessons are complete, the system advances the student to `training_status = "decans"`.
   - Student can access the Decan calendar and time-based Decan work.
   - Decans then follow their normal date lifecycle: preview, active, grace, missed, retry, completed.

Important rule:

- Completing Week 1 should unlock Week 2 in Foundation.
- Completing all 12 Foundation weeks should unlock Decans.
- Decans should not unlock just because the current calendar date is inside a Decan window while the student is still in Foundation.

## Current Code Findings

### Working

- Foundation learner content is mostly backed by Admin Training:
  - `training_programs`
  - `training_categories`
  - `training_lessons`
  - `lesson_completions`
  - `category_completions`
- `/api/mystery-school/training/foundation` adapts the `Mystery School Foundation` program into the Mystery School week-card shape.
- `/mystery-school/training` uses the Training-backed Foundation adapter.
- Lesson completion writes to the shared Training completion tables.
- `maybeAdvanceMysterySchoolToDecans()` exists in `src/lib/mystery-school/foundation-graduation.ts`.
- The normal lesson complete API calls `maybeAdvanceMysterySchoolToDecans()` after a new lesson completion.

### Gaps

1. **Decan dashboard still uses legacy Foundation completion**
   - `src/app/api/mystery-school/decans/route.ts` computes `q1_complete` from `student_foundation_progress`.
   - This is wrong for the Admin Training-backed Foundation path.

2. **Decans are not hard-gated by Foundation completion**
   - `/api/mystery-school/decans` computes Decan status from dates and existing progress.
   - It does not block Decans when `training_status = "foundation"`.
   - `/mystery-school` can show active/preview Decans before Foundation is complete.

3. **Decan detail page is not gated by Foundation completion**
   - `/mystery-school/decans/[id]` loads Decan detail by Decan status.
   - It does not verify that the student has advanced to `training_status = "decans"`.

4. **Decan action APIs may allow work before Foundation completion**
   - Ritual, scrying journal, mundane journal, and ritual-runner actions should verify the student is Decan-eligible server-side.
   - UI-only locking is not enough.

5. **Decan lifecycle cron processes Foundation students**
   - `src/app/api/cron/decan-unlock/route.ts` currently selects students with `training_status in ["foundation", "decans"]`.
   - It should not create/activate Decan progress rows for Foundation students.

6. **Graduation page still counts legacy Foundation progress**
   - `src/app/mystery-school/training/graduation/page.tsx` counts `student_foundation_progress`.
   - Graduation eligibility should use the same Admin Training-backed Foundation completion source.

7. **Trigger-based lesson completion does not advance Mystery School**
   - `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/answer/route.ts` imports `completeLessonAndProgressForUser` but currently does not call it when all triggers pass.
   - The trigger answer route returns `all_triggers_passed: true`, but does not complete the lesson or run `maybeAdvanceMysterySchoolToDecans()`.
   - If any Foundation lesson relies on trigger-only completion, the Foundation -> Decans transition can be missed.

8. **Direct URL access can bypass sequential Foundation unlock**
   - `/mystery-school/training/[categoryId]/[lessonId]` fetches lessons directly and currently does not enforce whether that week is unlocked for the student.
   - The overview locks weeks, but direct URL access should also be protected.

9. **Admin students list can show the wrong phase badge**
   - `/admin/mystery-school/students` can show a `Decans` badge even when the student has not completed all Foundation Training.
   - Example: a student with `6/12` Foundation weeks complete and `0/36` Decans complete should show `Foundation`, not `Decans`.
   - The visible phase badge should be derived from the same Admin Training-backed Foundation completion logic used by the learner flow.
   - If `mystery_school_students.training_status` says `decans` but Foundation is incomplete, the UI should surface the mismatch instead of presenting the student as correctly in the Decan phase.

## Required Result

The final result should make this statement true:

> A Mystery School student cannot perform Decan work until their Admin Training-backed Foundation curriculum is complete and their `mystery_school_students.training_status` has advanced from `foundation` to `decans`.

## Implementation Plan

### 1. Create a shared Foundation progress/eligibility helper

Create or update a helper under `src/lib/mystery-school/`.

Suggested file:

- `src/lib/mystery-school/foundation-progress.ts`

The helper should expose functions similar to:

- `getMysterySchoolFoundationProgram(admin)`
- `getFoundationCompletionForUser(admin, userId)`
- `isFoundationCompleteForUser(admin, userId)`
- `assertMysterySchoolDecanEligible(admin, userId)`

The helper must use Admin Training as the source of truth:

- Find `training_programs.name = "Mystery School Foundation"`.
- Load active `training_categories` for that program.
- Load active `training_lessons` for those categories.
- A week is complete when:
  - `category_completions` has a row for the category and user, OR
  - every active lesson in that category has a `lesson_completions` row for the user.
- Foundation is complete when every active Foundation week/category is complete.

Edge behavior:

- If the program has no active categories, Foundation is not complete.
- If a category has no active lessons, it should not count as complete automatically unless product explicitly wants empty weeks to be complete. Recommended: treat no-lesson weeks as incomplete for access gating.
- Return enough detail for UI/admin displays:
  - total weeks
  - completed weeks
  - total lessons
  - completed lessons
  - missing/no-lesson week list
  - source: `"training"`

### 2. Make Foundation -> Decans transition reliable

Update `src/lib/mystery-school/foundation-graduation.ts` to use the shared helper instead of duplicating Foundation completion logic.

Requirements:

- Keep idempotent update:
  - only update when `training_status = "foundation"`.
- Update to:
  - `training_status = "decans"`
  - optionally set `foundation_completed_at` if that column exists; if not, document a migration need instead of silently inventing a column.
- Return useful skip reasons for logs.

Update all lesson completion paths:

- `src/app/api/trainee/training/lessons/[id]/complete/route.ts`
- Any trigger-based completion path if lesson completion can happen there.

For trigger route:

- If trigger-only lessons are meant to complete automatically after all triggers pass, call `completeLessonAndProgressForUser()` and then `maybeAdvanceMysterySchoolToDecans()`.
- If completion remains manual, ensure the manual `Complete & Continue` path is always available after all triggers pass and calls the normal complete route.

### 3. Gate the Decan dashboard API

Update:

- `src/app/api/mystery-school/decans/route.ts`

Behavior:

- Compute `q1_complete` from Admin Training-backed helper.
- Treat Decan eligibility as:
  - `student.training_status === "decans"` or `student.training_status === "graduated"`, OR
  - Foundation helper says complete and transition helper successfully advances the student.
- If not eligible:
  - return `q1_complete: false`
  - return `student.trainingStatus: "foundation"`
  - return all Decans as locked or return an explicit `decan_access_locked: true` state.
  - do not expose active/grace/current Decan work as actionable.

Recommended response fields:

```json
{
  "decan_access_locked": true,
  "lock_reason": "foundation_incomplete",
  "foundation": {
    "completedWeeks": 3,
    "totalWeeks": 12,
    "completedLessons": 8,
    "totalLessons": 24
  }
}
```

Dashboard UI should use this to show a clear locked message and CTA:

- "Complete Foundation Training to unlock the Decan year."
- Button: "Continue Foundation Training" -> `/mystery-school/training`

### 4. Gate Decan detail and action APIs server-side

Update all Decan detail/action routes to require Decan eligibility:

- `src/app/api/mystery-school/decan/[id]/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/start/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/step/route.ts`
- `src/app/api/mystery-school/decan/[id]/scry/route.ts`
- `src/app/api/mystery-school/decan/[id]/journal/route.ts`

Server response if not eligible:

- HTTP `403`
- JSON:

```json
{
  "error": "Complete Foundation Training before starting Decan work.",
  "code": "foundation_required"
}
```

Update `/mystery-school/decans/[id]` UI to render a friendly locked state for this response.

### 5. Update Decan cron to skip Foundation students

Update:

- `src/app/api/cron/decan-unlock/route.ts`

Change the student query from:

```ts
.in("training_status", ["foundation", "decans"])
```

to:

```ts
.in("training_status", ["decans"])
```

or:

```ts
.in("training_status", ["decans", "graduated"])
```

Recommended:

- Use only `"decans"` unless graduated students still need retry/grace lifecycle updates.
- Do not process `"foundation"` students.

### 6. Align Graduation Foundation count

Update:

- `src/app/mystery-school/training/graduation/page.tsx`
- `src/lib/mystery-school/graduation.ts`
- `src/app/api/cron/graduation-check/route.ts` if it uses `checkGraduationEligibility()`.

Use the shared Admin Training-backed Foundation helper instead of `student_foundation_progress`.

Graduation eligibility should be:

- Foundation complete from Training helper
- 36 Decans completed
- zero unresolved missed Decans

### 7. Enforce direct Foundation lesson URL lock

Update:

- `src/app/mystery-school/training/[categoryId]/[lessonId]/page.tsx`

Before rendering a lesson:

- Verify the lesson belongs to an unlocked Foundation week for this student.
- Week 1 is unlocked.
- Week N is unlocked only when Week N - 1 is complete.
- Already completed lessons can always be reviewed.

If locked:

- Redirect to `/mystery-school/training`, or show a 403-style locked page:
  - "Complete the previous Foundation week first."

### 8. Add tests or verification scripts

### 8. Align Admin Mystery School Students List Badges

Update:

- `src/app/admin/mystery-school/students/page.tsx`
- `src/app/api/admin/mystery-school/students/route.ts`
- any shared admin student progress helper used by that page

Behavior:

- The primary phase badge in `/admin/mystery-school/students` must reflect the real Training-backed phase:
  - Show `Foundation` when Foundation Training is incomplete.
  - Show `Decans` only when Foundation Training is complete and the student has advanced to Decan phase.
  - Show `Graduated` when `training_status = "graduated"` or `graduated_at` is set.
- Do not show `Decans` just because `mystery_school_students.training_status = "decans"` if Admin Training Foundation completion is still below 12/12.
- If DB status and derived progress disagree, expose a clear admin-only warning or secondary badge:
  - `Status mismatch`
  - `DB: Decans · Foundation: 6/12`
- The list summary card `In Decan Year` should count only students who are actually Decan-eligible from the shared helper, not students with stale `training_status = "decans"`.

Recommended derived phase logic:

```ts
if (student.graduated_at || student.training_status === "graduated") {
  phase = "graduated";
} else if (foundationCompletion.isComplete) {
  phase = "decans";
} else {
  phase = "foundation";
}
```

Recommended admin display:

- `Foundation` badge for incomplete Foundation students.
- `Decans` badge only after all Foundation weeks are complete.
- Optional `Active Decan` badge can remain separate and should not replace the phase badge.
- Active subscription status badge (`active`, `cancelled`, etc.) remains separate from the training phase badge.

### 9. Add tests or verification scripts

Add focused tests where the repo supports them. If formal tests are not practical, add a manual verification checklist to the PR/task result.

Minimum scenarios:

1. New Mystery School student in `foundation`
   - `/mystery-school/training` accessible.
   - `/mystery-school` shows Decan locked state.
   - Direct Decan detail URL returns locked/403.
   - Ritual/scry/journal APIs return 403.

2. Foundation partial completion
   - Week 2 unlocks only after Week 1 complete.
   - Decans remain locked.

3. Foundation full completion
   - Completing final active Foundation lesson updates `training_status` to `decans`.
   - `/mystery-school` shows Decan calendar.
   - Current Decan follows date-based lifecycle.

4. Cron behavior
   - Foundation students do not receive Decan preview/active progress rows.
   - Decan students do receive lifecycle rows.

5. Graduation page
   - Foundation count matches `/mystery-school/training`.
   - No legacy `student_foundation_progress` mismatch.

6. Direct URL bypass
   - A student cannot open Week 5 lesson before Week 4 is complete.
   - A completed lesson can be reviewed.

7. Admin student badges
   - A student with 6/12 Foundation weeks complete shows `Foundation`, not `Decans`.
   - A student with 12/12 Foundation weeks complete and `training_status = "decans"` shows `Decans`.
   - A graduated student shows `Graduated`.
   - If `training_status = "decans"` but Foundation is incomplete, admin sees a mismatch indicator.

## Acceptance Criteria

- `/mystery-school/training` remains the only active learning path while the student is in Foundation.
- Completing all active Admin Training-backed Foundation weeks advances the student to `training_status = "decans"`.
- `/mystery-school` does not expose actionable Decan work before Foundation is complete.
- Decan detail, ritual, scry, and journal APIs reject Foundation students with `403`.
- Decan cron does not activate Decans for Foundation students.
- Graduation Foundation requirement uses Admin Training-backed completion, not `student_foundation_progress`.
- Direct Foundation lesson URLs respect sequential week unlock.
- `/admin/mystery-school/students` shows `Foundation` until Admin Training-backed Foundation is complete.
- `/admin/mystery-school/students` shows `Decans` only after Foundation completion/Decan eligibility.
- Admin `In Decan Year` totals use derived Decan eligibility, not stale `training_status` alone.
- Existing completed lessons remain reviewable.
- Legacy Foundation tables can remain in the database, but they must not control the new Foundation -> Decan access flow.

## Notes

- Do not remove legacy APIs/tables in this task unless a separate migration/removal plan is approved.
- Prefer one shared Foundation helper so learner pages, admin pages, graduation, and Decan gating do not drift again.
- Use idempotent updates for `training_status` transitions. A double completion event should not break the student state.
- Keep the user-facing language simple: "Complete Foundation Training to unlock the Decan year."
