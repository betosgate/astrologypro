# Mystery School Dashboard Navigation And Shell Parity Master Task

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Mystery School Dashboard
- Owner: Frontend
- Priority: P1
- Task File: `tasks/08.04.2026/mystery-school/00-master-task.md`

## Purpose

Align the Mystery School dashboard shell, navigation placement, and visible route links with the established Perennial dashboard experience.

This folder is the source of truth for this Mystery School dashboard consistency task. If older notes or ad hoc comments conflict with this folder, this folder wins.

## Why This Task Exists

Live QA of the Mystery School dashboard surfaced a clear consistency issue:

1. Mystery School still uses a top horizontal navigation shell.
2. Perennial uses a left sidebar dashboard shell.
3. Mystery School exposes several `/community/*` links in its main navigation even for users who are redirected away from those routes.
4. As a result, Mystery School feels like a visually separate dashboard system rather than part of the same member-portal family.

This is not a request for a new feature. This is a dashboard consistency, navigation correctness, and UI maintenance task.

## Scope

This task set covers:

1. Mystery School dashboard shell layout parity with Perennial
2. left-sidebar navigation adoption or equivalent shared shell alignment
3. visible nav item review and cleanup for Mystery School users
4. route visibility alignment with actual route access
5. visual and interaction consistency improvements tied directly to the shell/navigation change

This task set does not cover:

1. brand new Mystery School product features
2. new dashboard modules
3. backend permission redesign beyond what is necessary for nav visibility correctness
4. unrelated content, form, or business-logic work

## Confirmed Problem Statement

The current Mystery School layout in `src/app/mystery-school/layout.tsx` uses a top navigation bar, while the Perennial dashboard in `src/app/community/layout.tsx` uses a left sidebar pattern.

Additionally, Mystery School currently shows links such as:

1. `Mundane`
2. `Ingress Charts`
3. `Horoscope`
4. `Library`
5. `Profile`

These point into `/community/*`, but a Mystery School-only user can be redirected back out of those routes by the current Perennial/community guard behavior.

That means the current UI is visually inconsistent and also behaviorally misleading.

## Desired Outcome

After implementation:

1. Mystery School and Perennial feel like members of the same dashboard family
2. Mystery School navigation placement no longer clashes with the Perennial portal pattern
3. users are not shown primary nav links that bounce them away unexpectedly
4. route visibility and access logic feel coherent
5. Mystery School keeps its own identity and content, but not a disconnected shell pattern

## Implementation Reference

Use the Perennial dashboard shell as the reference implementation pattern, especially:

1. navigation placement
2. content offset behavior
3. sidebar grouping logic
4. dashboard information hierarchy
5. overall portal framing

Do not copy blindly. Align intentionally.

## Execution Order

1. `01-sidebar-shell-and-layout-parity.md`
2. `02-navigation-items-route-visibility-and-access-alignment.md`
3. `03-visual-parity-and-interaction-consistency.md`

## Non-Negotiable Constraints

1. Do not keep the current top-nav Mystery School shell if the goal is Perennial parity.
2. Do not show nav destinations that the current Mystery School user cannot actually use.
3. Do not break existing Mystery School protected-route behavior.
4. Do not introduce a brand new navigation design language unrelated to current portal patterns.
5. Do not solve this only with CSS if the route visibility logic remains misleading.
6. Do not treat this as a pure visual polish task; navigation behavior must be corrected too.

## Expected Outcome

The implementing developer or AI should be able to complete this task pack without having to ask:

1. whether Mystery School should keep the top nav
2. whether Perennial is the reference shell
3. whether inaccessible `/community/*` links should remain visible
4. whether this is a new-feature task or a parity/refinement task

Those decisions are already resolved here.
