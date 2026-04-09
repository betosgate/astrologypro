# Progressively Reveal Large Category Lists And Make Category Rail Sticky

- Status: Planned

## Objective
Improve the `/trainee/training/[programId]` workspace so programs with more than 5 categories do not dump the full category list into the initial visible panel, and make the category rail stay pinned near the top while the learner scrolls through lessons.

## Why This Task Exists
Large programs can create a poor first-load experience and a cluttered navigation rail:
- too many categories shown at once increases visual noise
- the full list loading into the visible panel immediately makes the workspace feel heavy
- the category navigation becomes less useful if it scrolls away while the learner is reading lessons

The category rail should behave like secondary navigation:
- compact on first render
- progressively revealed in a standard way
- sticky while the main lesson column scrolls

## Current Repo State
- `src/components/trainee/program-workspace.tsx` already caps the initially visible categories to 5 using `INITIAL_CATEGORY_VISIBLE = 5`.
- The current behavior uses a button-based reveal:
  - first 5 categories visible
  - `Show remaining {n}` button expands the rest
  - `Show fewer categories` collapses again
- The workspace currently renders categories and lessons inside a grid.
- The current category pane is not explicitly sticky.

## Exact Gap
- The current implementation already avoids rendering all categories visibly at once, but the desired behavior needs to be made explicit and kept intentional as part of the workspace redesign.
- The task should lock in a standard progressive-reveal pattern for larger category lists rather than allowing an always-expanded rail.
- The category panel also needs sticky top behavior so navigation remains accessible while the learner scrolls through long lesson lists.

## Fixed Behavior Decisions
- For programs with 5 or fewer categories:
  - show all categories immediately
- For programs with more than 5 categories:
  - show only the first 5 in the initial visible rail
  - reveal the rest using a standard progressive pattern
- Preferred default pattern:
  - button-based progressive reveal (`Show remaining {n}` / collapse)
- Infinite-scroll or auto-load-on-scroll is optional only if it clearly improves the interaction more than a button, but do not use a more complex pattern unless it is justified.
- The category rail should remain sticky near the top on large screens while the learner scrolls the lesson pane.
- Sticky behavior should not break mobile or narrow-screen layouts.

## Required Implementation
- Review the current category progressive-reveal behavior in `ProgramWorkspace` and keep or refine it as the standard approach for programs with more than 5 categories.
- Ensure the initial render remains compact and does not visually dump all categories into the rail.
- Make the category panel sticky on large screens with an appropriate top offset so it remains visible during lesson scrolling.
- Confirm the sticky behavior coexists correctly with:
  - the pane-position swap task
  - expanded lesson cards
  - long lesson lists
  - category reveal/collapse behavior
- Keep the category rail usable when expanded:
  - no clipped controls
  - no inaccessible categories
  - sensible scrolling if the rail becomes taller than the viewport

## Files To Read First
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/[programId]/page.tsx`
- `tasks/09.04.2026/admin-module/training-school/02-learner-experience/02-move-program-workspace-lessons-left-and-categories-right.md`

## Likely Files To Change
- `src/components/trainee/program-workspace.tsx`
- optionally surrounding page/layout styling if sticky offset needs alignment with the existing app shell

## API and Schema Constraints
- No API changes are required for this task.
- Do not create a separate lazy-loading endpoint for categories unless there is a demonstrated real data-volume problem beyond the current UI requirement.
- Prefer UI-level progressive reveal over unnecessary network orchestration.

## Dependencies
- Best executed alongside or after the workspace pane-position task so the sticky rail is built against the final desktop layout.
- Otherwise independent.

## Acceptance Criteria
- A program with more than 5 categories initially shows only 5 categories in the rail.
- The remaining categories are revealed through a standard progressive interaction.
- The category rail stays sticky near the top on large screens while lessons scroll.
- The category rail remains usable when expanded and does not trap or hide content awkwardly.
- Small-screen layouts remain functional and readable.

## Verification Test Plan
- [ ] Open a program with 5 or fewer categories and confirm all categories are visible immediately.
- [ ] Open a program with more than 5 categories and confirm only the first 5 are visible initially.
- [ ] Confirm the progressive reveal control exposes the remaining categories and can collapse back cleanly if that behavior is retained.
- [ ] Confirm the category rail stays visible near the top while scrolling through a long lesson list on desktop.
- [ ] Confirm the expanded category rail remains usable when taller than the viewport.
- [ ] Confirm mobile or narrow-screen layouts do not inherit broken sticky behavior.

## Out Of Scope
- changing category ordering rules
- server-side pagination of categories
- redesigning lesson cards
- changing lesson or program progress semantics
