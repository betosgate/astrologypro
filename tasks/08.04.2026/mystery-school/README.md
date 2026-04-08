# Mystery School Dashboard Navigation Task Folder

This folder is the source of truth for aligning the Mystery School dashboard navigation and page shell with the Perennial dashboard pattern.

If older Mystery School notes elsewhere in the repo conflict with this folder, follow this folder.

## Read In This Order

1. `00-master-task.md`
2. `01-sidebar-shell-and-layout-parity.md`
3. `02-navigation-items-route-visibility-and-access-alignment.md`
4. `03-visual-parity-and-interaction-consistency.md`
5. `99-implementation-checklist.md`

## Key Rules

1. This task is a refinement and consistency task, not a new-feature task.
2. The target reference pattern is the existing Perennial dashboard shell and navigation behavior.
3. Mystery School must not feel like a separate dashboard system.
4. Navigation visible to the user must match routes the user can actually access.
5. Existing working Mystery School content and route guards must not be broken while the layout changes.
6. The implementation should prefer reuse of current shared layout/component patterns over inventing a new navigation system.

## Final Reminder

Do not implement this as a cosmetic one-line nav swap.

Read the full task set first, then align:

1. layout structure
2. navigation placement
3. visible nav items
4. route/access behavior
5. theme and hierarchy consistency
