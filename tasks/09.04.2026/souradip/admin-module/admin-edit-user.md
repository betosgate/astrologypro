# Task: Add Edit User Flow Using Shared User Form

- Status: Pending
- Priority: High

## Goal
Implement a proper Edit User flow by reusing the existing Add User form in edit mode.

## Current Problem
- There is already an Add User form.
- Edit User is missing or incomplete.
- When editing a user, the form should open with existing values, save changes, and update the list view without requiring a hard refresh.

## Expected Result
- Admin can open an edit page or edit modal for a user.
- Existing user data is loaded automatically.
- The same form component supports both create mode and edit mode.
- Saving changes updates the backend and the user list reflects the update immediately.

## Scope
- Shared form behavior
- Edit route or edit modal loading
- Update API call
- User list refresh after save

## Steps

### 1. Inspect Current User Form
- Find the existing Add User component.
- Identify which fields are already reusable.
- Check whether the form state can accept initial values.

### 2. Add Edit Mode Support
- Add a clear `mode` concept such as `create` or `edit`.
- Allow the form to receive initial user data.
- Pre-fill all editable fields from that data.
- Make sure fields that should not be editable remain protected if needed.

### 3. Load The Target User
- Find the edit route or edit action entry point.
- Read the user id from route params or modal context.
- Fetch the current user record before rendering or when the form opens.
- Handle missing user, loading state, and fetch error state clearly.

### 4. Submit Updates Correctly
- In edit mode, call `PUT` or `PATCH` instead of the create request.
- Send only the fields that should be updated.
- Show success and failure feedback to the admin.

### 5. Refresh The User List
- After a successful edit, return to the user list if the current flow expects a redirect.
- Make sure the user list data is re-fetched or invalidated.
- If the project uses local state, call the refresh callback.
- If the project uses query caching, invalidate the correct query key.

### 6. Verify
- Open edit mode for an existing user and confirm fields are pre-filled.
- Change one or more values and save.
- Confirm the backend record updates.
- Confirm the user list shows the new values immediately after the edit flow completes.

## Notes For Implementation
- Reuse the Add User form instead of creating a second independent edit form.
- Keep create and edit submission logic separate enough to avoid accidental duplicate-user creation.
- Keep route naming and API naming aligned with the current codebase.

## Acceptance Checklist
- [ ] Shared form supports edit mode
- [ ] Existing user data loads correctly
- [ ] Update request uses edit API path
- [ ] Success and error feedback is shown
- [ ] User list refreshes without manual reload
