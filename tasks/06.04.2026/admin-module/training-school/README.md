# Training School Task Index - 2026-04-06

## Scope
This folder is the canonical task set for aligning the Training School implementation with:
- the architect discussion notes provided on 2026-04-06
- the documented "Module 22 — Video Player + Slide Quiz Engine" requirement
- the current repo reality in `src/app/admin/training`, `src/app/api/admin/training`, `src/app/api/trainee/training`, and the related Supabase migrations

## Folder Structure
- `00-master-task.md`: master execution order and guardrails
- `01-governance/`: global settings, role access, and sequential-lock governance
- `02-authoring/`: program/category/lesson authoring and lesson delivery model
- `03-learner-experience/`: playback, quizzes, progress, resume, and completion flow
- `04-reporting-and-certification/`: reporting, analytics, and certificate delivery
- `09-requirements-traceability-checklist.md`: requirement-to-task mapping

## Existing Coverage Already In Repo
- top-level training hierarchy via `training_programs` -> `training_categories` -> `training_lessons`
- priority on program, category, and lesson entities
- program-level and category-level sequential flags
- previous lesson linkage on `training_lessons.previous_lesson_id`
- role-based program access and training-center settings
- lesson assets and multi-video support
- learner progress cache tables and completion tables
- admin analytics pages and APIs
- certificate page and verification route

## Main Gaps This Task Set Targets
- missing global sequential-lock governance in admin settings
- missing explicit product rule for "highest category's highest incomplete lesson" navigation
- authoring gaps around richer lesson content-source combinations
- missing in-video slide quiz trigger engine
- missing rewatch-event enforcement after wrong answers
- incomplete reporting specification for training/category/lesson/user views
- missing explicit mean/median/average completion-time analytics scope
- final certificate email flow needs validation against the intended graduation rule

## Source Files Reviewed During Analysis
- `src/app/admin/training/page.tsx`
- `src/app/admin/training/settings/page.tsx`
- `src/app/admin/training/programs/new/page.tsx`
- `src/app/admin/training/categories/new/page.tsx`
- `src/app/admin/training/lessons/new/page.tsx`
- `src/app/admin/training/quizzes/new/page.tsx`
- `src/app/admin/training/analytics/page.tsx`
- `src/app/api/admin/training/settings/route.ts`
- `src/app/api/admin/training/programs/route.ts`
- `src/app/api/admin/training/categories/route.ts`
- `src/app/api/admin/training/lessons/route.ts`
- `src/app/api/admin/training/quizzes/route.ts`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/components/trainee/lesson-viewer-quiz.tsx`
- `src/components/trainee/lesson-quiz.tsx`
- `supabase/migrations/20260405000001_training_programs.sql`
- `supabase/migrations/20260405000002_training_program_roles.sql`
- `supabase/migrations/20260406000005_training_center_enhancements.sql`
- `supabase/migrations/20260406000006_training_analytics.sql`
- `supabase/migrations/20260406000014_certificate_verification.sql`

## Working Rule
- Requirement naming mismatch is acceptable when current repo names already satisfy the same business function.
- Do not rename or replace existing tables/API routes only for terminology parity.
