# Module 01 - Governance, Access, and Sequential Lock

- Status: Completed (2026-04-08, verified)
- Completion Notes: allowed_roles per program (migration 20260405000002), global_sequential_lock per training_settings (migration 20260407000081); enforced in trainee API routes.

## Objective
Implement the missing top-level Training School governance controls so admin settings define both access and global sequencing behavior.

## Current Repo State
- `training_settings.allowed_roles` already exists and is editable from `/admin/training/settings`.
- `training_programs.is_sequential` already exists.
- `training_categories.is_sequential` already exists.
- Learner routes already enforce program/category sequential behavior in parts of the current API layer.
- There is no global training sequential-lock setting in `training_settings`.

## Exact Gap
- The architect defined two common controls:
  - sequential lock on/off
  - which roles can access Training School nav
- The repo currently supports the second control, but not the first one at the settings layer.
- Precedence between global setting, program setting, and category setting is not documented in an execution-ready way.

## Required Implementation
- Extend `training_settings` with a global sequential-lock field if it does not already exist.
- Update `/api/admin/training/settings` GET and PUT to read/write that field.
- Update `/admin/training/settings` to expose the setting in the UI.
- Enforce this precedence rule:
  - if global sequential lock is off, program/category sequential rules do not lock learner progression
  - if global sequential lock is on, `training_programs.is_sequential` controls category ordering inside the program
  - if global sequential lock is on and `training_categories.is_sequential` is off, category priority still controls category selection, but lesson locking inside that category is not enforced
  - if global sequential lock is on and `training_categories.is_sequential` is on, lesson ordering is enforced by lesson priority
- Ensure access rules continue to depend on configured roles, not only on authentication state.

## Likely Affected Files
- `src/app/admin/training/settings/page.tsx`
- `src/app/api/admin/training/settings/route.ts`
- learner training route handlers that currently enforce sequential locking
- Supabase migration file for `training_settings` if the new field is missing

## API and Schema Constraints
- Keep using `training_settings`.
- Keep using `training_programs.is_sequential` and `training_categories.is_sequential`.
- Do not rename access fields or create a parallel settings table.

## Dependencies
- None. This task should be executed first.

## Acceptance Criteria
- Admin settings can persist both allowed roles and the global sequential-lock value.
- Learner progression respects the defined precedence rule.
- Direct URL access does not bypass configured role restrictions.

## Verification Test Plan
- [ ] Save allowed roles and confirm the values persist through refresh and API round-trip.
- [ ] Save the global sequential-lock value and confirm the value persists through refresh and API round-trip.
- [ ] With global sequential lock off, confirm a learner can open later categories/lessons without ordering enforcement.
- [ ] With global sequential lock on and program/category sequential on, confirm earlier incomplete items block later ones.
- [ ] With global sequential lock on and program sequential on but category sequential off, confirm category priority determines next category and lesson locking is not enforced inside that category.
- [ ] Confirm a user without configured access cannot access training routes from the nav or by direct URL.

## Out Of Scope
- Reporting changes
- Quiz engine changes
- Certificate changes
