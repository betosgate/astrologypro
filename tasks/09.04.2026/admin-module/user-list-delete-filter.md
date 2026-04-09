# Task: Remove Deleted Users from User List

- Status: Pending
- Completion Notes: 

## Objective
Fix the issue where a newly deleted user continues to appear in the main "User List" view. Currently, when a user is deleted, they correctly appear in the "Deleted Users" page but fail to disappear from the active User List. They must be completely excluded from the main table immediately upon deletion.

## Requirements

### 1. Backend Query Filtering
- [ ] Locate the API endpoint or database query responsible for fetching the main User List.
- [ ] Update the query to explicitly filter out deleted users (for instance, ensuring a condition like `is_deleted: false` or `status !== 'deleted'` is applied).
- [ ] Verify that deleted users are now *exclusively* fetched by the "Deleted Users" page logic, completely separating the two lists at the data level.

### 2. Frontend Cache/State Update
- [ ] Ensure that when the Admin clicks "Delete" and the API confirms success, the frontend instantly updates.
- [ ] Trigger a data refetch or invalidate the specific cache list (e.g., in React Query or SWR) so the deleted row visually disappears from the User List without requiring a manual browser refresh.
