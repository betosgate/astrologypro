# Revisit And Harden Sequential Lock Behavior And Blocked Access Feedback

- Status: Planned

## Objective
Re-audit and harden the sequential lock behavior for both categories and lessons so locked items behave exactly as expected, and provide a clear, standard blocked-access message when a learner attempts to open a locked category or lesson.

## Why This Task Exists
Sequential progression is one of the core governance rules of the training flow. If the lock logic is even slightly inconsistent, learners get one of two bad outcomes:
- they can bypass required sequence rules
- they get blocked unexpectedly or with unclear messaging

This needs to be treated as both:
- a data/logic correctness problem
- a learner feedback problem

## Current Repo State
- Sequential lock behavior is currently computed in multiple trainee surfaces:
  - `/api/trainee/training/programs`
  - `/api/trainee/training/lessons/[id]`
  - category/program workspace UI
  - lesson/sidebar navigation UI
- The current system already includes:
  - program-level sequential flags
  - category-level sequential flags
  - global lock setting in `training_settings.global_sequential_lock`
  - UI-level blocked feedback through `LockedLink` and direct `toast.warning(...)`
  - route-level lock enforcement for lesson access
- Existing lock messages include variants like:
  - `Complete the previous lesson first to continue in sequence.`
  - `Complete the previous category first to unlock this section.`

## Exact Gap
- The lock behavior needs to be revisited as a whole rather than trusted piecemeal.
- Category and lesson locking should match the expected progression rules exactly across:
  - visible UI states
  - click behavior
  - direct URL access
  - workspace selection interactions
- Blocked-access feedback should be standardized and understandable, rather than relying on scattered local messaging decisions.

## Fixed Behavior Decisions
- Sequential lock rules must be enforced consistently at both:
  - UI interaction level
  - route/API access level
- Categories should lock according to the intended category progression rules.
- Lessons should lock according to the intended lesson progression rules.
- A learner trying to access a locked category or lesson should receive a clear, plain-language message.
- Preferred feedback pattern:
  - lightweight inline feedback such as snackbar/toast is acceptable for blocked click attempts
  - dialog/popover is acceptable only if it is meaningfully clearer and not overbearing
- Whatever feedback pattern is chosen should be consistent across the trainee experience.

## Required Implementation
- Reconstruct the full expected sequential lock contract for:
  - program-to-category progression
  - category-to-lesson progression
- Audit all current lock computations and identify mismatches between:
  - workspace cards
  - category selection
  - lesson list actions
  - lesson deep-link access
  - any inline lesson-content workflow introduced by newer tasks
- Harden the implementation so the same lock decision is reflected in:
  - visible locked state
  - click interception behavior
  - route/API enforcement
- Standardize blocked-access feedback messaging for:
  - locked categories
  - locked lessons
- Choose one consistent learner-facing feedback pattern and apply it uniformly where practical.
- Ensure the messages explain what the learner must do next, not just that access is denied.

## Files To Read First
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/components/trainee/locked-link.tsx`
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/[lessonId]/page.tsx`
- any newly introduced inline lesson workspace files from the current task pack

## Likely Files To Change
- `src/app/api/trainee/training/programs/route.ts`
- `src/app/api/trainee/training/lessons/[id]/route.ts`
- `src/components/trainee/locked-link.tsx`
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/[programId]/[categoryId]/page.tsx`
- optionally shared lock helper(s) if the logic should be centralized

## API and Schema Constraints
- Do not create a second competing lock computation path if the logic can be centralized or reused.
- Do not rely only on client-side lock enforcement.
- Preserve current schema-level concepts:
  - program `is_sequential`
  - category `is_sequential`
  - global sequential lock setting
- Prefer one source of truth or one clearly shared decision model for lock outcomes.

## Dependencies
- Closely related to the program workspace and inline lesson-content tasks, because lock behavior must remain correct in those newer interaction models.
- Can also be executed independently as a hardening pass.

## Acceptance Criteria
- Categories lock exactly according to the expected sequence rules.
- Lessons lock exactly according to the expected sequence rules.
- Locked states are reflected consistently in the visible UI.
- Direct access attempts to locked content are still blocked at the route/API level.
- Learners receive a clear, understandable blocked-access message when trying to open locked content.
- The blocked-access message tells the learner what prerequisite action is needed.

## Verification Test Plan
- [ ] Confirm a learner cannot open a locked category from the program workspace.
- [ ] Confirm a learner cannot open a locked lesson from the program workspace or category view.
- [ ] Confirm direct URL access to a locked lesson is blocked correctly.
- [ ] Confirm unlocked categories and lessons remain accessible normally.
- [ ] Confirm the same lock state is reflected consistently in card/button/link styling and in click behavior.
- [ ] Confirm the blocked-access message is understandable and explains what the learner must complete first.
- [ ] Confirm behavior remains correct when global sequential lock is disabled.

## Out Of Scope
- redesigning the full training information architecture
- changing lesson completion semantics unrelated to sequence rules
- introducing a brand-new permissions model beyond sequential locking
