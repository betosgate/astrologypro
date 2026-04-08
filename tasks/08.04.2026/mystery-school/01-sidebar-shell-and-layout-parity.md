# Mystery School Sidebar Shell And Layout Parity

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Mystery School Dashboard
- Owner: Frontend
- Priority: P1
- Task File: `tasks/08.04.2026/mystery-school/01-sidebar-shell-and-layout-parity.md`

## Goal

Replace the current Mystery School top-navigation shell with a dashboard shell pattern that matches the Perennial left-sidebar structure.

## Problem

Mystery School currently renders its portal shell with a top horizontal nav in `src/app/mystery-school/layout.tsx`.

Perennial uses a left sidebar layout pattern in `src/app/community/layout.tsx`.

This creates:

1. inconsistent dashboard navigation behavior
2. inconsistent layout rhythm between related member portals
3. a weaker sense that Mystery School belongs to the same portal family

## Required Change

The Mystery School layout must adopt the same primary dashboard-shell structure as Perennial:

1. left sidebar navigation on desktop
2. content area offset correctly from the sidebar
3. consistent sticky/fixed sidebar behavior where appropriate
4. mobile navigation behavior that remains compatible with the current mobile pattern

## Implementation Requirements

1. Review `src/app/community/layout.tsx` carefully before editing Mystery School layout code.
2. Reuse the current shared layout conventions where possible instead of recreating the shell from scratch.
3. Keep Mystery School-specific labels and route destinations, but move them into the aligned shell structure.
4. Preserve account access entry points such as notification bell, account link, and portal switcher only if they still fit the sidebar-based composition cleanly.
5. Ensure the main content width, padding, and offset do not collapse or double-indent after the sidebar conversion.

## Junior-Friendly Notes

Do not think of this as:

- "move some links from top to left"

Think of it as:

- "make Mystery School use the same dashboard frame as Perennial"

That means you must check:

1. page width
2. sidebar width
3. header usage
4. spacing between shell and page content
5. mobile fallback behavior

## Codex / AI-Agent Guidance

Before changing code:

1. inspect the current Mystery School layout
2. inspect the Perennial layout
3. identify which parts can be shared directly and which are portal-specific
4. confirm whether `MobileNav`, `PortalSwitcher`, and `NotificationBell` should stay in the same structural region or move

During implementation:

1. avoid partial hybrid states where both top nav and left nav coexist unnecessarily
2. avoid introducing route duplication in both desktop and mobile nav lists
3. keep shell behavior deterministic and easy to reason about

## Acceptance Criteria

1. Mystery School no longer relies on a top horizontal dashboard nav as its primary desktop navigation model
2. desktop navigation placement matches the Perennial dashboard pattern closely
3. content alignment and spacing look intentional after the sidebar shift
4. mobile navigation still works
5. the shell feels like part of the same dashboard family as Perennial

## Out Of Scope

1. new sidebar product areas
2. new route creation
3. unrelated page redesigns inside each Mystery School screen
