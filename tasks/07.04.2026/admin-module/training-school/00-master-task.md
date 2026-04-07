# Training School Follow-Up - AI Execution Master Task

## Objective
Close only the Training School gaps that remain after the first implementation pass. This pack is a follow-up execution pack, not a fresh feature-design pack.

## Canonical Folder
- Repo path: `tasks/07.04.2026/admin-module/training-school`
- Related baseline pack: `tasks/06.04.2026/admin-module/training-school`

## Why This Pack Exists
The repo already contains meaningful Training School implementation work. The remaining work is mostly integration, authority, and learner-flow consistency work. These tasks isolate only the unresolved parts so an implementation agent can execute them in sequence without re-planning the whole module.

## Global Working Rules
- Do not rename existing schema, tables, or API routes only for wording parity.
- Reuse current sources of truth where they already exist.
- Prefer extending current helpers and route responses over creating parallel services.
- Do not leave legacy full-lesson quiz completion as the authoritative path for trigger-enabled lessons.
- Treat this pack as implementation work. Analysis is allowed only when needed to unblock a concrete code change.

## Shared Data and API Constraints
- Keep `training_programs`, `training_categories`, `training_lessons`, `training_settings`, `quiz_questions`, `quiz_attempts`, `lesson_progress`, `lesson_completions`, `category_completions`, `user_program_progress`, and `user_category_progress`.
- Keep `training_settings.global_sequential_lock` as the only global sequential-lock setting.
- Keep `/api/trainee/training/programs` and `/api/trainee/training/lessons/[id]` as the primary learner data sources unless a blocking defect makes a targeted helper extraction necessary.
- Keep the existing certificate verification route and certificate fields.

## Verified Remaining Gaps
1. Global sequential lock exists in admin settings but is not enforced by learner routes.
2. `/trainee/training` can fail with a server-side runtime error for at least some real user states.
3. Trigger-aware playback exists in component code but is not fully wired into the live trainee lesson page.
4. Trigger answer flow does not yet own lesson completion authority.
5. Exact playback-position persistence and trigger resume semantics are incomplete.
6. Sidebar locking and next-item routing still rely on older assumptions in parts of the learner UI.
7. Graduation and certificate issuance still depend too much on the legacy completion path.

## Actual Flow Anchors
- `/trainee/training` is server-rendered and currently fetches only from `/api/trainee/training/programs`.
- `/api/trainee/training/programs` is the current source of truth for learner program, category, lesson, lock, and next-item metadata.
- `/api/trainee/training/lessons/[id]` is the current source of truth for lesson detail, quiz questions, assets, videos, trigger data, and route-level lesson access gating.
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx` still computes sidebar lock state locally from `previous_lesson_id`, so the lesson page is currently the main place where learner UI behavior diverges from API lock metadata.
- Trigger progress currently writes to `lesson_trigger_progress`, while authoritative lesson completion still comes from `lesson_completions`.
- Graduation currently has more than one active path:
  - `/api/trainee/training/lessons/[id]/complete` can auto-graduate based on `user_program_progress`
  - `/api/trainee/check-graduation` can also graduate by counting all active lessons vs `lesson_completions`
- Follow-up tasks must reduce these contradictions rather than introduce new parallel flow paths.

## Execution Order
1. `01-governance/01-enforce-global-sequential-lock-in-learner-routes.md`
2. `01-governance/02-fix-trainee-training-route-server-error.md`
3. `02-learner-experience/02-wire-trigger-player-into-trainee-lesson-page.md`
4. `02-learner-experience/03-make-trigger-completion-the-authoritative-lesson-gate.md`
5. `02-learner-experience/04-add-exact-playback-resume-and-trigger-state-persistence.md`
6. `02-learner-experience/05-align-sidebar-locking-and-next-item-routing.md`
7. `03-certification/06-align-graduation-and-certificate-flow-with-trigger-completion.md`

## Dependency Rules
- Do not finalize lesson completion authority before the trigger player is active on the trainee lesson page.
- Do not finalize sidebar and next-item rules before global sequential-lock behavior is enforced consistently.
- Do not finalize graduation or certificate behavior before trigger-based lesson completion becomes authoritative.
- If `/trainee/training` is broken, fix that early because it blocks realistic end-to-end verification.

## Standard Per-Task Reading Order
For each child task, the implementation agent should follow this order:
1. Read `Objective` and `Fixed Behavior Decisions`.
2. Read `Files To Read First`.
3. Verify the `Exact Gap` against current code.
4. Implement only the `Required Implementation`.
5. Validate against `Acceptance Criteria` and `Verification Test Plan`.

## Done Definition
- Every child task is implemented, not only analyzed.
- Each child task passes a direct code-level verification step.
- Trigger-based lesson progression is the real trainee-facing behavior for trigger-enabled lessons.
- Legacy fallback behavior remains only where explicitly allowed by the child task.
