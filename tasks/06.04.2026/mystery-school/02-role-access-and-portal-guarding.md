# Module 02 - Role Access and Portal Guarding

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/lib/user-roles.ts + getUserPortals; community layout redirects PM-only, /mystery-school layout gates by mystery_school_students.

## Objective
Make sure Mystery School access control satisfies the requirement behavior without forcing a move to a `user_roles` table.

## Current State In Repo
- Portal detection is handled in `src/lib/user-roles.ts`.
- Community access is gated by `community_members`.
- Mystery School is modeled as a community membership type, not a separate role row.

## Required Outcome
- Users can hold multiple portal identities.
- Mystery School curriculum routes are guarded correctly.
- The role model remains acceptable even if the schema names differ from the requirement document.

## Detailed Tasks
- [ ] Audit all Mystery School routes and APIs for consistent access checks.
- [ ] Confirm every member-facing Mystery School route rejects:
  - unauthenticated users
  - inactive members
  - non-Mystery-School community members
- [ ] Confirm every admin Mystery School route requires admin authorization consistently.
- [ ] Review whether current `community_members.membership_type` is sufficient for the intended business rules.
- [ ] If needed, document the supported equivalence:
  - requirement says separate role
  - repo uses active community member with `membership_type = mystery_school`
- [ ] Ensure portal switcher behavior remains correct for users who also have:
  - diviner
  - trainee
  - client
  - advocate
- [ ] Remove any route logic that assumes Mystery School is just a copy change inside the general community portal if stricter guarding is needed.
- [ ] Add missing tests for route/API access behavior.

## Acceptance Criteria
- Mystery School pages and APIs are accessible only to eligible users.
- Multi-portal users can still navigate correctly.
- Access control does not rely on fragile UI-only checks.
