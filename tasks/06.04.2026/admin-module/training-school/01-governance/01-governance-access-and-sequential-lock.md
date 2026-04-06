# Module 01 - Governance, Access, and Sequential Lock

## Objective
Complete the top-level Training School governance model so admins can control both who can see Training School navigation and how sequential progression is enforced across programs.

## Current State In Repo
- `training_settings.allowed_roles` exists and is editable from `/admin/training/settings`.
- `training_programs.is_sequential` exists.
- `training_categories.is_sequential` exists.
- Learner APIs already enforce program-level and category-level locks based on those flags.
- There is no admin-level global sequential-lock control or documented precedence rule.

## Required Outcome
- Admin settings expose the two common controls called out by the architect:
  - sequential lock on/off
  - which roles can access Training School nav
- The precedence between program-level and category-level sequential behavior is explicit and testable.
- Existing program/category flags remain valid and are not renamed.

## Detailed Tasks
- [ ] Audit the existing `training_settings` schema and extend it minimally if a global sequential-lock field does not exist yet.
- [ ] Update `/api/admin/training/settings` and `/admin/training/settings` to support the global sequential-lock control in addition to `allowed_roles`.
- [ ] Define and document the precedence rule for:
  - global training setting
  - `training_programs.is_sequential`
  - `training_categories.is_sequential`
- [ ] Implement the architect rule: category-level sequential logic exists independently, but when category-level sequential is off, category priority should control next-entry behavior.
- [ ] Validate that Training School navigation visibility uses the configured access rules and does not depend only on raw auth state.
- [ ] Ensure existing learner routes fail safely when a user can hit a URL directly without nav access.
- [ ] Record any admin audit/logging requirement if training governance changes should be visible in the activity log.

## Acceptance Criteria
- Admins can configure role access and the top-level sequential-lock behavior from settings.
- Program/category sequential rules are deterministic and documented.
- Learner-side lock enforcement respects the configured governance model.

## Verification Test Plan
- [ ] As an admin, update allowed roles and confirm the change persists through `/api/admin/training/settings`.
- [ ] Toggle the global sequential-lock setting on and off and confirm the stored value round-trips in the UI and API.
- [ ] Verify a role without access cannot see Training School nav and cannot consume Training School routes through direct URL access.
- [ ] Verify a role with access can still consume accessible programs.
- [ ] With program sequential on and category sequential on, confirm later categories/lessons remain locked until earlier ones complete.
- [ ] With program sequential on and category sequential off, confirm category priority determines which category is next while intra-category lesson behavior follows the agreed rule.
