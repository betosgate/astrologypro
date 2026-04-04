# Close Role List Bulk Action Parity - 2026-04-02

- Status: Deferred
- Priority: P1
- Owner: Frontend
- Scope: role list row selection, bulk status updates, bulk delete
- Estimate: 0.5-1 day
- Task File: `Divine-infinite-ui-next/docs/tasks/2026-04-02/admin-module/role-management/02-close-role-list-bulk-action-parity.md`

## Goal

Restore Angular parity for multi-select list actions in the Next role module.

## Verified Current Code Truth

- Angular role list explicitly enables multi-select actions.
- Angular role list supports:
  - bulk status update through `admin/role-status-change`
  - bulk delete through `admin/role-delete`
- Angular also preserves row-level actions alongside those bulk controls.
- Next role list already supports row-level preview, edit, delete, and status toggle.
- The current Next role list review did not find module-level evidence of bulk selection or bulk role actions.

## User-Visible Problem

Admins must process role records one by one in Next, even though Angular allows selected-role batch operations for common maintenance actions.

## Required Behavior

1. `/admin/roles` must allow selecting multiple rows.
2. Selected rows must support a bulk status action.
3. Selected rows must support bulk delete with confirmation.
4. Bulk actions must refresh the list and clear stale selection state.
5. Row-level actions must remain available and unaffected.

## Tasks

1. Add multi-row selection support to the role list surface.
2. Add a bulk status action wired to the existing backend-compatible role status update flow.
3. Add a bulk delete action with explicit confirmation.
4. Refresh list data and clear selection after successful bulk actions.
5. Verify bulk actions behave safely with pagination and filtered result sets.

## Acceptance Criteria

- admins can select multiple roles from the list
- selected roles can be updated in bulk for status
- selected roles can be deleted in bulk with confirmation
- list refreshes after bulk operations and clears selection state
- row-level preview, edit, delete, and status toggle still work

## Verification Test Plan

1. Open `/admin/roles` and verify rows can be selected.
2. Select multiple active and inactive roles and execute a bulk status update.
3. Verify the updated rows show the new status after refresh.
4. Select multiple roles and execute bulk delete.
5. Verify the deleted rows no longer appear after refresh.
6. Verify row-level preview, edit, delete, and status toggle still function after the bulk-action upgrade.

## Deferral Note (2026-04-02)

Bulk multi-select actions are not implemented. `GenericListPage` has no row-checkbox selection or bulk action bar infrastructure. Implementing this correctly requires a cross-cutting change to the shared list component:
- Adding a checkbox column + selection state management
- A bulk action bar rendered when rows are selected
- Wiring bulk status and bulk delete mutations with confirmation

This work is deferred until a dedicated bulk-actions milestone is scheduled for `GenericListPage`. Row-level preview, edit, delete, and status toggle remain fully operational.

## Notion Summary

P1 operational parity gap: the Next Role list needs bulk multi-select actions so admins can update or remove multiple role records without repeating one-row-at-a-time maintenance work.
