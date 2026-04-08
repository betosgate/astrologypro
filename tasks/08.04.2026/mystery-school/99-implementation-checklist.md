# Mystery School Navigation Parity Implementation Checklist

- Status: Checklist
- Date: 2026-04-08
- Category: Mystery School Dashboard
- Owner: Frontend
- Priority: P1
- Task File: `tasks/08.04.2026/mystery-school/99-implementation-checklist.md`

## Required Reading

1. `00-master-task.md`
2. `01-sidebar-shell-and-layout-parity.md`
3. `02-navigation-items-route-visibility-and-access-alignment.md`
4. `03-visual-parity-and-interaction-consistency.md`

## Pre-Implementation Checklist

1. Confirm the current Mystery School shell implementation in `src/app/mystery-school/layout.tsx`.
2. Confirm the current Perennial shell implementation in `src/app/community/layout.tsx`.
3. List the Mystery School nav items and their destinations.
4. Verify which of those destinations are truly valid for Mystery School-only users.

## Implementation Checklist

1. Convert Mystery School desktop shell to the Perennial-style sidebar structure.
2. Preserve working mobile navigation behavior.
3. Remove or remap misleading `/community/*` links from primary Mystery School navigation.
4. Ensure the sidebar active state works correctly for Mystery School routes.
5. Ensure main content offset, spacing, and width remain stable after the shell conversion.
6. Keep portal/account utility actions coherent within the new shell.
7. Refine shell-level styling so Mystery School remains thematically distinct but structurally aligned with Perennial.

## QA Checklist

1. Login with a Mystery School user and confirm landing on `/mystery-school`.
2. Verify desktop nav is left-sidebar based.
3. Verify mobile nav still opens and routes correctly.
4. Test every visible Mystery School primary nav item.
5. Confirm no visible nav item bounces the user back unexpectedly.
6. Confirm key routes still work:
   - `/mystery-school`
   - `/mystery-school/training`
   - `/mystery-school/training/graduation`
   - a decan detail page
7. Confirm Mystery School still feels visually like Mystery School, but structurally like the same dashboard family as Perennial.

## Done Definition

This task is done only when:

1. the shell mismatch is resolved
2. the visible nav is behaviorally trustworthy
3. Mystery School feels aligned with Perennial dashboard standards
4. no follow-up task is needed just to fix obvious nav parity gaps
