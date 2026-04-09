# Move Program Workspace Lessons Left And Categories Right

- Status: Planned

## Objective
Change the trainee program workspace reached from `Start Program` / `Continue` so the lessons section sits on the left as the primary content area and the categories panel sits on the right as the secondary navigation rail, with better space allocation overall.

## Why This Task Exists
The current workspace makes categories the left-side primary column and lessons the right-side detail area. For the actual learner workflow, lessons are the main working surface and categories are supporting navigation.

The current left-heavy category rail wastes attention and makes the page feel backwards:
- the learner’s main task is choosing and reading lessons, not browsing category chrome
- the wider pane should belong to lesson content
- the narrower pane should hold category navigation

## Current Repo State
- `Start Program` and `Continue` on `/trainee/training` link to `/trainee/training/[programId]`.
- `src/app/trainee/training/[programId]/page.tsx` renders `ProgramWorkspace`.
- `src/components/trainee/program-workspace.tsx` currently uses:
  - left pane: categories
  - right pane: lessons
- On large screens the layout is `lg:grid-cols-3`, with:
  - categories in `lg:col-span-1`
  - lessons in `lg:col-span-2`
- The category pane currently appears first in DOM and visually on the left.

## Exact Gap
- The workspace visual hierarchy is reversed from the learner’s primary job.
- Categories occupy the left-most scan position even though they are secondary navigation.
- Lessons do not get the strongest initial focus despite being the actionable content.
- Space distribution should still favor lessons, but with the panes visually swapped.

## Fixed Behavior Decisions
- On desktop and large screens:
  - lessons section should render on the left
  - categories panel should render on the right
- Lessons should remain the wider pane.
- Categories should remain narrower and clearly navigational.
- On smaller screens, preserve a sensible stacked flow rather than forcing a cramped side-by-side layout.
- Do not change the logical behavior of selection, locking, expansion, or CTA labels in this task unless needed for the pane move.

## Required Implementation
- Update `ProgramWorkspace` layout so the lessons pane is visually first on large screens and the categories pane is visually second.
- Rebalance widths/classes if needed so the lessons pane gets the majority of the available width and categories remain compact.
- Review spacing, sticky behavior, and visual rhythm after the swap so the page still feels intentional rather than merely mirrored.
- Preserve:
  - selected category behavior
  - expanded lesson behavior
  - lock messaging
  - `Start lesson` / `Resume lesson` / `Review lesson` links
- Verify the workspace still loads correctly from `/trainee/training/[programId]` for started and unstarted programs.

## Files To Read First
- `src/app/trainee/training/[programId]/page.tsx`
- `src/components/trainee/program-workspace.tsx`
- `src/app/trainee/training/page.tsx`

## Likely Files To Change
- `src/components/trainee/program-workspace.tsx`
- optionally `src/app/trainee/training/[programId]/page.tsx` if any wrapper spacing needs adjustment

## API and Schema Constraints
- No API changes are required for this task.
- Do not change `/api/trainee/training/programs` unless a layout-side issue uncovers a real data contract problem.
- Keep this as a UI/layout task, not a navigation logic rewrite.

## Dependencies
- Independent.

## Acceptance Criteria
- On large screens, the program workspace shows lessons on the left and categories on the right.
- The lessons pane remains the primary wider area.
- The categories pane remains usable and compact as a secondary navigation panel.
- The layout still works on smaller screens without overlap or collapsed controls.
- Existing category selection and lesson expansion behavior continue to work.

## Verification Test Plan
- [ ] Open `/trainee/training/[programId]` on desktop and confirm the lessons pane is on the left and categories are on the right.
- [ ] Confirm the lessons pane has more horizontal space than the categories pane.
- [ ] Confirm selecting a category still updates the displayed lessons correctly.
- [ ] Confirm locked categories still show the same warning behavior.
- [ ] Confirm lesson cards still expand/collapse and their CTA links still work.
- [ ] Confirm the mobile or narrow-screen stacked layout still reads sensibly.

## Out Of Scope
- redesigning the card visuals inside each pane
- changing program-entry routing behavior
- changing sequential lock logic
- changing progress computations
