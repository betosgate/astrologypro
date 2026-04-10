# Training School Quiz Remediation Persistence - AI Execution Master Task

- Status: Planned (2026-04-10)

## Objective
Fix the issue where quiz remediation fields (wrong-answer time-stamps and messages) are not persisting in the database.

## Canonical Folder
- Repo path: `tasks/10.04.2026/admin-module/quiz-remediation`

## Why This Pack Exists
Coordinators can author remediation data in the quiz editor, but these values return to null after saving and refreshing. Research confirms the current database instance is missing the necessary schema migrations (Module 04), resulting in data loss during synchronization between the quiz JSONB and the `quiz_questions` table.

## Requested Change Set
1. Apply the missing quiz remediation schema migration (`20260408000111_quiz_question_remediation.sql`).
2. Harden the `isMissingRemediationColumnError` helper in the codebase to use more reliable PostgreSQL error codes for detection.
3. Ensure that all quiz questions correctly preserve remediation metadata after authoring.

## Execution Order
1. `01-admin-fixes/01-fix-quiz-remediation-persistence.md`

## Done Definition
- The "Remediation columns are not available" warning is removed from the quiz editor.
- Quiz remediation fields persist in the database and survive page refreshes in the admin module.
- The compatibility layer in `src/lib/training/admin-quiz-questions.ts` is robust against various PostgREST error formats.
