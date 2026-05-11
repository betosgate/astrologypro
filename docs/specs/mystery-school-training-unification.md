# Mystery School Foundation — Admin Training Migration (Phase 1 + 2)

> **Status:** Phase 1 (audit) and Phase 2 (admin setup) shipped 2026-05-04.
> Phase 3 (learner adapter) and Phase 4 (data migration / retire old editor)
> are intentionally deferred — see "What is NOT in this release" below.

Authoritative implementation reference for the work described in
[`docs/tasks/2026-04-30/mystery-school-admin-training-unification.md`](../tasks/2026-04-30/mystery-school-admin-training-unification.md).

The goal of this phase: **stop requiring a parallel Mystery-School-only
content CMS** and let admins author Mystery School Foundation curriculum
through the existing `/admin/training` system, while leaving the learner
experience and existing data untouched until the structure is proven.

---

## What shipped in this release

### 1. `training_lessons.audio_url` (new column)

Migration: `supabase/migrations/20260504000001_training_lessons_audio_url.sql`

```sql
ALTER TABLE training_lessons
  ADD COLUMN IF NOT EXISTS audio_url TEXT;
```

Additive only. Nullable. No data backfill, no constraint, no RLS change.
Every existing read or write that does not mention `audio_url` continues
to work unchanged.

### 2. Admin audio upload pipeline

`POST /api/admin/training/upload` now accepts `kind=audio` in addition to
`video` and `pdf`.

| Property | Value |
|---|---|
| Bucket | `all-frontend-assets` (existing) |
| Storage prefix | `training/audio/` |
| Max size | 50 MB |
| Allowed MIME | `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/x-m4a`, `audio/aac`, `audio/wav`, `audio/x-wav`, `audio/webm`, `audio/ogg`, `audio/flac` |
| Response | `{ url: string }` (same shape as video / PDF) |

Client helper: `uploadTrainingAudio()` in
`src/lib/training/upload-video.ts` — same XHR-with-progress pattern as
`uploadTrainingVideo` and `uploadTrainingPdf`.

### 3. Admin lesson editor — audio section

Both `/admin/training/lessons/new` and `/admin/training/lessons/[id]/edit`
now expose an Audio section with the same URL-vs-Upload toggle pattern as
the PDF section. The selected/uploaded audio renders in an inline
`<audio controls>` preview so the admin can verify it before saving.

### 4. API surface

| Route | Change |
|---|---|
| `POST /api/admin/training/lessons` | Accepts optional `audio_url` (string \| null) |
| `PUT /api/admin/training/lessons/[id]` | Accepts optional `audio_url` (string \| null) |
| `GET /api/admin/training/lessons/[id]` | Returns `audio_url` |
| `GET /api/admin/training/lessons` (list) | Returns `audio_url` |
| `GET /api/trainee/training/lessons/[id]` | Returns `audio_url` |
| `GET /api/trainee/training/programs` | Unchanged — list view does not include audio_url (column not needed for listing) |

### 5. Trainee lesson view — audio rendering

`src/components/trainee/lesson-viewer-client.tsx` now renders an
`<audio controls preload="metadata">` element when `audioUrl` is present,
positioned between the video block and the freeform content block. The
prop is optional (`audioUrl?: string | null`), so existing call sites that
don't pass it continue to compile.

`src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
and `src/components/trainee/program-workspace.tsx` both pass
`audioUrl: lesson.audio_url ?? null`.

---

## What is NOT in this release

These items are part of the same task spec but were intentionally left for
a follow-up to keep the blast radius small and reversible:

- The Mystery School Foundation training program itself is **not auto-seeded**.
  An admin creates it through the existing `/admin/training/programs/new`
  UI when ready (recommended structure documented below).
- `mystery_school_foundation_weeks` and `student_foundation_progress` are
  **untouched**. The custom Mystery School week editor under
  `/admin/mystery-school` and the learner page at `/mystery-school/training/*`
  still read from those tables exactly as before.
- The foundation→decans transition logic in
  `/api/mystery-school/foundation/complete-task/route.ts` is **untouched**.
- No data migration script. No bulk insert of 12 weeks. No learner adapter.

A future Phase 3 will introduce the learner adapter (preferably behind a
feature flag) and Phase 4 will perform the actual data migration once the
structure is proven on a single sample week in production.

---

## Recommended Mystery School Foundation structure (admin-created)

This is the structure admins should create through the existing
`/admin/training` UI. Nothing here is enforced by code — it is the
documented convention so that when the learner adapter ships in Phase 3,
the data is already shaped correctly.

### Program (one)

Created under `/admin/training/programs/new`:

| Field | Value |
|---|---|
| `name` | `Mystery School Foundation` |
| `description` | `12-week Mystery School foundation curriculum.` |
| `is_active` | `true` |
| `is_sequential` | `true` (so weeks unlock in order) |
| `priority` | as appropriate for ordering against other programs |
| `allowed_roles` | `["is_mystery_school"]` |

> **Important:** the `is_mystery_school` slug is the one already recognized
> by `/api/trainee/training/programs` and the Mystery School access layer.
> Reuse it exactly — do NOT introduce a new role slug.

### Categories (twelve — one per week)

Created under `/admin/training/categories/new` with `training_id` set to
the Mystery School Foundation program. Suggested naming preserves the
current Mystery School theming:

| Priority | Category name |
|---|---|
| 1 | `Week 1 — The Awakening` |
| 2 | `Week 2 — The Elements` |
| 3 | `Week 3 — …` |
| … | … |
| 12 | `Week 12 — …` |

Set `is_sequential = true` on each category if lessons within a week
should also be completed in order.

### Lessons (per week)

Each week-category gets one lesson per current checkbox task. Default
3-lesson rhythm:

| Priority | Lesson title pattern |
|---|---|
| 1 | `Week N Lesson 1 — Introduction / Reading` |
| 2 | `Week N Lesson 2 — Practice / Meditation` |
| 3 | `Week N Lesson 3 — Reflection / Integration` |

Each lesson should set, at minimum:

- `title`
- `description`
- `content` (the actual instruction text — not just a label)
- `audio_url` if a meditation or weekly intro audio applies (Lesson 1
  is the typical home for the weekly intro audio carried over from
  `mystery_school_foundation_weeks.audio_url`)
- `video_url` and/or `pdf_url` where applicable
- `priority` matching the order above

> Reflection / journaling lessons should be implemented as a normal
> lesson with the prompt in `content` and manual mark-complete. A
> dedicated journal-storage feature is explicitly out of scope per the
> task spec.

---

## Verification checklist for this phase

- [x] Migration `20260504000001_training_lessons_audio_url.sql` is additive only.
- [x] `POST /api/admin/training/upload` accepts `kind=audio`.
- [x] Admin lesson editor (new + edit) shows Audio section with URL/Upload toggle.
- [x] Uploaded audio plays in the admin editor preview.
- [x] `audio_url` round-trips through POST → GET → PUT on lessons.
- [x] Trainee lesson detail returns `audio_url`.
- [x] Trainee lesson viewer renders an `<audio controls>` element when present.
- [x] No existing Mystery School read or write path changed.
- [x] No existing learner page or sidebar changed.
- [x] No existing trainee program list shape changed.

---

---

# Phase 3 — Learner adapter + foundation→decans transition (shipped 2026-05-04)

> **Status:** Phase 3 partial — the source-of-truth flip and graduation
> trigger are live. Bulk data migration and retiring the old admin editor
> are still deferred to a follow-up.

Implements steps 1, 2, 3, and 6 from
[`docs/tasks/2026-04-30/mystery-school-admin-training-unification-v2.md`](../tasks/2026-04-30/mystery-school-admin-training-unification-v2.md),
with a graceful-fallback design so production keeps working at every
intermediate state (migration not run, migration run but no lessons,
migration run with lessons).

## What shipped in this release

### 1. Seed migration — `Mystery School Foundation` + 12 week-categories

Migration: `supabase/migrations/20260504000002_mystery_school_foundation_seed.sql`

- Creates one `training_programs` row: `name='Mystery School Foundation'`,
  `is_active=true`, `is_sequential=true`, `allowed_roles=['is_mystery_school']`.
- Creates 12 `training_categories` rows: `Week 1` through `Week 12`,
  priorities 1–12, `is_sequential=true`.
- **Lessons are not seeded.** Admins populate them through the existing
  `/admin/training/lessons/new` UI.
- Idempotent: program guarded by `NOT EXISTS` on name; categories guarded
  by `(training_id, priority)`. Re-running is a no-op.
- Surfaced in the in-app runner at `/admin/db/migrations`.

### 2. New adapter route — `/api/mystery-school/training/foundation`

File: `src/app/api/mystery-school/training/foundation/route.ts`

Reads the Mystery School Foundation program out of training tables and
returns it in the same `{ weeks: [...] }` shape the learner page already
understands. Includes per-lesson and per-week completion derived from
`lesson_completions` and `category_completions`. Sequential unlock
mirrors the legacy week-N-requires-week-N-1 rule.

If the program does not exist, the route returns
`{ weeks: [], program_present: false }` (200, not 500). This is the
signal the learner page uses to fall back to the legacy endpoint.

### 3. Learner page now adapter-first with legacy fallback

File: `src/app/mystery-school/training/page.tsx`

Load order on every visit:

1. Call `/api/mystery-school/training/foundation`.
2. If the program is present **and** at least one lesson exists across all
   12 weeks, render the new training-backed week cards (each lesson links
   to the lesson viewer route).
3. Otherwise, fall back to the legacy `/api/mystery-school/foundation`
   endpoint and render the existing checkbox-task UI unchanged.

Net effect: production never goes blank, even immediately after the seed
migration runs. The flip happens lesson-by-week as admins author content.

### 4. Mystery School lesson route — now backed by the shared viewer

File: `src/app/mystery-school/training/[categoryId]/[lessonId]/page.tsx`

Rewritten to fetch the lesson via `/api/trainee/training/lessons/[id]`
and render the shared `LessonViewerClient`. Result:

- `audio_url` plays via the inline `<audio controls>` block.
- Video, content, PDF, quizzes, and triggers all render exactly as in
  the trainee portal.
- Completion goes through the shared `lesson_completions` flow — the same
  POST that triggers category/program cascade and graduation checks.
- Sequential lock is respected — a 403 from the API redirects to
  `/mystery-school/training`.
- Sidebar lists sibling lessons in the same week-category with completed
  state. Next-lesson navigation auto-advances within a week, then sends
  the learner back to the Mystery School overview when the week ends.
- Mystery-School-themed breadcrumb shell wraps the shared viewer so the
  visual identity stays Mystery School, not generic trainee.

### 5. Foundation→decans transition wired into Training completion

New helper: `src/lib/mystery-school/foundation-graduation.ts`

`maybeAdvanceMysterySchoolToDecans(admin, userId, lessonId)` runs on every
lesson completion. It short-circuits cheaply when the lesson is not part
of the Mystery School Foundation program. When it does match, it verifies
that every active lesson in the program is now complete for this user and
that the student is in `training_status='foundation'`, then issues an
idempotent `UPDATE`:

```ts
admin
  .from("mystery_school_students")
  .update({ training_status: "decans" })
  .eq("id", studentRow.id)
  .eq("training_status", "foundation")
```

Called fire-and-forget from
`src/app/api/trainee/training/lessons/[id]/complete/route.ts` after the
existing graduation check. **Additive** — the legacy
`/api/mystery-school/foundation/complete-task` trigger is left in place
and continues to advance status through the old path. Both writes target
the same column with the same idempotent guard, so a double-fire is
harmless.

## What is NOT in this release

- **No bulk data migration** of the 12 existing
  `mystery_school_foundation_weeks` rows or their JSON tasks into real
  lessons. Admins must author lessons through the admin Training UI — or
  this can be a future migration.
- **No retirement** of `/admin/mystery-school` as a content editor. It
  still works exactly as before. Deferred to Phase 4.
- **No removal** of `/api/mystery-school/foundation` or
  `/api/mystery-school/foundation/complete-task`. The learner page falls
  back to them when the new program is empty, and the old admin editor
  still writes to them.
- **No old-progress migration**. Learners who completed weeks under the
  old checkbox system retain that progress only in
  `student_foundation_progress`; it is not yet copied into
  `lesson_completions` / `category_completions` for the new lessons.

## Deploy + activation order

1. Push the Vercel deploy (code change is safe even before any DB change
   because the new adapter falls back gracefully).
2. Run migration `20260504000001_training_lessons_audio_url` from
   `/admin/db/migrations`.
3. Run migration `20260504000002_mystery_school_foundation_seed` from
   `/admin/db/migrations`.
4. (Visible change happens here:) Author the first lesson under any week
   category in `/admin/training/lessons/new`. The learner page will start
   serving training-backed week cards as soon as at least one lesson
   exists across the program.

Steps 1–3 produce **zero visible change** for learners — the page keeps
showing the legacy checkbox UI. The flip happens at step 4 when content
is real.

## Future phases

| Phase | Scope |
|---|---|
| 4a | Data migration script — copy 12 weeks + per-week audio + tasks-as-lessons into the Mystery School Foundation program. |
| 4b | Old-progress preservation — map completed-week rows in `student_foundation_progress` to `lesson_completions` / `category_completions` for the corresponding new lessons. |
| 4c | Retire `/admin/mystery-school` foundation editor as primary content source (read-only or remove). |
| 4d | Remove or read-only the legacy `/api/mystery-school/foundation*` endpoints once the learner page no longer falls back to them. |
