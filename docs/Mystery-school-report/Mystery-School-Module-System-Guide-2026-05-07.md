# Mystery School Module System Guide

**Project:** AstrologyPro  
**Module:** Mystery School  
**Coverage:** Learner flow from Foundation Training to Decans to Graduation, plus all related Mystery School admin operations  
**Analysis date:** May 7, 2026  
**Prepared from verified code paths in the current repository**

## 1. Purpose of This Document

This document is the current system guide for the Mystery School module in the codebase as analyzed on **May 7, 2026**.

It is intended to be a reliable operational and technical reference for:

- product planning
- admin operations
- QA and regression checking
- onboarding developers
- future Mystery School upgrades

This guide is deliberately detailed. The goal is that no important step in the current learner or admin flow is omitted.

## 2. Scope

This guide covers:

- learner access into Mystery School
- Foundation Q1 training flow
- Foundation completion and transition into Decans
- Decan dashboard, Decan detail, ritual, scrying journal, and mundane journal flows
- Decan completion behavior
- Graduation eligibility and graduation processing
- Mystery School admin pages and APIs
- scheduled cron behavior related to Decans and Graduation
- current source-of-truth tables and important implementation notes

This guide does **not** attempt to redesign the system. It documents the current architecture and the currently enforced behavior.

## 3. Executive Summary

The Mystery School module currently operates as a **two-phase learner journey**:

1. **Foundation phase**
   - learner completes the Admin Training-backed Foundation curriculum
   - progression is sequential by week
   - Foundation data is primarily sourced from:
     - `training_programs`
     - `training_categories`
     - `training_lessons`
     - `lesson_completions`
     - `category_completions`

2. **Decan phase**
   - after Foundation is complete, the learner enters the Decan cycle
   - Decans are **time-based**, not sequential like Foundation
   - each Decan requires:
     - ritual completion
     - scrying journal submission
     - mundane journal submission

Graduation requires:

- Foundation complete
- all 36 Decans completed
- zero unresolved missed Decans

The admin side is split across two management areas:

- **`/admin/training`** for Foundation curriculum content
- **`/admin/mystery-school`** for Mystery School-specific oversight such as Decans, students, and journals

## 4. Verified Core Code Areas

The following major code paths were reviewed during this analysis:

### Learner UI

- `src/app/mystery-school/layout.tsx`
- `src/app/mystery-school/page.tsx`
- `src/app/mystery-school/training/page.tsx`
- `src/app/mystery-school/training/graduation/page.tsx`
- `src/app/mystery-school/decans/[id]/page.tsx`
- `src/app/mystery-school/decans/[id]/ritual/page.tsx`

### Learner APIs and helpers

- `src/lib/mystery-school/access.ts`
- `src/lib/mystery-school/foundation-progress.ts`
- `src/lib/mystery-school/foundation-graduation.ts`
- `src/lib/mystery-school/decan-gate.ts`
- `src/lib/mystery-school/graduation.ts`
- `src/app/api/mystery-school/training/foundation/route.ts`
- `src/app/api/mystery-school/decans/route.ts`
- `src/app/api/mystery-school/decan/[id]/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/start/route.ts`
- `src/app/api/mystery-school/decan/[id]/ritual/step/route.ts`
- `src/app/api/mystery-school/decan/[id]/scry/route.ts`
- `src/app/api/mystery-school/decan/[id]/journal/route.ts`

### Admin UI and APIs

- `src/app/admin/mystery-school/page.tsx`
- `src/app/admin/mystery-school/decans/page.tsx`
- `src/app/admin/mystery-school/students/page.tsx`
- `src/app/admin/mystery-school/journals/page.tsx`
- `src/app/api/admin/mystery-school/training-status/route.ts`
- `src/app/api/admin/mystery-school/students/route.ts`
- `src/app/api/admin/mystery-school/students/[id]/route.ts`
- `src/app/api/admin/mystery-school/decans/route.ts`
- `src/app/api/admin/mystery-school/decans/[id]/route.ts`
- `src/app/api/admin/mystery-school/journals/route.ts`
- `src/app/api/admin/mystery-school/journals/[id]/review/route.ts`

### Scheduled jobs

- `src/app/api/cron/decan-unlock/route.ts`
- `src/app/api/cron/graduation-check/route.ts`

## 5. High-Level Learner Lifecycle

### Step 1: User becomes a Mystery School member

Mystery School entitlement is enforced through `requireMysterySchoolAccess()` in `src/lib/mystery-school/access.ts`.

The authoritative entitlement table is:

- `mystery_school_students`

Access is granted when the student row has valid billing fields and:

- `status = 'active'`, or
- `status = 'cancelled'` with future `access_expires_at`

There is also a **legacy fallback provisioning path**:

- if a user exists only in legacy `community_members` with `membership_type = 'mystery_school'`
- the system can provision a missing `mystery_school_students` row automatically

### Step 2: Learner enters the Mystery School layout

The authenticated learner enters the Mystery School shell via:

- `src/app/mystery-school/layout.tsx`

This layout:

- re-checks server-side access
- blocks expired subscriptions
- shows the Mystery School sidebar
- currently places navigation in this order:
  - Training
  - Decans
  - Graduation

### Step 3: Learner starts in Foundation

The intended initial phase is:

- `mystery_school_students.training_status = 'foundation'`

In this phase:

- `/mystery-school/training` is the active curriculum path
- Decan work is supposed to remain unavailable until Foundation is complete

## 6. Foundation Q1: Current System Behavior

### 6.1 Foundation source of truth

Foundation is no longer controlled by the old per-week Mystery School content tables for current learner progression.

The current Foundation source of truth is the Admin Training system:

- `training_programs`
- `training_categories`
- `training_lessons`
- `lesson_completions`
- `category_completions`

The Foundation program is identified by exact program name:

- `Mystery School Foundation`

This is centrally enforced in:

- `src/lib/mystery-school/foundation-progress.ts`

### 6.2 Foundation learner API

The main learner adapter is:

- `GET /api/mystery-school/training/foundation`

File:

- `src/app/api/mystery-school/training/foundation/route.ts`

What it does:

1. confirms Mystery School access
2. loads the active `Mystery School Foundation` training program
3. treats active `training_categories` as Foundation weeks
4. treats active `training_lessons` as lessons inside each week
5. loads user completion state from:
   - `lesson_completions`
   - `category_completions`
6. returns a Mystery School-specific week-card response shape for the learner UI

### 6.3 Foundation unlock rule

Foundation week progression is sequential.

The current enforced rule is:

- Week 1 is always unlocked
- Week N is unlocked only when Week N-1 is complete

A week is complete when either:

- there is a `category_completions` row for that week and user
- or every active lesson in that week has a `lesson_completions` row

### 6.4 Foundation page behavior

Foundation learner UI lives at:

- `src/app/mystery-school/training/page.tsx`

Current behavior:

- renders hero progress header
- shows completed weeks count
- shows sequential week cards
- shows lessons within each week
- uses lesson media and content from Admin Training lesson records
- can show empty/setup state if the Foundation program is not present

### 6.5 Foundation completion helper

The canonical Foundation completion helper is:

- `getFoundationCompletionForUser()`

File:

- `src/lib/mystery-school/foundation-progress.ts`

This helper returns:

- `isComplete`
- `totalWeeks`
- `completedWeeks`
- `totalLessons`
- `completedLessons`
- `emptyWeeks`
- `missingWeeks`

Important rule:

- a week with zero active lessons is treated as **incomplete for gating**, unless it has an explicit `category_completions` row

## 7. Foundation to Decan Transition

### 7.1 Transition helper

The transition helper is:

- `maybeAdvanceMysterySchoolToDecans()`

File:

- `src/lib/mystery-school/foundation-graduation.ts`

Its job:

1. optionally confirm the completed lesson belongs to the Mystery School Foundation program
2. verify the learner is currently a Mystery School student in `training_status = 'foundation'`
3. verify Foundation is fully complete using the shared Foundation helper
4. update the student row to:
   - `training_status = 'decans'`
   - `foundation_completed_at = now`

### 7.2 Transition characteristics

The transition is designed to be:

- idempotent
- safe to call repeatedly
- non-throwing

It intentionally short-circuits if:

- the lesson is unrelated
- the user is not enrolled
- the user is not in Foundation
- not all Foundation weeks are complete

## 8. Decan Access Gating

### 8.1 Gate logic

All Decan work is intended to be protected by:

- `assertMysterySchoolDecanEligible()`
- `requireDecanEligibilityOr403()`

Files:

- `src/lib/mystery-school/foundation-progress.ts`
- `src/lib/mystery-school/decan-gate.ts`

Eligibility is considered valid when:

- `training_status = 'decans'`, or
- `training_status = 'graduated'`, or
- Foundation is complete according to the shared Training-backed helper

If Foundation is complete but the student row is still `foundation`, the code attempts an idempotent background advance.

### 8.2 Locked response behavior

If the learner is not Decan-eligible, the Decan gate returns:

- HTTP `403`
- code: `foundation_required`

and includes Foundation progress metrics so the UI can explain what is still incomplete.

## 9. Decan Dashboard

### 9.1 Main API

The Decan dashboard is powered by:

- `GET /api/mystery-school/decans`

File:

- `src/app/api/mystery-school/decans/route.ts`

### 9.2 What the Decan dashboard API returns

It returns:

- current student phase
- all 36 Decans
- per-Decan lifecycle status
- completed count
- current active Decan number
- graduation eligibility summary
- subscription summary

### 9.3 Decan lifecycle statuses

Current status vocabulary:

- `locked`
- `upcoming`
- `preview`
- `active`
- `grace`
- `completed`
- `missed`

### 9.4 Lifecycle meaning

- `locked`: no current access
- `upcoming`: exists in future timeline but not in preview
- `preview`: within 7 days before window opens
- `active`: inside action window
- `grace`: after window close, before grace close
- `completed`: ritual + scry + journal all complete
- `missed`: grace passed without full completion

### 9.5 Important current exception

There is a **hardcoded test override** in the Decan API for:

- `perennial1@test.astrologypro.com`

Observed behavior in code:

- Foundation lock can be bypassed for this user
- `locked` and `upcoming` Decans can be forced into `active`

This is a real implementation note and should be treated as a temporary test bypass, not normal business behavior.

## 10. Decan Detail Page

### 10.1 Detail API

The single Decan detail page is powered by:

- `GET /api/mystery-school/decan/[id]`

File:

- `src/app/api/mystery-school/decan/[id]/route.ts`

### 10.2 What it loads

This route loads:

- the Decan record from `decans`
- ritual steps from `decan_rituals`
- learner progress from `student_decan_progress`
- scry journal from `scry_journals`
- mundane journal from `mundane_journals`
- ritual execution state from `ritual_executions`

### 10.3 Live status derivation

The route derives a live status from:

- persisted progress row status
- current time
- canonical action window
- grace window
- preview window

This means the page can show an accurate live state even if the stored row is not the final display state by itself.

### 10.4 Current test override

The same test email override exists here:

- `perennial1@test.astrologypro.com`

This can bypass the normal Foundation lock on Decan detail access.

## 11. Decan Ritual Flow

### 11.1 Ritual content source

Decan ritual content comes from:

- `decan_rituals`

It is **not** sourced from Admin Training.

### 11.2 Ritual read endpoint

- `GET /api/mystery-school/decan/[id]/ritual`

Loads:

- published ritual steps
- current ritual execution row, if present

### 11.3 Ritual start endpoint

- `POST /api/mystery-school/decan/[id]/ritual/start`

Behavior:

1. confirms Decan eligibility
2. counts published ritual steps
3. creates or reuses a `ritual_executions` row

### 11.4 Ritual step advancement endpoint

- `POST /api/mystery-school/decan/[id]/ritual/step`

Behavior:

1. confirms Decan eligibility
2. requires an existing ritual execution row
3. enforces sequential ritual step advancement
4. rejects out-of-order step submissions
5. when the final step is completed:
   - marks `ritual_executions.is_complete = true`
   - sets `student_decan_progress.ritual_done = true`
   - checks if all three Decan requirements are now complete
   - if yes, marks the Decan `completed`
   - calls graduation processing helper

### 11.5 Ritual UI

The ritual runner UI is in:

- `src/app/mystery-school/decans/[id]/ritual/page.tsx`

Current presentation:

- ceremonial step-by-step progression
- progress bar
- step chips by type
- begin ritual state
- completion state

## 12. Scrying Journal Flow

### 12.1 Scry journal table

Scry journal submissions are stored in:

- `scry_journals`

### 12.2 Read endpoint

- `GET /api/mystery-school/decan/[id]/scry`

Returns existing scry journal entry for the learner and Decan.

### 12.3 Write endpoint

- `POST /api/mystery-school/decan/[id]/scry`

Validation rules:

- `assigned_card` required
- `experience_text` required
- `experience_text` minimum 50 characters

Write behavior:

- upserts the learner’s scry journal for that Decan
- keeps `content` synchronized for backward compatibility
- increments `submission_count` on updates
- marks `student_decan_progress.scry_done = true`
- checks whether the full Decan is now complete

## 13. Mundane Journal Flow

### 13.1 Mundane journal table

Mundane journal submissions are stored in:

- `mundane_journals`

### 13.2 Read endpoint

- `GET /api/mystery-school/decan/[id]/journal`

Returns existing mundane journal entry for the learner and Decan.

### 13.3 Write endpoint

- `POST /api/mystery-school/decan/[id]/journal`

Validation rules:

- `relationships_section` required, minimum 100 characters
- `business_work_section` required, minimum 100 characters
- `shifts_perception_section` required, minimum 100 characters

Write behavior:

- inserts a single mundane journal entry for the learner and Decan
- rejects duplicates with conflict handling
- writes a combined `content` field for backward compatibility
- marks `student_decan_progress.journal_done = true`
- checks whether the full Decan is now complete

## 14. What Happens When a Decan Becomes Complete

When all three are true:

- `ritual_done = true`
- `scry_done = true`
- `journal_done = true`

the system marks:

- `student_decan_progress.status = 'completed'`
- `student_decan_progress.completed_at = now`

What changes after that:

1. the Decan counts toward the learner’s completed Decan total
2. the dashboard reflects increased Decan progress
3. the learner moves closer to graduation
4. the next Decan is **not** sequence-unlocked by completion
5. Decan availability remains primarily time-based

## 15. Decan Lifecycle Automation

### 15.1 Daily Decan cron

File:

- `src/app/api/cron/decan-unlock/route.ts`

This job currently processes only students in:

- `training_status = 'decans'`

This is important because Foundation students should not receive actionable Decan lifecycle rows.

### 15.2 What the cron does

For eligible Decan-phase students it handles:

1. preview opening
2. active window opening
3. grace period transition
4. missed transition
5. retry window reopening

### 15.3 Retry behavior

The cron computes retry windows when a Decan is missed:

- most missed Decans retry in the following year
- later-quarter Decans can use a longer retry cycle

The cron persists:

- `retry_year`
- `retry_window_open`
- `retry_window_close`

## 16. Graduation Flow

### 16.1 Graduation rule

The authoritative graduation logic lives in:

- `src/lib/mystery-school/graduation.ts`

Graduation requires all three:

1. Foundation complete
2. all 36 Decans completed
3. zero unexcused missed Decans

### 16.2 Graduation eligibility helper

- `checkGraduationEligibility(studentId)`

This function:

- loads the student’s `user_id`
- checks Foundation completion using the Training-backed helper
- counts completed Decans
- counts unresolved missed Decans
- returns eligibility plus blocking reasons

### 16.3 Graduation processing

- `processGraduation(studentId, adminClient)`

When eligible, it:

- sets `training_status = 'graduated'`
- sets `graduated_at`
- sets `graduation_verified_at`
- clears `graduation_blocked_reason`
- attempts to send a graduation congratulations email

### 16.4 Graduation cron

File:

- `src/app/api/cron/graduation-check/route.ts`

This job:

1. loads non-graduated Mystery School students
2. pre-filters by completed Decan count
3. checks graduation eligibility
4. either graduates the student or writes a blocked reason for admins

### 16.5 Graduation page

Learner graduation page:

- `src/app/mystery-school/training/graduation/page.tsx`

Current behavior:

- not graduated: shows journey progress, Foundation progress, Decan progress, unresolved missed count, roadmap, and next-step guidance
- graduated: shows certificate-style completion view

## 17. Admin Architecture Overview

The admin side is intentionally split between:

### 17.1 Admin Training

Used for Foundation curriculum content:

- programs
- categories
- lessons
- quizzes

Primary admin entry:

- `/admin/training`

### 17.2 Admin Mystery School

Used for Mystery School-specific oversight:

- Foundation coverage summary
- Decan content
- student progress
- journal review

Primary admin entry:

- `/admin/mystery-school`

## 18. Admin Mystery School Home

### Page

- `src/app/admin/mystery-school/page.tsx`

### Purpose

This page is a bridge between Mystery School administration and Admin Training.

It currently:

- explains that Foundation curriculum is managed in Admin Training
- provides shortcut cards into programs, weeks, lessons, and quizzes
- shows whether each Foundation week has active lesson coverage

### Supporting API

- `GET /api/admin/mystery-school/training-status`

This API reports:

- whether the Foundation program exists
- how many active week categories exist
- how many weeks are missing lessons
- shortcut links into Admin Training sections

## 19. Admin Decan Content Management

### Page

- `src/app/admin/mystery-school/decans/page.tsx`

### Purpose

This is the core Decan content management workspace.

It currently manages:

- thematic description
- tarot mapping
- ritual steps
- decan metadata completeness
- decan resources
- instructor journal references

### Main APIs

- `GET /api/admin/mystery-school/decans`
- `GET /api/admin/mystery-school/decans/[id]`
- `PUT /api/admin/mystery-school/decans/[id]`

### Decan list API behavior

The admin list API returns:

- Decan metadata
- ritual step counts
- resource counts
- instructor journal counts
- completeness flags including:
  - `metadata_complete`
  - `media_complete`
  - `ritual_complete`
  - `resources_complete`

### Single Decan admin API behavior

The single Decan admin API returns:

- Decan row
- all ritual steps
- all Decan resources
- all instructor journals

This gives the admin the full editorial picture for a single Decan.

## 20. Admin Student Oversight

### List page

- `src/app/admin/mystery-school/students/page.tsx`

### List API

- `GET /api/admin/mystery-school/students`

### What this admin view is doing

This page is not just showing raw `training_status`.

It now derives a more trustworthy phase badge using Training-backed Foundation completion:

- `foundation`
- `decans`
- `graduated`

This is important because a student row can say `training_status = 'decans'` while Foundation data still looks incomplete.

The API therefore returns:

- `derived_phase`
- `foundation_complete_derived`
- `phase_mismatch`

This protects the admin UI from showing a learner as being in Decans before Foundation is really done.

### Detail page API

- `GET /api/admin/mystery-school/students/[id]`

This returns:

- student identity
- membership status
- full Decan progress rows
- Foundation summary
- Training-backed Foundation week timeline
- legacy Foundation rows for fallback/history
- graduation eligibility snapshot

## 21. Admin Journal Review

### Page

- `src/app/admin/mystery-school/journals/page.tsx`

### Main API

- `GET /api/admin/mystery-school/journals`

### What it shows

This page aggregates learner submissions from:

- `scry_journals`
- `mundane_journals`

and enriches them with:

- student name
- student email
- Decan number
- Decan title
- submission preview

Supported filters:

- journal type
- Decan number
- submitted-from date
- submitted-to date

### Current implementation note

This admin journals feed now uses **direct table reads plus enrichment**, not fragile nested joins.

That was important because learner submissions were being saved correctly while the admin page was failing to display them due to broken join assumptions.

### Journal review endpoint

- `PUT /api/admin/mystery-school/journals/[id]/review`

Current behavior:

- updates review state on `decan_student_journal_entries`
- allows:
  - `reviewed`
  - `revision_requested`
- stores:
  - feedback text
  - rating
  - reviewer info
- fires a learner feedback notification

### Important implementation note

There is currently a distinction between:

- learner Decan journal submission tables:
  - `scry_journals`
  - `mundane_journals`
- admin review endpoint table:
  - `decan_student_journal_entries`

This means the review workflow and the learner submission workflow are not fully unified in one table model.

That should be treated as an architectural note for future consolidation work.

## 22. Core Mystery School Tables by Responsibility

### Entitlement and student lifecycle

- `mystery_school_students`
- `community_members` (legacy / parallel membership context)

### Foundation curriculum and progress

- `training_programs`
- `training_categories`
- `training_lessons`
- `lesson_completions`
- `category_completions`
- `student_foundation_progress` (legacy fallback only)

### Decan content

- `decans`
- `decan_rituals`
- `decan_resources`
- `decan_instructor_journals`

### Decan learner progress

- `student_decan_progress`
- `ritual_executions`
- `scry_journals`
- `mundane_journals`

### Graduation and lifecycle metadata

- `mystery_school_students.foundation_completed_at`
- `mystery_school_students.graduated_at`
- `mystery_school_students.graduation_verified_at`
- `mystery_school_students.graduation_blocked_reason`

## 23. Current Business Rules Confirmed in Code

### Foundation rules

- Foundation is Training-backed
- Foundation is sequential by week
- Week 1 always unlocked
- next week unlocks only after previous week is complete

### Decan rules

- Decans are time-based
- Decan work should be locked until Foundation is complete
- Decan completion requires ritual + scry + mundane
- completed Decans count toward 36-Decan graduation requirement

### Graduation rules

- Foundation complete required
- all 36 Decans required
- no unresolved missed Decans allowed

## 24. Current Exceptions, Risks, and Notes

### 24.1 Hardcoded learner bypass exists

The email:

- `perennial1@test.astrologypro.com`

has special-case bypass logic in current Decan APIs.

This can override normal gating and make some Decans appear active even when they otherwise would not be.

### 24.2 Legacy tables still exist

The codebase still carries legacy structures for compatibility and fallback, especially:

- `student_foundation_progress`

It is no longer the preferred source of truth for current Foundation progression.

### 24.3 Admin journal review model is not fully unified with learner journal tables

Learner journals and admin-reviewed journal entries are not currently a single unified data model.

This matters if you want a full instructor feedback loop inside the same Decan journal workflow.

### 24.4 Decan content is not managed through Admin Training

Foundation is managed through Admin Training.  
Decan content is managed separately through Mystery School-specific tables and admin screens.

At present:

- Foundation is Admin Training-backed
- Decans are Mystery School CMS-backed

## 25. Recommended Operational Reading Order for Teams

If a developer or operator needs to understand the module quickly, use this order:

1. `src/lib/mystery-school/access.ts`
2. `src/lib/mystery-school/foundation-progress.ts`
3. `src/lib/mystery-school/foundation-graduation.ts`
4. `src/app/api/mystery-school/training/foundation/route.ts`
5. `src/app/api/mystery-school/decans/route.ts`
6. `src/app/api/mystery-school/decan/[id]/route.ts`
7. ritual and journal action routes
8. `src/lib/mystery-school/graduation.ts`
9. admin student and journal APIs
10. cron routes

## 26. QA Checklist for the Current Module

### Access and Foundation

- learner without Mystery School access cannot enter Mystery School pages
- newly enrolled student lands in Foundation phase
- Foundation weeks unlock sequentially
- Foundation progress reflects Admin Training completions

### Foundation to Decans

- learner cannot perform normal Decan work before Foundation completion
- final Foundation completion advances `training_status` to `decans`
- `foundation_completed_at` is recorded

### Decans

- Decan dashboard shows correct lifecycle state
- Decan detail loads correct ritual/journal data
- ritual steps must be sequential
- scry submission validates minimum content
- mundane journal validates all three sections
- Decan becomes completed only when all three requirements are done

### Graduation

- graduation page reflects Foundation + Decan progress correctly
- graduation does not trigger when unresolved missed Decans remain
- eligible learner becomes graduated
- certificate-style graduation view appears only after graduation

### Admin

- `/admin/mystery-school` reflects Foundation coverage status
- `/admin/mystery-school/decans` shows full Decan content state
- `/admin/mystery-school/students` shows derived phase correctly
- `/admin/mystery-school/journals` displays learner journal submissions

## 27. Final Architecture Statement

As of this analysis date, the Mystery School system is best understood as:

- a **hybrid module**
- with **Foundation managed through Admin Training**
- and **Decans managed through Mystery School-specific tables and admin tools**

The learner journey is:

1. gain active Mystery School entitlement
2. complete Foundation Q1 in sequential Admin Training-backed weeks
3. transition into Decan phase
4. complete time-based Decan ritual and journal work
5. satisfy all graduation requirements
6. receive graduation status and certificate-style completion view

That is the current verified operating model of the module in this repository.
