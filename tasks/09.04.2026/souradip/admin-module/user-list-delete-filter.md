# Task: Remove Deleted Users From Main User List

- Status: Pending
- Priority: High

## Goal
Make deleted users disappear from the active user list immediately and only appear in the deleted-users view.

## Current Problem
- A deleted user is being moved to the deleted-users area.
- But the same user still appears in the main active user list.
- This creates inconsistent admin behavior and makes it look like deletion failed.

## Expected Result
- Main user list shows only active or non-deleted users.
- Deleted users are excluded at the query level.
- Deleted users appear only in the deleted-users page or deleted filter view.
- After deletion, the row disappears from the visible list immediately.

## Scope
- Backend query filtering
- Frontend table refresh after delete
- Separation between active list and deleted list

## Steps

### 1. Find The Main User List Source
- Find the API route, server query, or loader that fetches the main user list.
- Check how deleted status is currently represented.
- Look for fields like `is_deleted`, `deleted_at`, `status`, or soft-delete flags.

### 2. Fix Active List Filtering
- Update the main list query so deleted users are not included.
- Make the filter explicit instead of relying on frontend filtering alone.
- Keep the deleted-users page using its own separate query or filter.

### 3. Update Frontend After Delete
- Find the delete action in the admin user list.
- After the delete API succeeds, refresh the list data.
- If the table uses query caching, invalidate the correct list query.
- If the table uses local state, remove the row locally or call the shared refresh function.

### 4. Verify List Separation
- Delete a user from the main list.
- Confirm the user disappears from the main list immediately.
- Confirm the same user is visible in the deleted-users page.
- Confirm a browser refresh does not bring the deleted user back to the main list.

## Notes For Implementation
- Prefer backend-level filtering first.
- Frontend hiding alone is not enough because stale data can reappear after refresh.
- Keep behavior consistent for search, pagination, and filters if those exist in the table.

## Acceptance Checklist
- [ ] Main user list query excludes deleted users
- [ ] Deleted users page still works
- [ ] Deleted row disappears immediately after success
- [ ] Refresh does not reintroduce deleted rows into the active list
