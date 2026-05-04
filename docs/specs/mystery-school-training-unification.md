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

## Future phases

| Phase | Scope |
|---|---|
| 3 | Mystery School learner adapter — `/mystery-school/training/*` reads from training tables instead of `mystery_school_foundation_weeks`. Recommend feature flag default-off. |
| 4a | Data migration script — copy 12 weeks + per-week audio + tasks-as-lessons into the Mystery School Foundation program. |
| 4b | Move foundation→decans transition trigger from `complete-task` to lesson/category/program completion events. |
| 4c | Retire `/admin/mystery-school` foundation editor as primary content source (read-only or remove). |
