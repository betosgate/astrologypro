# Training School UX and Quiz Follow-Up - AI Execution Master Task

- Status: Planned (2026-04-08)

## Objective
Implement the next set of trainee-facing Training School improvements requested after the previous follow-up pack was completed:
- make sequential-lock behavior fully reliable and learner-readable
- turn program entry into a standard split workspace instead of a direct lesson deep-link
- improve the Training Center overall-progress summary so it reflects all accessible lessons, split by status
- replace end-of-quiz batch submission with question-by-question remediation synced to video playback

## Canonical Folder
- Repo path: `tasks/08.04.2026/admin-module/training-school`
- Previous baseline packs:
  - `tasks/06.04.2026/admin-module/training-school`
  - `tasks/07.04.2026/admin-module/training-school`

## Why This Pack Exists
The repo already has a working Training School core, but the current learner experience still feels too implementation-driven in several places:
- the top-level progress summary is too shallow
- program entry skips the program workspace and jumps straight to content
- sequential lock behavior is not fully trustworthy from every learner interaction path
- the legacy lesson quiz model does not match the desired remediation-first learning flow

This pack isolates those UX and behavior changes into a deterministic execution order so an implementation agent can work from stable dependencies instead of mixing unrelated redesigns.

## Non-Negotiable Constraints
- Do not rename existing tables, routes, or core entities only for terminology alignment.
- Reuse the existing hierarchy:
  - `training_programs`
  - `training_categories`
  - `training_lessons`
- Reuse existing progress/completion tables and extend them only when required by the new remediation model.
- Read the relevant Next.js docs under `node_modules/next/dist/docs/` before changing framework-sensitive route or fetch behavior.
- Do not create a second learner progression engine parallel to `/api/trainee/training/programs` unless a task explicitly requires a narrowly scoped helper.

## Existing Repo Truth
- `/trainee/training` is the top-level Training Center page and already fetches from `/api/trainee/training/programs`.
- `/trainee/training/[programId]` already renders categories and lessons, but its current layout is too narrow and the index-page CTA can jump directly to a lesson.
- Sequential access metadata already exists in learner APIs, but not every learner interaction path treats it as equally authoritative.
- Trigger-aware video remediation infrastructure already exists for in-video quiz triggers.
- Lesson-level batch quiz submission still exists as a separate learning path and does not yet match the desired per-question remediation model.

## Requested Change Set
1. Replace the current overall-progress summary on `/trainee/training` with a more explicit status split:
   - `Not Started`
   - `Ongoing`
   - `Completed`
   - counts must reflect all lessons the learner can access, not only started content
2. Change `Start Program` so it opens a structured program workspace instead of jumping straight to the current lesson.
3. Make sequential lock behavior fully reliable and learner-readable across categories, lessons, sidebars, and direct route attempts.
4. Replace batch lesson-quiz submission with question-by-question remediation:
   - wrong answer stops the attempt immediately
   - learner sees a temporary message
   - UI focus returns to the video
   - video seeks to a question-specific timestamp and replays the required segment
   - video pauses and focus returns to the quiz for retry

## Execution Order
1. `01-governance/01-harden-sequential-lock-and-blocked-access-feedback.md`
2. `02-learner-experience/02-redesign-program-entry-into-two-pane-workspace.md`
3. `02-learner-experience/03-redesign-training-center-overall-progress-summary.md`
4. `03-quiz-remediation/04-add-question-level-remediation-metadata-and-authoring-contract.md`
5. `03-quiz-remediation/05-rebuild-lesson-quiz-into-stepwise-video-remediation-flow.md`

## Dependency Rules
- Do not redesign the program workspace before the final sequential-lock rule and blocked-access messaging are stable.
- Do not finalize the top-level Training Center counts before the meaning of `not started`, `ongoing`, and `completed` is fixed against real learner-accessible lessons.
- Do not implement the new quiz runtime before the remediation metadata contract is settled.
- Prefer reusing the existing trigger-based playback control path when implementing lesson-quiz remediation instead of building a totally separate player-control model.

## Standard Per-Task Reading Order
For each child task, the implementation agent should follow this order:
1. Read `Objective` and `Fixed Behavior Decisions`.
2. Read `Files To Read First`.
3. Confirm the `Exact Gap` against current code.
4. Implement only the `Required Implementation`.
5. Validate against `Acceptance Criteria` and `Verification Test Plan`.

## Done Definition
- Each child task is implemented, not only analyzed.
- The Training Center index reflects learner-wide accessible lesson status accurately.
- Program entry feels like a standard program workspace instead of a forced deep-link.
- Sequential lock behavior is enforced consistently in UI and routes, with understandable learner feedback.
- Lesson quiz remediation works one question at a time and drives the learner back through the relevant video segment before retry.
