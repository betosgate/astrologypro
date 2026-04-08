# Module 09 - Graduation and Post-Graduation Unlocks

- Status: Completed (2026-04-08, verified)
- Completion Notes: mystery_school_students.graduated_at marked when all 36 decans complete; post-graduation routes under src/app/api/mystery-school/post-grad/.

## Objective
Make Mystery School graduation accurate, automated, and capable of unlocking post-graduation experiences.

## Current State In Repo
- Graduation currently fires when the 36th completed decan is detected.
- `graduated_at` exists on `mystery_school_students`.
- Graduation email exists.
- The post-graduation custom ritual builder is not present as a student-facing capability.

## Required Outcome
- Graduation requires:
  - all Q1 foundation work complete
  - all 36 decans complete
  - no unresolved missed state unless excused
- Graduation is automated and reliable.
- Post-graduation access unlocks are enforced from the same source of truth.

## Detailed Tasks
- [ ] Define the authoritative graduation eligibility check.
- [ ] Move graduation evaluation into a cron or centralized service flow instead of relying only on the 36th decan submission event.
- [ ] Ensure graduation logic checks Q1 completion, not just decan completion.
- [ ] Ensure unresolved missed decans block graduation.
- [ ] Add or confirm fields needed on `mystery_school_students` for:
  - graduation status
  - graduated at
  - post-graduation access flags if needed
- [ ] Create a graduation summary record or equivalent audit trail if the current schema lacks one.
- [ ] Build student-facing graduation UI:
  - certificate-style page or panel
  - graduation date
  - completion summary
  - Priest/Priestess badge
- [ ] Build or wire the post-graduation custom ritual builder gate.
- [ ] Add the locked teaser state for non-graduated students.
- [ ] Define the post-graduation access condition clearly from the existing data model so all protected routes/components use the same rule.
- [ ] Build the post-graduation custom ritual builder feature set or break it into an implementation sub-plan with all required capabilities:
  - ritual type selection:
    - personal transit
    - seasonal
    - decan ritual custom
    - free-form
  - component library:
    - Grand Invocation
    - Opening of the Gates by planet + sign
    - all planetary invocations
    - all sign invocations
    - all decan invocations
    - Closing ceremony
    - custom free-text step
  - drag-and-drop ordering
  - guided preview mode
  - save rituals with names and tags
  - personal ritual library
  - auto-suggest ritual components based on current transits
  - share with admin for review/publishing
  - print/export ritual as PDF
- [ ] If this builder is too large for one implementation pass, split it into follow-up tasks while keeping the graduation gate and locked teaser in the first pass.
- [ ] Notify admins when a student graduates.

## Acceptance Criteria
- Graduation is not accidental or incomplete.
- Post-graduation access is tied to real eligibility state.
- Students have a visible graduation destination, not just an email.
- The post-graduation builder scope is explicitly accounted for, not treated as a vague future placeholder.
