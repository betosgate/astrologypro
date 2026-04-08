# Module 04 - Add Question-Level Remediation Metadata and Authoring Contract

- Status: Planned

## Objective
Define and implement the data contract required for per-question lesson-quiz remediation, so each lesson quiz question can send the learner back to a specific training-video timestamp before retry.

## Why This Task Exists
The requested quiz behavior cannot be implemented cleanly without explicit remediation metadata. A wrong answer must know:
- which video to target
- where playback should restart
- how much of the segment must be replayed before retry

The current batch-submit lesson quiz model does not encode that contract.

## Current Repo State
- `quiz_questions` already stores lesson quiz question content.
- `lesson_quiz_triggers` and `lesson_trigger_progress` already support timestamp-based interruption and replay for in-video triggers.
- Admin lesson editing already supports question CRUD through `/api/admin/training/quiz/[lessonId]`.
- There is no current lesson-quiz contract that maps each ordinary lesson quiz question to a remediation video timestamp/window.

## Exact Gap
- Lesson quiz questions do not currently carry the metadata needed to drive:
  - wrong-answer redirect messaging
  - video seek target
  - required replay window
  - multi-video lesson targeting when a lesson has more than one video

## Fixed Behavior Decisions
- Each lesson quiz question used by the new remediation flow must carry explicit remediation metadata.
- The metadata contract should support:
  - question id
  - remediation video identity or index when multiple videos exist
  - remediation start timestamp
  - required replay-until timestamp or replay duration
- Prefer additive schema changes to existing lesson-quiz question storage over introducing an entirely separate quiz-question system.
- If the existing trigger tables can be generalized safely for this purpose, reuse that model rather than inventing a third remediation mechanism.
- The contract must be admin-authorable or at minimum admin-editable; do not hardcode remediation timestamps in frontend code.

## Required Implementation
- Choose the cleanest additive data model for lesson-quiz remediation metadata.
- Implement the persistence layer for that metadata.
- Update the relevant admin quiz authoring contract so the remediation fields can be created and edited.
- Ensure learner-facing lesson detail responses expose the remediation metadata needed by the new quiz runtime, without leaking irrelevant server-side grading fields.
- Keep backward compatibility clear for existing quiz questions that do not yet have remediation metadata.

## Files To Read First
- `src/app/api/admin/training/quiz/[lessonId]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/quiz/route.ts`
- `src/app/api/admin/training/lessons/[id]/triggers/route.ts`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- `supabase/migrations/20260407000072_lesson_quiz_triggers.sql`

## Likely Files To Change
- `supabase/migrations/*` for additive remediation metadata storage
- `src/app/api/admin/training/quiz/[lessonId]/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/admin/training/lessons/[id]/edit/page.tsx`
- any shared type definitions used by lesson quiz responses

## API and Schema Constraints
- Prefer additive changes to existing `quiz_questions` or existing trigger-related structures.
- Do not replace `quiz_questions` outright.
- Do not introduce a new unrelated lesson-quiz subsystem if the current trigger/video model can be extended.

## Dependencies
- Execute after Module 01.
- Execute before Module 05.

## Acceptance Criteria
- The repo has a clear persisted contract for mapping a lesson quiz question to a remediation video segment.
- Admin authoring/editing can populate that contract.
- Learner lesson detail data exposes enough remediation metadata for the new quiz runtime.
- Existing questions without remediation metadata fail gracefully under a defined backward-compatibility rule.

## Verification Test Plan
- [ ] Create or update a lesson quiz question with remediation metadata and confirm it persists correctly.
- [ ] Load learner lesson detail and confirm the required remediation fields are present.
- [ ] Confirm multi-video lessons can identify the correct remediation target.
- [ ] Confirm older quiz questions without remediation metadata are handled explicitly rather than silently misbehaving.

## Out Of Scope
- final learner quiz runtime behavior
- top-level Training Center progress summary
