# Task 08 - Human-Readable Role Labels in Training Programs

## Objective
Update the "Access — Roles" column in the Training Programs table to display roles in a human-readable format (e.g., "Mystery School" instead of "mystery_school").

## Why This Task Exists
The current display shows raw database strings (snake_case), which are less professional and harder for admins to read at a glance. Converting these to Title Case with spaces improves the overall UI quality.

## Current Repo State
- `src/app/admin/training/page.tsx` renders the "Training Programs" table.
- Roles are currently formatted only by removing the `is_` prefix using `.replace(/^is_/, "")`.
- Common role slugs include `mystery_school`, `diviner`, `client`, etc.

## Exact Gap
- `mystery_school` displays as `mystery_school`.
- `trainee` displays as `trainee`.
- Expected: `Mystery School`, `Trainee`.

## Fixed Behavior Decisions
- Maintain the removal of the `is_` prefix.
- Transform snake_case strings into Title Case with spaces.
- Example: `is_mystery_school` -> `mystery_school` -> `Mystery School`.
- This change must be purely for display purposes and must NOT modify the data sent to or received from the API.

## Required Implementation
- Locate the role rendering logic in `src/app/admin/training/page.tsx` (both in the table and the Preview modal).
- Replace the current `.replace(/^is_/, "")` logic with a more robust formatting helper or inline transformation.
- The transformation should:
    1. Remove `is_` prefix.
    2. Split the string by underscores (`_`).
    3. Capitalize the first letter of each word.
    4. Join the words with a space.
- Apply this consistently to:
    - The "Access — Roles" column in the Programs table.
    - The "Access" field in the Program Preview modal.

## Files To Read First
- `src/app/admin/training/page.tsx`

## Likely Helpers To Reuse Or Extract
- A small utility function like `formatRole(role: string): string` can be defined locally within the component.

## Likely Files To Change
- `src/app/admin/training/page.tsx`

## API and Schema Constraints
- **Critical**: Do not change the `allowed_roles` array content. The API expects the raw slug strings.
- Only modify the textual content inside the `<Badge>` or the preview text.

## Acceptance Criteria
- "mystery_school" displays as "Mystery School".
- "diviner" displays as "Diviner".
- "is_trainee" displays as "Trainee" (if the prefix is present).
- No impact on the Program creation or edit functionality.

## Verification Test Plan
- [ ] Open the Training Management page.
- [ ] Verify that programs with `mystery_school` role show "Mystery School" in the table.
- [ ] Open the Program Preview for that program and verify it also shows "Mystery School".
- [ ] Create a new program with a role and ensure the API request still uses the raw slug (e.g., check Network tab).
