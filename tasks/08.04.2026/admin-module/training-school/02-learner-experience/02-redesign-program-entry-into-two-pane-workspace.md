# Module 02 - Redesign Program Entry Into a Two-Pane Workspace

- Status: Planned

## Objective
Change program entry so `Start Program` and `Continue` land the learner on a structured program workspace instead of jumping directly into a lesson, while preserving priority-based resume behavior.

## Why This Task Exists
The current entry flow is too abrupt: the learner clicks a program CTA and is taken straight into lesson content. That skips the program-level context and wastes the page space already available for a more standard, measured workspace.

The requested experience is a clear split layout:
- left `1/3`: category list by priority
- right `2/3`: lesson list and the current lesson’s exposed panel

## Current Repo State
- `/trainee/training` currently computes program CTA routes that can deep-link directly to a lesson.
- `/trainee/training/[programId]` already has the core program/category/lesson data, but it renders as a simpler stacked page.
- `/api/trainee/training/programs` already exposes enough metadata to determine:
  - next category
  - next lesson
  - category completion
  - lesson completion
  - lock state
- The current code already follows priority order and progress-aware selection; it just does not present that state in a workspace-oriented layout.

## Exact Gap
- Program entry skips the program overview/workspace layer.
- The current program page does not deliberately use horizontal space.
- Initial selection and exposed/collapsed panel behavior are not designed as a first-class workspace interaction.
- Large program category lists are not progressively revealed.

## Fixed Behavior Decisions
- Program CTA from `/trainee/training` should route to `/trainee/training/[programId]`, not directly to the lesson.
- Initial selection rules:
  - new program: lowest-priority available category + lowest-priority available lesson
  - in-progress program: current category + current lesson based on progress metadata
- Layout rules:
  - left `1/3`: categories in priority order
  - right `2/3`: lessons for the selected category in priority order
- Lesson panels should use clear status styling:
  - `Not Started`
  - `Ongoing`
  - `Completed`
- The current lesson should render expanded by default with its key content/details exposed.
- Previous and future lessons should render collapsed by default unless the learner explicitly opens them.
- If the program has more than 5 categories, progressively reveal the rest.
- Default progressive-reveal pattern: `View more` / `Show remaining` rather than infinite scroll.

## Required Implementation
- Change top-level program CTA routing on the Training Center index so it always opens the program page first.
- Redesign `/trainee/training/[programId]` into a two-pane workspace using the current learner metadata:
  - categories pane on the left
  - lesson/status pane on the right
- Preserve existing priority-driven and progress-driven initial selection logic, but express it through the new workspace layout.
- Add explicit selected-state behavior so the current category and lesson are obvious on first load.
- Make the current lesson panel expanded by default.
- Keep locked categories/lessons visibly present when appropriate, but non-enterable under Module 01 rules.
- Add progressive reveal for category lists longer than 5.

## Files To Read First
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`

## Likely Files To Change
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- any new client helper/component extracted for category selection and lesson panel expansion
- possibly `src/app/api/trainee/training/programs/route.ts` if additional page-safe metadata is needed

## API and Schema Constraints
- Reuse `/api/trainee/training/programs` as the primary source of program/category/lesson state.
- Do not create a second program-detail endpoint unless the existing response cannot support the workspace cleanly.
- Keep priority ordering and existing lock/completion metadata stable.

## Dependencies
- Execute after Module 01.

## Acceptance Criteria
- Clicking `Start Program` or `Continue` from the Training Center opens the program page, not a lesson deep-link.
- The program page uses a deliberate split layout with categories on the left and lessons on the right.
- Initial category and lesson selection follow real learner progress and priority rules.
- The current lesson panel is expanded by default; other lesson panels are collapsed by default.
- Programs with more than 5 categories progressively reveal the extra categories instead of rendering all at first load.

## Verification Test Plan
- [ ] From `/trainee/training`, click a not-started program and confirm the learner lands on `/trainee/training/[programId]`.
- [ ] Confirm a brand-new learner sees the first eligible category and lesson selected.
- [ ] Confirm an in-progress learner sees the current category and lesson selected.
- [ ] Confirm the right-pane lesson cards reflect `Not Started`, `Ongoing`, and `Completed` clearly.
- [ ] Confirm only the current lesson is expanded initially.
- [ ] Confirm a program with more than 5 categories reveals the remainder only after an explicit user action.

## Out Of Scope
- top-level overall-progress summary redesign
- lesson-quiz remediation engine
