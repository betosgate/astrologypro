# Module 01 - Harden Sequential Lock and Blocked-Access Feedback

- Status: Planned

## Objective
Make sequential locking fully reliable across learner navigation paths and add clear blocked-access feedback whenever a learner tries to open future categories or lessons out of order.

## Why This Task Exists
The repo already has sequential-lock logic, but the current experience still contains edge cases:
- some paths only look locked visually
- some pages compute lock state differently from the route/API layer
- blocked access is not always explained to the learner in a clear, standard way

This task makes route authority, clickable UI behavior, and learner messaging line up before the workspace redesign builds more interaction surfaces on top.

## Current Repo State
- `training_settings.global_sequential_lock` already exists and is used in learner training APIs.
- `/api/trainee/training/programs` already returns `is_locked` and `lock_reason` style metadata for categories and lessons.
- `/api/trainee/training/lessons/[id]` already blocks some direct route access.
- Program, category, and lesson pages still contain local navigation decisions and click behavior that can drift from authoritative lock semantics.
- Current learner lock messaging is mostly passive text or native route denial, not a coordinated UI feedback pattern.

## Exact Gap
- Learners can still encounter inconsistent behavior between:
  - what looks unlocked
  - what is clickable
  - what the route will actually allow
- When blocked, the learner does not always get an immediate, understandable explanation.

## Fixed Behavior Decisions
- Route/API enforcement remains authoritative.
- UI should still expose locked state before click where possible.
- If a learner actively clicks or tries to navigate to locked content from a visible interaction surface, show standard feedback immediately.
- Prefer toast/snackbar feedback for blocked clicks, with the exact message derived from the same lock reason already used by route/API metadata.
- Use explicit messages such as:
  - `Complete the previous category first to unlock this section.`
  - `Complete the previous lesson first to continue in sequence.`
- Global sequential lock plus program/category sequential flags remain the only lock controls:
  - `training_settings.global_sequential_lock`
  - `training_programs.is_sequential`
  - `training_categories.is_sequential`

## Required Implementation
- Audit every active learner interaction path that can open training content:
  - Training Center program cards
  - program workspace category panels
  - program workspace lesson panels
  - category page lesson links
  - lesson-page sidebar navigation
  - any resume/next button behavior
- Ensure each of those paths either:
  - routes only to unlocked content
  - or intercepts the click and shows blocked-access feedback
- Remove or reduce any remaining local lock computations that can contradict authoritative API metadata.
- Ensure direct route access to locked lesson content still fails safely server-side.
- Where server-side denial occurs, make sure the learner-facing page can surface a readable explanation instead of only failing generically.

## Files To Read First
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`

## Likely Files To Change
- `src/app/trainee/training/page.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- `src/components/trainee/lesson-viewer-client.tsx`
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- any shared learner lock helper extracted to remove duplication

## API and Schema Constraints
- Keep `training_settings.global_sequential_lock` as the global master switch.
- Keep `/api/trainee/training/programs` as the main source of lock metadata unless a small helper extraction is clearly cleaner.
- Do not add a second lock-settings table or route.

## Dependencies
- None. Execute first in this pack.

## Acceptance Criteria
- A learner cannot successfully access future categories or lessons when the relevant sequential lock controls are active.
- Locked state is consistent between visible UI, click behavior, and direct-route behavior.
- Blocked click attempts show immediate, understandable feedback.
- Lock messaging uses a standard pattern instead of silent failure or ambiguous redirects.

## Verification Test Plan
- [ ] With global lock on and sequential flags active, attempt to open a future category from the program UI and confirm a blocked-access message appears.
- [ ] With global lock on and a sequential category active, attempt to open a future lesson from every visible learner surface and confirm the same blocked-access rule applies.
- [ ] Attempt direct URL entry into a locked lesson and confirm route denial remains authoritative and understandable.
- [ ] Turn global lock off and confirm direct navigation is restored where intended.

## Out Of Scope
- redesign of the overall progress summary
- stepwise lesson quiz remediation
