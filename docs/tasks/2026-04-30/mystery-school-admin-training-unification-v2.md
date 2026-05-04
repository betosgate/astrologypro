# Mystery School Training Should Be Managed From Admin Training Programs And Lessons

## Current Implementation Status - 2026-05-04

This task is **partially implemented, not complete**.

The targeted lesson audio work is mostly done, but the core source-of-truth migration is still incomplete. The visible Mystery School Foundation learner flow and the old admin Mystery School editor still depend on the legacy week/task tables.

### Completed

- `training_lessons.audio_url` migration exists:
  - `supabase/migrations/20260504000001_training_lessons_audio_url.sql`
  - `src/data/migrations/20260504000001_training_lessons_audio_url.ts`
  - allowlist entry in `src/lib/db/migrations.ts`
- `/admin/db/migrations` now surfaces newest migrations first, so `20260504000001_training_lessons_audio_url` is visible at the top.
- Admin lesson create/edit supports first-class lesson audio:
  - direct audio URL
  - audio upload
  - upload progress
  - audio preview
- Admin lesson APIs read/write `audio_url`.
- Trainee training lesson API reads `audio_url`.
- Shared trainee lesson viewer renders lesson audio.
- Training access already recognizes Mystery School users through `is_mystery_school`.

### Partially Done

- Training-backed Mystery School nested pages exist:
  - `/mystery-school/training/[categoryId]`
  - `/mystery-school/training/[categoryId]/[lessonId]`
- These pages read from `training_categories` and `training_lessons`.
- However, they are not yet the primary learner entry flow and are not fully wired to the shared lesson completion/progress model.

### Not Done / Remaining Gaps

- `/mystery-school/training` still loads `/api/mystery-school/foundation`.
- `/api/mystery-school/foundation` still reads:
  - `mystery_school_foundation_weeks`
  - `student_foundation_progress`
- `/mystery-school/training` still renders:
  - `FoundationWeek`
  - old week cards
  - JSON `tasks`
  - checkbox completion
- `/api/mystery-school/foundation/complete-task` still marks legacy JSON tasks complete.
- The old `complete-task` endpoint still advances `mystery_school_students.training_status` from `foundation` to `decans` when week 12 completes.
- `/admin/mystery-school` is still an editable content/task checklist editor, so it remains a competing content source.
- The Training-backed Mystery School lesson page does not currently select or render `audio_url`.
- The Training-backed Mystery School lesson page does not use the shared lesson completion button/progress flow.
- There is no current migration that maps all 12 old foundation weeks and JSON tasks into:
  - one `Mystery School Foundation` training program
  - one training category per week
  - one or more real training lessons per old task
- There is no explicit old progress migration strategy implemented.
- There is no implemented Training-model-based `foundation -> decans` transition.

### Decision After Audit

The task should now be completed by finishing the source-of-truth migration, not by adding more functionality to the old week/task system.

Use this final target:

- Admin content source of truth: `training_programs`, `training_categories`, `training_lessons`, `training_quizzes`
- Mystery School learner shell: keep the week-themed `/mystery-school/training` experience
- Week source: `training_categories`
- Completable learning units: `training_lessons`
- Completion source: `lesson_completions`, `category_completions`, `user_category_progress`, `user_program_progress`
- Old foundation tables: migration input and temporary fallback only

## Completion Plan From Current State

The remaining implementation should be completed in this order.

### 1. Finish the Training-backed learner adapter

Update `/mystery-school/training` so it no longer calls `/api/mystery-school/foundation`.

It should load the Mystery School Foundation program from the Training hierarchy. The adapter should derive:

- week number from category priority or `Week N` title
- week title from `training_categories.name`
- week description from `training_categories.description`
- week completion from category completion state
- progress from completed lessons / total lessons
- lesson rows from `training_lessons`
- locked/unlocked state from the existing Training sequential logic

Required files to update or replace:

- `src/app/mystery-school/training/page.tsx`
- likely a new route/helper for Mystery School training hierarchy, or reuse `/api/trainee/training/programs`

Acceptance for this step:

- `/mystery-school/training` displays week cards backed by Training categories.
- Old JSON tasks are no longer rendered as the primary learning units.
- Each week card links to real lessons.

### 2. Replace checkbox completion with lesson completion

Remove the old checkbox task completion behavior from the learner path.

Use the existing lesson completion flow:

- `POST /api/trainee/training/lessons/[id]/start`
- `POST /api/trainee/training/lessons/[id]/heartbeat`
- `POST /api/trainee/training/lessons/[id]/complete`
- `lesson_completions`
- `category_completions`

Acceptance for this step:

- Completing all lessons in a category completes the week.
- Completing all week categories completes the foundation program.
- The learner does not complete foundation by checking JSON task rows.

### 3. Upgrade the Mystery School lesson page or reuse the shared lesson viewer

The current `/mystery-school/training/[categoryId]/[lessonId]` page is too thin.

Choose one:

- preferred: wrap/reuse the shared `LessonViewerClient` and trainee lesson API behavior in the Mystery School shell
- acceptable: redirect Mystery School lesson links to the existing shared lesson viewer if the UX remains acceptable

Must support:

- `audio_url`
- content
- video
- PDF
- quizzes
- completion CTA
- locked lesson protection
- completed state
- next lesson / next week navigation

Acceptance for this step:

- Lesson audio uploaded from admin Training plays in the Mystery School learner lesson.
- Learners can complete a Mystery School lesson through the Training completion model.

### 4. Seed or migrate the Mystery School Foundation program structure

Create or repair a migration that ensures the final structure exists.

Required structure:

- Program: `Mystery School Foundation`
- Program settings:
  - `is_active = true`
  - `is_sequential = true`
  - `allowed_roles = ARRAY['is_mystery_school']`
- 12 categories:
  - one per foundation week
  - priorities 1 through 12
  - active
  - sequential if week lesson order should be enforced
- lessons:
  - each old JSON task becomes a real lesson
  - minimum pattern per week:
    - intro / reading
    - practice / meditation
    - reflection / integration

Audio mapping:

- old `mystery_school_foundation_weeks.audio_url` maps to `training_lessons.audio_url`
- default target: first lesson in that week category

Acceptance for this step:

- The new program is not empty.
- Every old week has a corresponding category.
- Every old task has a meaningful lesson replacement.
- Old weekly audio is preserved on the appropriate lesson.

### 5. Preserve or explicitly reset old progress

Choose and document one rollout path before migration:

- preserve existing progress by mapping completed weeks to category/lesson completions
- or reset only known test/dev data

Recommended unless production is confirmed empty:

- preserve completed weeks
- if a legacy week is complete, mark every mapped lesson in that category complete for that learner
- ensure `category_completions` exists for fully completed mapped weeks

Acceptance for this step:

- The chosen progress strategy is documented in this file.
- A migration or admin-only repair script implements that strategy.

### 6. Preserve `foundation -> decans` transition through Training completion

Remove the old dependency on `student_foundation_progress.week_completed_at` as the authoritative trigger.

Add a Mystery School-specific completion rule:

- when the `Mystery School Foundation` training program is fully complete
- and the student is currently `training_status = 'foundation'`
- update `mystery_school_students.training_status` to `decans`

Do not use the generic trainee graduation helper as-is for this transition. The current generic helper updates `trainees.training_status` to `graduated`, which is not the Mystery School foundation-to-decans domain state.

Acceptance for this step:

- Completing the final foundation lesson/category advances Mystery School status to `decans`.
- This works without calling `/api/mystery-school/foundation/complete-task`.
- The implementation location is documented in this file.

### 7. Retire old admin Mystery School foundation editing

After Training-backed content is live:

- stop presenting `/admin/mystery-school` as the main foundation content editor
- convert it to a progress/migration monitor, or add clear links to Admin Training and make legacy fields read-only

Acceptance for this step:

- Admins edit Mystery School Foundation curriculum from Admin Training.
- The old page cannot silently create a second source of truth.

### 8. Keep old APIs only as temporary fallback

These routes should not remain the main learner path:

- `/api/mystery-school/foundation`
- `/api/mystery-school/foundation/complete-task`
- `/api/admin/mystery-school/foundation`
- `/api/admin/mystery-school/foundation/[id]`

After migration, either:

- remove them,
- gate them behind a migration/debug flag,
- or keep them readonly for audit only.

## Purpose

Move Mystery School training management into the existing admin Training system so admins control Mystery School curriculum from the same place they already manage programs, categories, lessons, and quizzes.

The goal is to stop maintaining a separate custom Mystery School week/task editor and instead make Mystery School training content fully manageable through:

- `/admin/training/programs`
- `/admin/training/categories`
- `/admin/training/lessons`
- `/admin/training/quizzes`

This task should also replace the current lightweight checkbox-only week tasks with proper, functional lesson content that learners can actually open, read, watch, complete, and track.

## Current State Analysis

### 1. Admin Training system already exists and is full-featured

The existing admin Training module already supports:

- training programs
- training categories
- training lessons
- lesson content
- video URLs
- PDF URLs
- rich text/content fields
- quizzes
- learner progress caches
- sequential progression settings

Current limitation to address in this task:

- training lessons do not yet support first-class audio upload

Relevant code:

- `src/app/admin/training/page.tsx`
- `src/app/api/admin/training/programs/route.ts`
- `src/app/api/admin/training/categories/*`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/quizzes/*`
- `src/app/api/trainee/training/programs/route.ts`

### 2. Mystery School foundation weeks currently use a separate custom system

Mystery School foundation is currently controlled by:

- `mystery_school_foundation_weeks`
- `student_foundation_progress`
- `/admin/mystery-school`
- `/api/mystery-school/foundation`
- `/api/mystery-school/foundation/complete-task`

This custom system stores:

- week title
- week description
- week audio
- Beto image
- a JSON `tasks` array

### 3. The current Mystery School tasks are not proper training content

Today the visible per-week tasks are only checklist items inside a JSON array.

That means they:

- are not real lessons
- do not open a dedicated learning page
- do not have proper lesson content structure
- do not support quiz completion
- do not use the existing admin Training analytics/progress model
- are difficult to scale and maintain

This is the gap to fix.

## Desired Outcome

Mystery School training should be managed from the normal admin Training system.

Admins should be able to build and edit Mystery School curriculum by creating:

- one Mystery School program
- one category per week
- one or more real lessons inside each week/category
- optional quizzes where needed

Learners in Mystery School should consume that content through a proper lesson-driven training flow, not only checkbox tasks.

The weekly flow can still exist visually, but the underlying source of truth should be the admin Training module.

## Product Direction

### Source of truth

Use `training_programs`, `training_categories`, `training_lessons`, and `training_quizzes` as the main curriculum source of truth for Mystery School training content.

### Weekly UX

It is acceptable to keep the learner-facing Mystery School page grouped by Week 1 through Week 12, but each week should be backed by real training entities instead of a custom JSON task list.

### Proper functional tasks

The current three checkbox items in a week should be replaced by actual content units.

Example:

- current: `Read the Week 1 introduction material`
- replace with: a real lesson like `Week 1 Lesson 1 - Introduction to the Mystery Path`

- current: `Complete the opening meditation exercise`
- replace with: a real lesson with audio/video/text instructions and completion tracking

- current: `Journal reflection - Why I am here`
- replace with: either
  - a real lesson with journaling instructions and completion action, or
  - a new structured assignment/journal component if the product truly needs written submission

Default recommendation:

- implement these as real lessons first
- only introduce a dedicated journal submission system if the team truly needs saved learner answers

## Recommended Content Model

### Chosen Model: One program, one category per week, many lessons per category

Recommended structure:

- Program: `Mystery School Foundation`
- Category 1: `Week 1 - The Awakening`
- Category 2: `Week 2 - The Elements`
- ...
- Category 12: `Week 12 - ...`

Inside each category:

- Lesson 1: weekly intro
- Lesson 2: meditation / practice
- Lesson 3: reflection / integration

This is the chosen approach because it maps cleanly to the existing Training architecture and gives better progress tracking, lesson analytics, and content management than the old checkbox-task model.

## What Must Change

## 1. Curriculum ownership

Mystery School content must move away from `/admin/mystery-school` as the primary content editor.

Admins should instead manage curriculum from:

- `/admin/training/programs`
- `/admin/training/categories`
- `/admin/training/lessons`
- `/admin/training/quizzes`

The old `/admin/mystery-school` page can later become:

- a progress dashboard only, or
- a migration helper page, or
- be removed after migration

## 2. Role access

The Mystery School program should be restricted using the existing program role access model.

Use the existing `allowed_roles` flow so the Mystery School program is only visible to Mystery School learners.

Based on the current training access layer, the implementation must use the same role slug already recognized by `/api/trainee/training/programs`. At the time of writing, that route grants Mystery School access through:

- `is_mystery_school`

This must be reused consistently in:

- `training_programs.allowed_roles`
- Mystery School learner content loading
- any migration scripts or seed data

## 3. Learner rendering

The learner-facing Mystery School training page should load from the admin Training hierarchy instead of from `mystery_school_foundation_weeks`.

If the UI still shows weeks, it should derive those week groups from categories and lessons rather than a custom week table.

## 4. Progress tracking

Week completion should no longer depend only on a JSON checklist.

Instead:

- lesson completion should drive progress
- category completion should represent week completion
- program completion should represent foundation completion

If Week 12 completion currently advances `training_status` from `foundation` to `decans`, the new system must preserve that behavior using lesson/category/program completion events.

## 5. Proper content for each current checkbox task

Each current checkbox task needs a content-backed replacement.

At minimum, every learner-completable item must have:

- title
- description
- main content or instructions
- optional video/audio/PDF
- completion behavior

The task must not remain a bare checkbox with no real material behind it.

## Step-By-Step Implementation Plan

## Phase 1 - Audit and mapping

### Step 1. Inventory current Mystery School foundation data

Document all existing rows in:

- `mystery_school_foundation_weeks`

Capture for each week:

- week number
- title
- description
- audio URL
- Beto photo URL
- tasks array
- publish state

### Step 2. Audit the existing admin Training schema

Confirm exact fields and relationships for:

- `training_programs`
- `training_categories`
- `training_lessons`
- `training_quizzes`
- `lesson_completions`
- `user_program_progress`
- `user_category_progress`

Document how Mystery School will fit without breaking trainee/diviner flows.

Also confirm the current media limitations in lesson management:

- lesson create/edit currently supports video and PDF flows
- audio upload support is not currently available as a first-class lesson feature

### Step 3. Finalize the exact week mapping

Pick the final content shape:

- chosen: one category per week, multiple lessons per category

Document how each current checkbox task maps into a lesson or assignment.

This task is no longer evaluating multiple structural options. The implementation must follow:

- Program -> `Mystery School Foundation`
- Category -> one foundation week
- Lesson -> one meaningful content unit within that week

## Phase 2 - Data model and admin setup

### Step 4. Create a dedicated Mystery School Foundation training program

Create one training program for Mystery School foundation inside the existing Training system.

Suggested name:

- `Mystery School Foundation`

Set:

- correct role access using `is_mystery_school`
- correct priority
- sequential behavior if required

Suggested settings:

- `name`: `Mystery School Foundation`
- `is_active`: `true`
- `is_sequential`: `true` if the learner should progress in order
- `allowed_roles`: `["is_mystery_school"]`

Important:

- do not redesign the admin Training UI for this
- use the existing `/admin/training/programs` create/edit flow unless a very small field addition is truly required

### Step 5. Create 12 categories that represent the 12 foundation weeks

Each category should map to one week.

Suggested pattern:

- `Week 1 - The Awakening`
- `Week 2 - The Elements`
- ...

Required category rules:

- category priority must match week order
- category 1 = week 1, category 2 = week 2, and so on
- if sequential locking is enabled, week/category unlock must follow the existing training system rather than custom Mystery School logic where possible

The category becomes the canonical representation of a week.

### Step 6. Replace checkbox tasks with proper lessons

For each week, convert each existing checkbox item into a real lesson.

Every lesson should contain proper material using existing admin lesson fields:

- `title`
- `description`
- `content`
- `video_url` and/or `pdf_url` where appropriate
- `duration_mins`

The implementation should reuse the existing lesson editor and lesson schema first.

Current lesson capabilities already support:

- title
- description
- main content
- video URL
- PDF URL
- duration

That means admin Training should remain mostly unchanged for content management, except for the explicit audio requirement below.

Audio requirement for this task:

- admin must be able to upload an audio file directly in the lesson create/edit flow
- lessons must support storing a dedicated uploaded audio asset
- the learner-facing lesson experience must render that audio cleanly

Required implementation direction:

- add first-class audio support to training lessons
- do not treat audio as a pasted workaround hidden inside lesson content
- do not require admins to upload audio elsewhere first and paste a URL manually unless the upload pipeline itself produces that URL during the lesson flow

Recommended implementation:

- add `audio_url` to `training_lessons`
- support audio file upload in admin lesson create/edit pages
- support existing direct audio URL entry if useful, but upload support is required
- render the uploaded audio in the learner lesson view

Recommendation:

- extend lessons with a proper audio field
- prefer a minimal extension rather than a Training module redesign

Instruction from the latest product decision:

- admin Training should remain largely as it is
- only small, targeted changes are acceptable
- likely changes, if needed, are integration-level changes such as:
  - lesson audio upload support
  - week/category metadata handling
  - Mystery School learner-page adapter logic

### Step 6A. Define the week-to-lesson conversion pattern

Each old checkbox task must become a real lesson.

Minimum recommended pattern for each week:

- Lesson 1: introduction / reading
- Lesson 2: practice / meditation
- Lesson 3: reflection / integration

Example conversion:

- old task: `Read the Week 1 introduction material`
- new lesson: `Week 1 Lesson 1 - Introduction to the Mystery Path`

- old task: `Complete the opening meditation exercise`
- new lesson: `Week 1 Lesson 2 - Opening Meditation Practice`

- old task: `Journal reflection - Why I am here`
- new lesson: `Week 1 Lesson 3 - Reflection: Why I Am Here`

Audio placement rule:

- if a week currently has a weekly introduction audio, attach that audio to Lesson 1 of the corresponding week category unless a stronger content-specific mapping is needed

### Step 6B. Define what "proper and functional" means for each lesson

Each converted lesson must have enough material that a learner can actually complete it meaningfully.

At minimum every lesson should include:

- a clear learner-facing title
- a short description
- actual body content or instructions
- optional supporting media
- a completion path that uses the existing lesson completion model

For Mystery School lessons that rely on audio, "proper and functional" also means:

- admin can upload the audio in the lesson editor
- learner can play the audio in the lesson experience
- the audio is persisted as part of the lesson data model

Do not migrate an old checkbox into an empty lesson shell with no usable content.

### Step 6C. Handle reflection/journal lessons deliberately

Reflection tasks are not as simple as reading tasks.

The first release should implement them as:

- a proper lesson with reflection instructions and manual completion

If later the product needs students' written responses to be stored, that should be a second-phase enhancement. It should not block the initial migration away from checkbox-only tasks.

### Step 7. Add quizzes only where truly needed

If a week requires knowledge checks, attach quizzes to the relevant lessons using the existing quiz system.

Do not create empty quizzes just to mirror old checkboxes.

## Phase 3 - Learner experience migration

### Step 8. Build a Mystery School learner adapter over the training hierarchy

Update the Mystery School learner page so it reads from the Training CMS source instead of `mystery_school_foundation_weeks`.

The UI may still present:

- Week cards
- locked/unlocked states
- progress bars
- completed week indicators

But these should be derived from:

- categories as weeks
- lessons as week content units
- lesson/category completion state

Important instruction from the latest product decision:

- keep the Mystery School week-themed learner shell
- do not force learners into a generic trainee-only layout if that weakens the Mystery School experience
- use the training hierarchy as the content source of truth underneath that shell

This means:

- admin content ownership moves to admin Training
- learner UX can still look like a 12-week Mystery School journey

### Step 9. Preserve sequential unlock behavior

The learner should not access Week N until Week N-1 is complete if that rule still applies.

Use existing sequential training behavior where possible instead of re-implementing a custom unlock engine.

Implementation note:

- first try to use existing program/category/lesson sequencing already supported by the training system
- only add Mystery-School-specific lock logic if the current generic sequencing cannot represent week-by-week gating cleanly

### Step 10. Preserve transition from foundation to decans

When the learner finishes the full 12-week foundation program:

- Mystery School `training_status` must still move from `foundation` to `decans`

This should be triggered by the new lesson/category/program completion model.

Implementation requirement:

- remove dependence on `student_foundation_progress.week_completed_at` as the primary trigger
- replace it with a completion rule derived from the new category/program progress state
- document exactly where the new status transition is enforced

## Phase 4 - Migration and cleanup

### Step 11. Migrate existing content

Move current week text/audio/tasks into the new program/category/lesson structure.

Do not leave the new program empty while the old page still references custom week rows.

Migration must include:

- week title -> category title
- week description -> lesson content and/or category summary
- audio URL -> lesson audio field, typically on Lesson 1 of that week
- each JSON task -> one real lesson
- publish state -> mapped active/published state in the new training entities

At least one week should be migrated completely first as a proof of structure before all 12 weeks are bulk-migrated.

### Step 12. Decide what to do with old learner progress

Choose one migration strategy and document it:

- preserve completed weeks by marking mapped lessons/categories complete where possible
- or reset only test/dev data
- or preserve week-level completion and derive category completion from it

This decision must be explicit before rollout.

Recommended approach for implementation planning:

- if production users already have meaningful Mystery School progress, preserve it
- if only test users exist, a reset may be acceptable
- if preserving, map completed weeks to completed categories and, where needed, mark the corresponding lessons complete

The chosen approach must be written down before any data migration runs.

### Step 13. Reduce or retire the old custom Mystery School week editor

After successful migration:

- remove it as the primary editing path, or
- change it into a readonly admin monitor, or
- keep it temporarily behind a migration flag only

Recommended choice:

- remove it as the primary content editor
- keep it temporarily only if it helps verify migrated data during rollout

## Functional Requirements For Replacing Checkbox Tasks

The current task row UI is too shallow.

Each old task must become something the learner can actually do.

Minimum requirement for a proper replacement:

- openable content
- clear completion action
- progress persistence
- optional media

Examples:

### Reading task

Should become:

- a lesson with real text, optional PDF, optional audio/video

### Meditation task

Should become:

- a lesson with meditation instructions, optional embedded audio, optional completion CTA

### Journal reflection task

Should become one of:

- a lesson with reflective prompt plus manual mark-complete
- a lesson with a textarea submission feature saved per student

Recommended first release:

- lesson with prompt + completion

Recommended second release if needed:

- actual journal response storage

## Specific Instruction About Admin Training Changes

The latest implementation decision is:

- keep admin Training mostly unchanged
- do not rebuild programs/categories/lessons/quizzes for Mystery School
- use the existing Training system as the CMS
- make only small, targeted additions if truly needed

Possible small additions:

- `training_lessons.audio_url`
- admin audio upload support for lessons
- category/week metadata if the learner shell needs week-specific display info
- minimal adapter logic for Mystery School learner rendering

Changes that are NOT recommended:

- building a second parallel Mystery School-specific lesson CMS
- leaving `/admin/mystery-school` as a permanent separate source of truth
- redesigning the entire admin Training module just for this feature

## Acceptance Criteria

- Mystery School foundation curriculum is manageable from admin Training
- Admin can create and edit Mystery School program, week categories, and lessons
- Admin Training remains the main editing surface without a major redesign
- Admin can upload audio files directly on lessons
- Mystery School learner content no longer depends on raw checkbox-only tasks as the primary learning unit
- Existing week structure is preserved visually or improved
- Learners can open proper content for each current task replacement
- Learners can play uploaded lesson audio where audio is part of the lesson
- Progress is tracked through the training lesson/category/program model
- Completing the full foundation still unlocks the decan phase
- Role-based access to Mystery School content still works
- The old `/admin/mystery-school` editor is no longer the main source of truth

## Non-Goals

- Do not redesign the entire trainee training experience unless required for shared infrastructure
- Do not build a complex assignment-grading system unless clearly needed
- Do not keep two permanent content sources of truth for the same Mystery School curriculum

## Recommended Delivery Order

1. Audit current Mystery School week data
2. Confirm final mapping: week -> category, task -> lesson
3. Create Mystery School Foundation program structure in admin Training
4. Reuse existing admin Training screens with only minimal additions if needed
5. Add first-class lesson audio upload support
6. Add or extend any missing lesson/category metadata needed for parity
7. Migrate one sample week end-to-end
8. Build learner adapter for Mystery School page using Training data
9. Hook week completion to category/program completion
10. Preserve `foundation -> decans` transition
11. Migrate all 12 weeks
12. Retire old custom editor as primary source

## Final Direction Chosen For This Task

- use admin Training as the content source of truth
- keep the Mystery School week-themed shell for learner UX
- map program -> Mystery School Foundation
- map category -> week
- map checkbox task -> real lesson
- keep admin Training mostly as it is
- make only small, targeted additions if needed
- add audio upload support directly to lessons
- use `is_mystery_school` role access
- delay custom journaling storage unless the product explicitly needs saved written responses

## Implementation Notes For The Developer

When executing this task:

1. Start by proving the model with one week
   - create the program
   - create one week category
   - create three real lessons
   - render them in the Mystery School learner shell

2. Do not migrate all 12 weeks before proving the learner rendering model

3. Reuse existing training viewer/progress infrastructure wherever possible

4. Keep changes localized
   - admin Training should not be broadly redesigned
   - Mystery School should become a consumer of the existing Training CMS

5. Treat the old checkbox tasks as migration inputs, not permanent entities

6. Add proper lesson audio upload support rather than relying on manual external URL-only workflows

7. Ensure the final result gives learners actual content to open and complete
   - not only static task labels
