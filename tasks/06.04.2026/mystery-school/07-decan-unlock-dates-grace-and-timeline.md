# Module 07 - Decan Unlock Dates, Grace Period, and Timeline

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/app/api/cron/decan-unlock/route.ts handles daily unlock + grace; admin can override start/end dates.

## Objective
Replace the current simplified decan timing behavior with a more explicit and requirement-aligned timing model.

## Current State In Repo
- Daily cron exists.
- Start/end dates are based on fixed seeded month/day values.
- Grace period is handled in code as `end + 2 days`.
- UI does not yet expose the full intended date behavior.

## Required Outcome
- Decan visibility and actionability follow clear lifecycle rules.
- Preview, active, grace, and locked states are distinct.
- The student dashboard and decan detail page explain dates clearly.

## Detailed Tasks
- [ ] Audit the current decan date model and document exactly where it diverges from the intended astronomical behavior.
- [ ] Decide the minimum viable enhancement:
  - fixed seeded ranges with improved lifecycle fields
  - or actual yearly astronomical recalculation
- [ ] Add explicit lifecycle fields for:
  - preview unlock
  - action start
  - action close
  - grace close
- [ ] Update cron logic to compute and persist these lifecycle transitions reliably.
- [ ] Add support for a distinct `grace` state instead of inferring it only from date math.
- [ ] Implement “preview but read-only” behavior for upcoming sign/decan content.
- [ ] Update the student dashboard to display:
  - `Active [START] – [END]`
  - `Grace period ends [DATE]`
  - `Unlocks [DATE]`
  - `Available [SEASON/YEAR]` where appropriate
- [ ] Add countdown behavior for active decans.
- [ ] Add a grace-period banner on the decan detail page.
- [ ] Make sure Capricorn/year-boundary cases are correct.

## Acceptance Criteria
- Student-facing dates are explicit and trustworthy.
- Grace is represented as a real business state.
- Preview content is visible but not actionable before the action window opens.
