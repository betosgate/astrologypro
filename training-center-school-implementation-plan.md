**Status:** Planning

# Task: Training Center / School Implementation Plan

## Objective
Convert the architect's discussion points into a production-ready implementation plan for this codebase's training center module, covering domain design, database structure, API flow, admin UX, trainee UX, analytics, certificates, and rollout order.

## Current Repo Context
- The project already has a training foundation in Supabase:
  - `training_programs`
  - `training_categories`
  - `training_lessons`
  - `lesson_assets`
  - `lesson_videos`
  - `quiz_questions`
  - `quiz_attempts`
  - `lesson_progress`
  - `lesson_completions`
  - `category_completions`
  - `program_enrollments`
  - `user_category_progress`
  - `user_program_progress`
  - `training_settings`
- There is also legacy overlap that should be cleaned up before expanding:
  - `training_quizzes.questions JSONB`
  - `training_lessons.video_url`
  - `training_lessons.pdf_url`
- Recommendation:
  - Keep `training_programs -> training_categories -> training_lessons` as the core hierarchy.
  - Treat the new "training center/school" as an extensible LMS module, not a one-off feature.
  - Normalize quiz and media structure instead of adding more logic into legacy JSON or single-URL columns.

## Requirement Breakdown

### 1. Global training center settings
Your architect's first point is platform-level configuration, not program-level content.

- `training_settings`
  - `sequential_lock_enabled BOOLEAN`
  - `allowed_roles TEXT[]`
  - `default_certificate_email_template_id UUID NULL`
  - `updated_at TIMESTAMPTZ`
  - `updated_by UUID`
- Purpose:
  - Toggle whether users must complete programs in order.
  - Control which role slugs can see the training center navigation.

### 2. Main content hierarchy
This is the correct hierarchy:

1. Training center
2. Training program
3. Category
4. Lesson
5. Quiz / assets / completion records

The repo already models this mostly as:

1. `training_programs`
2. `training_categories`
3. `training_lessons`

That naming is acceptable. Avoid introducing another top-level table named `training` unless you need multi-tenant partitioning. In this codebase, `training_programs` already plays that role.

### 3. Priority + previous lesson rules
The architect described two sequencing systems:

- Explicit ordering by `priority`
- Directed dependency by `previous_lesson`

That means lesson unlock logic should not rely on priority alone.

Recommended rule:
- `priority` decides display order.
- `previous_lesson_id` decides strict dependency when category sequential mode is enabled.
- If both exist and conflict, `previous_lesson_id` wins for unlock validation, `priority` still wins for list ordering.

### 4. Sequential lock interpretation
There are three levels of lock:

1. Global training-center lock
2. Program-level sequential lock
3. Category-level sequential lock

Recommended precedence:

1. If global sequential lock is `true`, users must complete programs in program priority order.
2. Inside a program:
   - If program `is_sequential = true`, categories unlock by category priority order.
   - If program `is_sequential = false`, any category can be entered.
3. Inside a category:
   - If category `is_sequential = true`, lessons unlock by dependency chain / priority.
   - If category `is_sequential = false`, any lesson in that category can be entered.

This is slightly clearer than the spoken note "category level will get higher priority." In implementation terms:
- Program sequential lock governs category unlock.
- Category sequential lock governs lesson unlock.
- Global sequential lock governs cross-program unlock.

### 5. Resume behavior
When the user opens an incomplete training, the app should redirect to:

1. Highest-priority accessible incomplete program
2. Within that, highest-priority incomplete accessible category
3. Within that, highest-priority incomplete accessible lesson

Use cached progress tables for this:
- `user_program_progress.next_category_id`
- `user_program_progress.next_lesson_id`
- `user_category_progress.next_lesson_id`

If sequential rules are off, "highest" should still mean:
- lowest numeric `priority`
- then oldest `created_at`
- then `id` as deterministic tiebreaker

## Recommended Data Model

### A. Keep and extend existing tables

#### `training_settings`
Use this for global training-center rules.

Recommended final columns:
- `id UUID`
- `sequential_lock_enabled BOOLEAN NOT NULL DEFAULT false`
- `allowed_roles TEXT[] NOT NULL DEFAULT '{}'`
- `nav_label TEXT NOT NULL DEFAULT 'Training Center'`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_by UUID NULL`

#### `training_programs`
Represents one training program.

Recommended columns:
- `id UUID`
- `name TEXT`
- `slug TEXT UNIQUE`
- `description TEXT`
- `priority INTEGER NOT NULL DEFAULT 0`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `is_sequential BOOLEAN NOT NULL DEFAULT false`
- `allowed_roles TEXT[] NOT NULL DEFAULT '{}'`
- `certificate_template_id UUID NULL`
- `estimated_duration_minutes INTEGER NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

#### `training_categories`
Represents a group of lessons within a program.

Recommended columns:
- `id UUID`
- `training_id UUID NOT NULL`
- `name TEXT`
- `slug TEXT`
- `description TEXT`
- `priority INTEGER NOT NULL DEFAULT 0`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `is_sequential BOOLEAN NOT NULL DEFAULT false`
- `estimated_duration_minutes INTEGER NULL`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

#### `training_lessons`
Represents one lesson.

Recommended columns:
- `id UUID`
- `category_id UUID NOT NULL`
- `title TEXT`
- `slug TEXT`
- `description TEXT`
- `content JSONB NULL`
- `priority INTEGER NOT NULL DEFAULT 0`
- `previous_lesson_id UUID NULL`
- `video_completion_threshold_pct NUMERIC(5,2) DEFAULT 90`
- `requires_quiz_pass BOOLEAN NOT NULL DEFAULT false`
- `estimated_duration_minutes INTEGER NULL`
- `is_previewable BOOLEAN NOT NULL DEFAULT false`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ`
- `updated_at TIMESTAMPTZ`

Note:
- Deprecate direct media fields like `video_url` and `pdf_url`.
- Keep lesson content metadata in normalized child tables.

### B. Normalize lesson media
Requirement says lessons may include:
- uploaded video
- uploaded file(s)
- YouTube video
- file URL

The cleanest structure is a single media table instead of separate `lesson_videos` plus `lesson_assets`.

Recommended new table:

#### `lesson_media`
- `id UUID`
- `lesson_id UUID NOT NULL`
- `media_type TEXT CHECK (media_type IN ('uploaded_video', 'youtube_video', 'uploaded_file', 'external_file_url'))`
- `title TEXT NOT NULL`
- `storage_path TEXT NULL`
- `public_url TEXT NULL`
- `youtube_url TEXT NULL`
- `mime_type TEXT NULL`
- `file_size_bytes BIGINT NULL`
- `duration_seconds INTEGER NULL`
- `preview_image_url TEXT NULL`
- `is_downloadable BOOLEAN NOT NULL DEFAULT true`
- `priority INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ`

If you want lower migration cost, keep existing `lesson_assets` and `lesson_videos` for now, but the long-term model should be one media table.

### C. Normalize quiz structure for remediation flow
The current repo already has `quiz_questions` and `quiz_attempts`, but the architect's flow requires more metadata.

Recommended quiz tables:

#### `quiz_questions`
- `id UUID`
- `lesson_id UUID NOT NULL`
- `question TEXT NOT NULL`
- `question_type TEXT NOT NULL DEFAULT 'single_choice'`
- `options JSONB NOT NULL`
- `correct_answer INTEGER NOT NULL`
- `explanation TEXT NULL`
- `video_seek_seconds INTEGER NULL`
- `priority INTEGER NOT NULL DEFAULT 0`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ`

`video_seek_seconds` is required for:
- wrong answer
- 5-second notification
- redirect user to the exact lesson video timestamp

#### `quiz_attempts`
Keep, but extend:
- `id UUID`
- `user_id UUID`
- `lesson_id UUID`
- `attempt_number INTEGER`
- `answers JSONB`
- `score INTEGER`
- `total_questions INTEGER`
- `passed BOOLEAN`
- `time_taken_seconds INTEGER`
- `attempted_at TIMESTAMPTZ`

#### `quiz_question_attempts`
Add this. It is necessary if the product wants question-level analytics and remediation reporting.

- `id UUID`
- `quiz_attempt_id UUID NOT NULL`
- `question_id UUID NOT NULL`
- `selected_answer INTEGER NULL`
- `is_correct BOOLEAN NOT NULL`
- `video_seek_seconds INTEGER NULL`
- `answered_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### D. Progress and completion tables
The repo already has the right direction here. Keep these:
- `lesson_progress`
- `lesson_completions`
- `category_completions`
- `program_enrollments`
- `user_category_progress`
- `user_program_progress`

But add one missing aggregate:

#### `user_training_center_progress`
- `id UUID`
- `user_id UUID UNIQUE`
- `total_programs INTEGER`
- `completed_programs INTEGER`
- `progress_pct NUMERIC(5,2)`
- `next_program_id UUID NULL`
- `started_at TIMESTAMPTZ NULL`
- `last_activity_at TIMESTAMPTZ NULL`
- `completed_at TIMESTAMPTZ NULL`
- `calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

This table makes the global sequential-lock behavior and training dashboard much easier.

### E. Certificate tables
The repo already has trainee certificate verification support, but completion should be program-specific.

Recommended tables:

#### `training_certificates`
- `id UUID`
- `user_id UUID NOT NULL`
- `program_id UUID NOT NULL`
- `certificate_code TEXT UNIQUE NOT NULL`
- `issued_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `email_sent_at TIMESTAMPTZ NULL`
- `download_count INTEGER NOT NULL DEFAULT 0`
- `pdf_url TEXT NULL`
- `status TEXT NOT NULL DEFAULT 'issued'`

#### `certificate_email_jobs`
- `id UUID`
- `certificate_id UUID NOT NULL`
- `recipient_email TEXT NOT NULL`
- `provider_message_id TEXT NULL`
- `status TEXT NOT NULL DEFAULT 'queued'`
- `error_message TEXT NULL`
- `created_at TIMESTAMPTZ`
- `processed_at TIMESTAMPTZ NULL`

## Access Control Design

### Nav access
The architect explicitly asked: which roles can access training school nav.

Recommended rule:
- `training_settings.allowed_roles` controls whether the nav item appears at all.
- `training_programs.allowed_roles` controls whether a specific program is visible after entering the training center.

This gives:
- global nav visibility
- per-program visibility

Example role slugs based on current repo patterns:
- `is_trainee`
- `is_astrologer`
- `is_social_advo`
- `is_affiliate`
- `is_mystery_school`
- `is_Perennial_Mandalism`

Implementation note:
- standardize role names to one casing convention before shipping more features.

## Business Logic Rules

### Program unlock algorithm
For a given user:

1. Load all active programs allowed for the user's roles.
2. Sort by `priority ASC, created_at ASC, id ASC`.
3. If global sequential lock is off:
   - all allowed programs are unlocked.
4. If global sequential lock is on:
   - only the first incomplete program is unlocked.
   - completed earlier programs remain accessible.
   - later incomplete programs stay locked.

### Category unlock algorithm
Inside a program:

1. Load categories sorted by `priority`.
2. If program `is_sequential = false`:
   - all categories unlocked.
3. If program `is_sequential = true`:
   - categories unlock in priority order.
   - a category unlocks when all lessons in the previous category are complete, or when previous category has a completion row.

### Lesson unlock algorithm
Inside a category:

1. Load lessons sorted by `priority`.
2. If category `is_sequential = false`:
   - all lessons unlocked.
3. If category `is_sequential = true`:
   - if `previous_lesson_id` exists, require that lesson to be complete.
   - else use previous priority lesson as dependency.

### Lesson completion rule
A lesson should be considered complete only when all configured completion conditions pass.

Recommended rule set:
- video watched to threshold OR file/content viewed if no video exists
- required quiz passed if `requires_quiz_pass = true`
- manual completion event recorded

Avoid marking a lesson complete just because the page opened.

## Quiz UX Design
The architect described a different quiz UX than the current batch-submit model.

### Required behavior
- Show one question at a time.
- If correct:
  - move to next question immediately.
- If wrong:
  - show a 5-second progress-bar notification
  - message says user answered incorrectly
  - redirect video player to the configured timestamp
  - allow retry after remediation

### Recommended front-end flow
1. User watches lesson video.
2. Quiz panel opens or becomes active.
3. User answers question 1.
4. API grades question instantly.
5. If correct:
   - save question-level attempt
   - move to next question
6. If wrong:
   - return `video_seek_seconds`
   - show timed toast/modal with progress bar
   - seek video player to target timestamp
   - reset question state for retry

### API recommendation
Add question-level endpoint:
- `POST /api/trainee/training/lessons/:lessonId/questions/:questionId/answer`

Response:
- `correct`
- `video_seek_seconds`
- `explanation`
- `next_question_id`
- `lesson_completed`

Keep the current whole-quiz submit endpoint only if you still need admin preview/testing.

## Reporting and Analytics Design

### Architect requirement interpretation
You mentioned:
- user-wise training status
- training-wise report
- category-wise report
- lesson-wise report
- 4 different parameters
- mean / median / average completion time

The line "mean median average" is redundant because mean = average. The useful metrics should be:

1. Mean completion time
2. Median completion time
3. Completion rate
4. Pass rate / retry rate

### Report dimensions

#### User-wise
Show per user:
- total assigned programs
- completed programs
- current active program
- current active category
- current active lesson
- overall progress %
- total time spent
- last activity at
- certificate issued count

#### Program-wise
Show per program:
- total enrolled users
- started users
- completed users
- completion rate %
- average completion time
- median completion time
- average quiz pass rate
- drop-off lesson

#### Category-wise
Show per category:
- users entered
- users completed
- completion rate %
- average completion time
- median completion time
- average retries per lesson
- most missed question

#### Lesson-wise
Show per lesson:
- users started
- users completed
- completion rate %
- average watch time
- average attempts to pass quiz
- wrong-answer hotspot timestamps
- average time-to-complete

### Analytics query strategy
Use:
- transactional tables for source of truth
- cached progress tables for dashboard reads
- materialized views or nightly rollups for heavy admin reports

Recommended reporting views:
- `report_program_summary`
- `report_category_summary`
- `report_lesson_summary`
- `report_user_training_summary`

If Supabase Postgres load becomes heavy, move long-range reporting into scheduled aggregation tables.

## Certificate Workflow

### Trigger rule
When a user completes all required categories and lessons in a program:

1. mark `program_enrollments.completed_at`
2. generate certificate row
3. create certificate PDF
4. email certificate download link
5. expose certificate in user profile

### Required backend pieces
- certificate renderer
- storage bucket for PDFs
- signed download URL
- email template
- verification endpoint

### Recommended user experience
- completion screen with "Download certificate"
- email confirmation sent immediately
- profile page shows earned certificates
- public verification page by `certificate_code`

## Step-by-Step Implementation Plan

### Phase 1. Domain cleanup
- Finalize terminology:
  - Training Center = module
  - Program = top-level training
  - Category = module section
  - Lesson = unit
- Decide whether to merge `lesson_assets` and `lesson_videos` into `lesson_media`.
- Deprecate `training_quizzes.questions` in favor of normalized `quiz_questions`.
- Standardize role slug naming.

### Phase 2. Database migration
- Add missing columns to `training_settings`.
- Add `slug`, duration, and certificate metadata to `training_programs`.
- Add `slug` and duration fields to `training_categories`.
- Add lesson completion-rule fields to `training_lessons`.
- Add `video_seek_seconds` to `quiz_questions`.
- Add `quiz_question_attempts`.
- Add `training_certificates`.
- Add `user_training_center_progress`.
- Create indexes for:
  - `(training_id, priority)`
  - `(category_id, priority)`
  - `(lesson_id, priority)`
  - `(user_id, program_id)`
  - `(user_id, lesson_id)`
  - `(question_id, is_correct)`

### Phase 3. Progress engine
- Refactor progress calculation functions to include:
  - global sequential logic
  - next unlocked program
  - next unlocked category
  - next unlocked lesson
- Recompute caches on:
  - lesson completion
  - category completion
  - program completion
  - lesson activation/deactivation
  - priority change
  - sequential setting change

### Phase 4. Admin CMS
- Build admin pages for:
  - training center settings
  - program list/create/edit
  - category list/create/edit
  - lesson list/create/edit
  - lesson media uploader
  - quiz question builder
  - certificate template mapping
- Admin lesson editor must support:
  - uploaded video
  - YouTube link
  - multiple downloadable files
  - file preview
  - remediation timestamp per question

### Phase 5. Trainee experience
- Training center landing page:
  - visible only to allowed roles
  - show unlocked vs locked programs
  - resume CTA
- Program detail page:
  - category progress
  - sequential lock indicators
- Lesson page:
  - media viewer
  - files list
  - progress heartbeat
  - one-question-at-a-time quiz
  - wrong-answer redirect UX

### Phase 6. Reporting module
- Build admin dashboards for:
  - user-wise report
  - program-wise report
  - category-wise report
  - lesson-wise report
- Add filters:
  - program
  - category
  - lesson
  - user
  - role
  - date range
- Export CSV for audit/reporting.

### Phase 7. Certificate automation
- Generate certificate when program completion is confirmed.
- Queue email send job.
- Store PDF in Supabase Storage or S3.
- Add certificate history to user details page and profile page.
- Add verification page and QR/verification code.

### Phase 8. QA and rollout
- Seed at least 2 programs, 3 categories each, 5 lessons each.
- Test all lock combinations:
  - global off / on
  - program off / on
  - category off / on
- Test partial completion resume logic.
- Test wrong answer remediation with timestamp seek.
- Test analytics accuracy against raw tables.
- Test certificate email and download flow.

## API Plan

### Admin APIs
- `GET/PUT /api/admin/training/settings`
- `GET/POST /api/admin/training/programs`
- `GET/PUT/DELETE /api/admin/training/programs/:id`
- `GET/POST /api/admin/training/categories`
- `GET/PUT/DELETE /api/admin/training/categories/:id`
- `GET/POST /api/admin/training/lessons`
- `GET/PUT/DELETE /api/admin/training/lessons/:id`
- `POST /api/admin/training/lessons/:id/media`
- `POST /api/admin/training/lessons/:id/questions`
- `PUT /api/admin/training/questions/:id`
- `GET /api/admin/training/reports/*`

### Trainee APIs
- `GET /api/trainee/training/programs`
- `GET /api/trainee/training/programs/:id`
- `GET /api/trainee/training/lessons/:id`
- `POST /api/trainee/training/lessons/:id/start`
- `POST /api/trainee/training/lessons/:id/heartbeat`
- `POST /api/trainee/training/lessons/:id/complete`
- `POST /api/trainee/training/lessons/:lessonId/questions/:questionId/answer`
- `GET /api/trainee/training/certificates`

## Important Product Decisions To Confirm
- Is global sequential lock meant to lock programs only, or also categories/lessons when program rules are off?
- Can admins manually mark lessons/categories/programs complete for a user?
- Is quiz passing mandatory for every lesson, or only selected lessons?
- Can one lesson contain multiple videos, and if yes, which video owns remediation timestamps?
- Should certificates be issued per program only, or also for category milestones?
- Are reports needed in real time, or is delayed aggregation acceptable?

## Recommended Implementation Order For This Repo
- First, clean the training schema overlap.
- Second, lock the sequencing rules in SQL and server logic.
- Third, build the admin content model and media handling.
- Fourth, replace the current batch quiz UX with question-by-question remediation flow.
- Fifth, add reporting and certificates after progress logic is stable.

## Final Architectural Recommendation
Do not treat this as "add a few fields to the current training pages." Treat it as an LMS subsystem with:
- normalized hierarchy
- deterministic unlock rules
- explicit progress caches
- question-level remediation
- analytics-friendly event capture
- certificate issuance workflow

That approach fits the architect's requirements and also matches the direction this repo has already started in Supabase and the trainee APIs.
