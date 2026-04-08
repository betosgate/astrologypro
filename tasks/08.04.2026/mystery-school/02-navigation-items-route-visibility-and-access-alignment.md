# Mystery School Navigation Items, Route Visibility, And Access Alignment

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Mystery School Dashboard
- Owner: Frontend
- Priority: P1
- Task File: `tasks/08.04.2026/mystery-school/02-navigation-items-route-visibility-and-access-alignment.md`

## Goal

Ensure that the navigation shown to a Mystery School user only contains destinations that are actually valid and coherent for that user.

## Problem

The current Mystery School nav includes several `/community/*` links.

For a Mystery School-only user, those visible links can redirect the user away or bounce them back to `/mystery-school`.

That creates a misleading UX:

1. the nav implies access
2. the route guard rejects or reroutes the user
3. the user loses confidence in the dashboard navigation

## Required Review

Audit every item currently shown in the Mystery School nav.

For each nav item, explicitly decide:

1. keep visible as-is
2. hide for Mystery School-only users
3. remap to a Mystery School-valid destination
4. move out of primary nav if it is secondary/account-level behavior

## Current Known Risk Items

At minimum, review the current items defined in `src/app/mystery-school/layout.tsx`:

1. `Mundane`
2. `Ingress Charts`
3. `Horoscope`
4. `Library`
5. `Profile`

These currently point to `/community/*` destinations and must not remain misleading.

## Implementation Requirements

1. Visible nav must match actual route access.
2. If a route is blocked for Mystery School-only users, do not keep it as a normal primary nav link.
3. If a route truly is shared and intended to work for Mystery School users, validate that behavior explicitly before keeping it.
4. If route access logic and visible nav are out of sync, fix the mismatch at the appropriate layer.

## Junior-Friendly Notes

A nav item is not "fine" just because it renders.

A nav item is only correct if:

1. the user understands where it goes
2. the route actually works for that user
3. the route does not immediately redirect them somewhere unexpected

If the user clicks a main nav item and lands back on the current dashboard, that nav item is misleading.

## Codex / AI-Agent Guidance

Do not solve this by only renaming labels.

You must verify:

1. the href
2. the route guard behavior
3. the post-click destination
4. whether the route is truly shared or actually portal-specific

If shared routes exist, keep them only if the user experience is coherent.

If they are not coherent, hide or remap them.

## Acceptance Criteria

1. Mystery School primary nav contains only valid, coherent destinations
2. no visible main nav link bounces the user away unexpectedly
3. route visibility and access behavior feel aligned
4. the nav is easier to trust after implementation

## Out Of Scope

1. redesigning all auth/portal access models
2. broad backend membership refactors unrelated to visible nav correctness
