# Perennial Additional Members And Household Management

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/04-additional-members-household-management.md`

## Goal

Implement add/remove/edit behavior for household members so the user can build the correct household before payment.

## Required Household Behavior

1. The form starts with one primary member.
2. The user can add household members up to the selected plan capacity.
3. The UI must clearly distinguish:
   - primary member
   - additional members
4. Additional members must be individually removable.

## Add-Member Rules

1. `Single` plan:
   - no additional members allowed
2. `Couple` plan:
   - exactly one additional member allowed
3. `Family` plan:
   - up to four additional members allowed

## Remove-Member Rules

1. Removing a member must remove only that member block.
2. Errors associated with that member must also be removed or reindexed safely.
3. Removing a member must update:
   - household count
   - summary state
   - validation state

## Overflow Handling

If a user changes from a larger plan to a smaller plan:

1. the UI must detect member-count overflow
2. the page must not silently lose member data
3. the user must be prompted to remove extra members or restore a valid plan choice

## Member Block Requirements

Every household member block should display:

1. member number or role label
2. whether it is the primary member or additional member
3. collapse/expand friendliness if the page becomes long
4. remove action for non-primary members

## Summary Synchronization

Any change to member list must update:

1. household count
2. selected-plan validity
3. pricing summary
4. readiness to continue to review/payment

## Acceptance Criteria

1. the page starts with one primary member
2. add-member controls respect plan capacity exactly
3. non-primary members can be removed cleanly
4. errors and summary state stay in sync after add/remove actions
5. plan downgrades with too many members are handled intentionally and visibly
