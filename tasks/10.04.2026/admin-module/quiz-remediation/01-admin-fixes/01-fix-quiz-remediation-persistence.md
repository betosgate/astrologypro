# 01-Fix Quiz Remediation Persistence

- Status: Planned
- Date: 2026-04-10

## Objective
Enable and fix the "Wrong-answer video remediation" fields in the quiz editor so that metadata correctly persists to the database.

## Why This Task Exists
Coordinators can currently fill out remediation start/until timestamps, but these values are not saved. The admin interface displays a warning: "Remediation columns are not available in the current database yet." Research confirmed that the necessary columns are missing from the `quiz_questions` table because several recent migrations have not been applied to the current database instance.

## Current Repo State
- `supabase/migrations/20260408000111_quiz_question_remediation.sql` exists but is not applied.
- `src/lib/training/admin-quiz-questions.ts` has a compatibility layer that detects missing columns and falls back to stripping the remediation data to avoid SQL errors.
- The `isMissingRemediationColumnError` helper is currently using a strict string match that might be fragile.

## Exact Gap
1. The `quiz_questions` table lacks `remediation_video_id`, `remediation_video_index`, `remediation_start_seconds`, `remediation_replay_until_seconds`, and `remediation_message`.
2. The synchronization logic between `training_quizzes` (JSONB) and `quiz_questions` (table) correctly handles the column-not-found error by falling back, but this results in data loss for the specific remediation features.

## Required Implementation
- [ ] Apply the migration `supabase/migrations/20260408000111_quiz_question_remediation.sql`.
- [ ] Harden `isMissingRemediationColumnError` in `src/lib/training/admin-quiz-questions.ts` to use PostgreSQL error code `42703` (undefined_column) for safer detection.
- [ ] Verify that remediation values (start, until, message) are correctly saved to the DB and survive page refreshes in the admin module.

## Files To Read First
- `supabase/migrations/20260408000111_quiz_question_remediation.sql`
- `src/lib/training/admin-quiz-questions.ts`
- `src/app/api/admin/training/quizzes/[id]/route.ts`

## Likely Files To Change
- `src/lib/training/admin-quiz-questions.ts`
- Database schema (via migration application)

## Acceptance Criteria
- The "Remediation columns are not available" warning is no longer visible in the Quiz Editor.
- Remediation values (start, until, message) are correctly saved to the DB.
- Remediation values persist after a page refresh in the admin editor.

## Verification Test Plan
- [ ] Verify columns exist in the DB using the Supabase SQL editor or direct API check.
- [ ] Test a quiz update with remediation fields and confirm success in the UI.
- [ ] Refresh the edit page and confirm the values are re-hydrated correctly.
