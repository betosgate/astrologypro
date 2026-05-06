# Mystery School Decan Admin Content Upgrade

## Scope - 2026-05-06

Build the next phase of Mystery School after Foundation Q1: a stronger Decan experience managed from Mystery School admin, not from generic Admin Training.

This task should be done **after** or **alongside** the Foundation -> Decan access task:

- `docs/tasks/2026-05-06/mystery-school-foundation-decan-access-flow.md`

Foundation Q1 remains controlled by Admin Training. Decans should remain a dedicated Mystery School system because they have special lifecycle rules, journals, rituals, time windows, and graduation impact.

## Goal

Make the Decan phase feel like a complete Mystery School learning module after Foundation is complete:

- rich Decan study page
- admin-managed Decan media/content/resources
- instructor journals from Beto
- student journal submissions with file uploads
- admin review/feedback/rating
- current Decan dashboard focus
- notifications when feedback or new Decan content is added

The best result should combine:

- current project strengths: Decan lifecycle, ritual/scry/mundane requirements, graduation tracking
- old Angular Mystery School strengths: rich Decan dashboard, instructor media, resources, feedback, journal hub

## Architecture Decision

Use this split:

- **Admin Training** controls Foundation Q1 only.
- **Mystery School Admin** controls Decans, rituals, journals, feedback, resources, and instructor content.

Do **not** move Decans into Admin Training. Decans are not normal training lessons because they are time-based and have ritual/journal/graduation rules.

## Current Decan System

Currently Decans are handled by:

- `decans`
- `student_decan_progress`
- `decan_rituals`
- `ritual_executions`
- `scry_journals`
- `mundane_journals`
- `/api/mystery-school/decans`
- `/api/mystery-school/decan/[id]`
- `/api/cron/decan-unlock`
- `/mystery-school`
- `/mystery-school/decans/[id]`
- `/mystery-school/decans/[id]/ritual`
- `/admin/mystery-school`
- `/admin/mystery-school/decans`
- `/admin/mystery-school/journals`

Current strengths:

- 36-Decan grid exists.
- Current Decan and upcoming Decans are date-based.
- Decans have active, preview, grace, missed, retry, completed states.
- Student must complete ritual, scrying journal, and mundane journal.
- Graduation depends on Decan completion.

Current gaps:

- Decan content is too thin compared with the old Mystery School.
- Admin cannot fully manage rich Decan learning content.
- No Decan intro video/audio content model.
- No instructor journal/audio/video entries per Decan.
- No per-Decan resource library.
- Student journals do not support rich file uploads like audio/video/image.
- Admin feedback/rating flow is not fully integrated into student Decan view.
- Notifications for feedback/new Decan content are missing or not connected.
- Main Mystery School dashboard does not yet behave like a rich current-focus student dashboard.

## Desired Learner Experience

### 1. Main Mystery School Dashboard - Decan Phase

After Foundation is complete and the student is in Decan phase, `/mystery-school` should show a richer current-focus dashboard.

Blocks:

1. **Welcome & Current Focus**
   - Welcome message using student display name.
   - Current date.
   - Current Decan title, sign, dates, tarot card, and theme.
   - CTA: `Go to Current Decan Module`.

2. **Progress & Subscription**
   - Keep existing subscription cards.
   - Keep 36-Decan progress.
   - Show Foundation complete badge.

3. **Notifications & Feedback**
   - Show unread Mystery School notifications.
   - Examples:
     - Instructor feedback received.
     - New instructor journal added.
     - New Decan resource added.
     - Announcement posted.
   - Include `Mark all as read`.

4. **Curriculum Map**
   - Keep 36-Decan grid.
   - Group by sign.
   - Optional quarter grouping:
     - Spring: Aries, Taurus, Gemini
     - Summer: Cancer, Leo, Virgo
     - Autumn: Libra, Scorpio, Sagittarius
     - Winter: Capricorn, Aquarius, Pisces
   - Status colors remain: locked, preview, active, grace, completed, missed.

5. **Journal Quick Access**
   - Recent Decan journal entries.
   - Feedback status.
   - Rating if reviewed.
   - Link to all Mystery School journals.

6. **Ritual & Resource Quick Access**
   - Grand Invocation guide.
   - LBRP guide if present.
   - Planetary correspondences.
   - Beto audio journal archive.

### 2. Decan Detail Page

Update `/mystery-school/decans/[id]` into a richer module page.

Sections:

1. **Decan Identity**
   - Sign + Decan number.
   - Decan name/title.
   - Active date range.
   - Status badge.
   - Countdown when active/grace.
   - Tarot card image.
   - Tarot card title/reference.
   - Tarot explanation.
   - Planet/sign metadata.

2. **Overview / Study Text**
   - Admin-managed Decan description.
   - Optional preview text.
   - Optional learning objectives.

3. **Introduction Media**
   - Admin-managed intro video.
   - Admin-managed intro audio.
   - Instructor, duration, transcript/notes if present.

4. **Ritual Practice**
   - Keep current step-through ritual runner.
   - Add admin-managed ritual video if present.
   - Add admin-managed ritual PDF/resource links.
   - Show ritual completion status.

5. **Instructor Journal**
   - Beto/admin can add audio/video/text logs per Decan.
   - Student can play/view entries.
   - Entries have title, type, date, duration, description.

6. **Student Journaling**
   - Keep required scrying journal.
   - Keep required mundane journal.
   - Add optional/general Decan journal entries:
     - title
     - text body
     - audio upload
     - video upload
     - image upload
     - private notes or submit-for-review
   - Submitted entries show status:
     - draft
     - submitted
     - awaiting review
     - feedback received
   - Feedback snippet shown when reviewed.

7. **Scrying / Meditation Guidance**
   - Admin-managed practice focus.
   - Instructions.
   - Technique suggestion.
   - Related audio/video resource.

8. **Associated Resources**
   - PDFs
   - videos
   - audio
   - links
   - tarot references
   - correspondence sheets

## Desired Admin Experience

### 1. Admin Decan List

Update or confirm:

- `/admin/mystery-school/decans`

Required features:

- List all 36 Decans.
- Search by title/sign/tarot.
- Filter by sign.
- Filter by content completeness:
  - missing intro media
  - missing ritual steps
  - missing resources
  - missing tarot image/explanation
- Show completion badges:
  - metadata complete
  - media complete
  - ritual complete
  - resources complete

### 2. Admin Decan Edit Page

Add or update:

- `/admin/mystery-school/decans/[id]/edit`

Fields:

- title
- decan name
- sign
- planet
- decan number
- date range/month/day fields
- astronomical start/end
- tarot card reference
- tarot explanation
- tarot image/artwork URL or upload
- preview text
- full description
- learning objectives
- practice focus
- scrying/meditation guidance
- status/content active flag if needed

### 3. Decan Media Manager

Within the edit page or separate tab:

- intro video URL/upload
- intro audio URL/upload
- ritual video URL/upload
- transcript/notes
- duration
- instructor name

Use existing storage patterns from Admin Training lesson uploads where practical.

### 4. Decan Ritual Manager

Keep existing `decan_rituals` step model, but improve admin editing:

- add/edit/reorder ritual steps
- step type:
  - invocation
  - gate
  - instruction
  - affirmation
  - closing
- publish/unpublish steps
- preview ritual runner

### 5. Instructor Journal Manager

Add admin ability to create Beto/instructor journal entries per Decan.

Suggested table:

- `decan_instructor_journals`

Suggested fields:

- `id`
- `decan_id`
- `title`
- `entry_type` (`text`, `audio`, `video`)
- `content`
- `media_url`
- `duration_seconds`
- `instructor_name`
- `published_at`
- `is_published`
- `created_at`
- `updated_at`

Admin actions:

- create
- edit
- publish/unpublish
- delete

Student behavior:

- show published entries only.
- create notification when a new published entry is added.

### 6. Decan Resource Manager

Add admin ability to attach resources per Decan.

Suggested table:

- `decan_resources`

Suggested fields:

- `id`
- `decan_id`
- `title`
- `resource_type` (`pdf`, `video`, `audio`, `link`, `image`, `text`)
- `url`
- `description`
- `sort_order`
- `is_published`
- `created_at`
- `updated_at`

Admin actions:

- add resource
- upload file or enter URL
- reorder resources
- publish/unpublish
- delete

Student behavior:

- show published resources only.
- create notification when a new published resource is added.

### 7. Student Journal Review

Update or create admin review flow:

- `/admin/mystery-school/journals`
- `/admin/mystery-school/students/[id]`
- optional `/admin/mystery-school/journals/[id]`

Admin should see:

- student
- Decan
- journal type
- submitted date
- text
- uploaded files
- status
- feedback
- rating

Admin actions:

- add feedback
- add rating
- mark reviewed
- request revision
- mark resolved

Student behavior:

- feedback appears on Decan detail page and journal quick access.
- notification created when feedback is added.

## Data Model Plan

Before coding, inspect existing migrations and schema for these fields/tables. Reuse existing tables where appropriate.

Potential migrations:

### `decans` enhancements

Add columns only if missing:

- `intro_video_url`
- `intro_audio_url`
- `ritual_video_url`
- `tarot_explanation`
- `learning_objectives`
- `practice_focus_title`
- `practice_focus_instructions`
- `practice_focus_technique`
- `related_audio_url`

### New `decan_instructor_journals`

See fields above.

### New `decan_resources`

See fields above.

### New `decan_student_journal_entries`

For optional/general Decan journal entries beyond required scry/mundane.

Suggested fields:

- `id`
- `student_id`
- `user_id`
- `decan_id`
- `title`
- `content`
- `entry_type`
- `audio_url`
- `video_url`
- `image_url`
- `status` (`draft`, `submitted`, `reviewed`, `revision_requested`)
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `feedback_text`
- `rating`
- `created_at`
- `updated_at`

Important:

- Do not replace `scry_journals` and `mundane_journals` unless a separate migration plan is approved.
- Optional journal entries should complement the required Decan requirements.

## API Plan

### Learner APIs

Update:

- `GET /api/mystery-school/decans`
- `GET /api/mystery-school/decan/[id]`

Add if needed:

- `GET /api/mystery-school/decan/[id]/resources`
- `GET /api/mystery-school/decan/[id]/instructor-journals`
- `GET /api/mystery-school/decan/[id]/journal-entries`
- `POST /api/mystery-school/decan/[id]/journal-entries`
- `PUT /api/mystery-school/decan/[id]/journal-entries/[entryId]`

Requirements:

- All learner Decan APIs must require Mystery School access.
- All learner Decan APIs must require Foundation/Decan eligibility from the Foundation -> Decan access task.
- Only published admin content should be visible to students.

### Admin APIs

Add/update:

- `GET /api/admin/mystery-school/decans`
- `GET /api/admin/mystery-school/decans/[id]`
- `PUT /api/admin/mystery-school/decans/[id]`
- `POST /api/admin/mystery-school/decans/[id]/resources`
- `PUT /api/admin/mystery-school/decans/[id]/resources/[resourceId]`
- `DELETE /api/admin/mystery-school/decans/[id]/resources/[resourceId]`
- `POST /api/admin/mystery-school/decans/[id]/instructor-journals`
- `PUT /api/admin/mystery-school/decans/[id]/instructor-journals/[journalId]`
- `DELETE /api/admin/mystery-school/decans/[id]/instructor-journals/[journalId]`
- `PUT /api/admin/mystery-school/journals/[id]/review`

Requirements:

- Admin APIs require admin authorization.
- Validate fields server-side.
- Use storage upload patterns already used by Admin Training for media.

## UI Implementation Plan

### Step 1 - Confirm Existing Decan Schema

- Inspect migrations and generated types.
- Document existing Decan fields.
- Decide exact migrations needed.

### Step 2 - Add Migrations

- Add missing `decans` columns.
- Add instructor journals table.
- Add resources table.
- Add optional student Decan journal entries table.
- Add indexes:
  - `decan_id`
  - `student_id`
  - `user_id`
  - `is_published`
  - `status`

### Step 3 - Build Admin Decan Edit UI

- Update admin Decan list.
- Add edit page or modal.
- Add tabs:
  - Overview
  - Media
  - Ritual Steps
  - Instructor Journal
  - Resources
  - Student Submissions

### Step 4 - Upgrade Student Decan Detail

- Add richer Decan identity section.
- Add intro media section.
- Add ritual media/PDF section.
- Add instructor journal section.
- Add associated resources.
- Keep existing ritual/scry/mundane completion requirements.

### Step 5 - Add Optional Journal Entry Flow

- Student can add optional Decan journal entry.
- Student can upload audio/video/image if allowed.
- Student can submit for review.
- Admin can review/rate.
- Feedback appears on student Decan page.

### Step 6 - Add Notifications

Use existing notification system if possible:

- feedback received
- new instructor journal published
- new Decan resource published
- Decan window active/grace reminder if already supported or easy to add

### Step 7 - Improve Dashboard Current Focus

Update `/mystery-school` after Foundation is complete:

- current date
- current Decan focus
- theme/description
- current module CTA
- recent feedback
- recent resources/instructor journals

### Step 8 - Verification

Manual verification scenarios:

1. Admin edits Taurus II:
   - title/description
   - tarot explanation
   - intro video
   - instructor audio journal
   - PDF resource

2. Student opens Taurus II:
   - sees updated content
   - sees media and resources
   - can complete ritual/scry/mundane
   - can create optional journal entry

3. Admin reviews student journal:
   - adds rating/feedback
   - student sees feedback
   - notification appears

4. Foundation student:
   - cannot access Decan content before Foundation completion.

5. Decan phase student:
   - can access only lifecycle-allowed Decan work.

## Acceptance Criteria

- Decans remain separate from Admin Training.
- Admin can manage rich Decan content from Mystery School admin.
- Student Decan detail page shows admin-managed intro media, instructor journals, resources, tarot explanation, and practice guidance.
- Existing Decan lifecycle remains intact.
- Existing ritual/scry/mundane completion requirements remain intact.
- Optional student journal entries can be submitted and reviewed.
- Admin feedback/rating appears to the student.
- Notifications are created for feedback and newly published Decan content.
- Foundation students cannot access Decan content before Foundation completion.
- Completed Decan progress still counts toward graduation.

## Out Of Scope

- Removing old Decan tables.
- Moving Decans into Admin Training.
- Replacing required scry/mundane journal tables.
- Rebuilding the full notification center if existing notifications can be reused.
- Redesigning enrollment/checkout.

## Notes

- Use the old Angular document as inspiration, not as a strict replacement.
- Keep the Decan phase practical and focused: current Decan, required work, instructor guidance, student reflection, admin feedback.
- Do not let rich content weaken the core rule: Foundation first, then Decans.
