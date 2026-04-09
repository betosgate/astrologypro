# Task: Add Admin User Support In Admin Add User Flow

- Status: Pending
- Priority: Medium

## Goal
Allow the existing Admin "Add User" flow to create users with the `Admin` role.

## Current Problem
- The add-user flow already supports multiple user types.
- The `Admin` role is not fully supported in the form and/or backend.
- Because of that, an existing admin cannot create another admin from the normal admin user management flow.

## Expected Result
- Admin sees `Admin` as an option in the user type field.
- Admin can submit the form with `Admin` selected.
- Backend creates the user correctly with the `Admin` role.
- Non-admin users cannot spoof the API and create admin users.

## Scope
- Update the admin add-user UI
- Update the admin user creation API
- Add backend role validation
- Keep current user creation flows for other roles working as they already do

## Steps

### 1. Check Existing Add User Flow
- Find the current Add User page, modal, or form component.
- Find the user type / role selection field.
- Find the API route or server action used when the form is submitted.

### 2. Update The Form
- Add `Admin` to the existing role/type options.
- Make sure selecting `Admin` is stored in the form state properly.
- Make sure the submitted payload sends the correct role value.

### 3. Update Backend Logic
- Find the user creation endpoint used by the admin UI.
- Add handling for the `Admin` role.
- Make sure the created user record is saved with the correct admin role fields in the database.
- Reuse the existing pattern already used for other roles where possible.

### 4. Protect Against Privilege Escalation
- Do not trust the frontend role field alone.
- Verify in the backend that the current requester is already an authenticated admin.
- If the requester is not an admin, reject the request.
- Return a clear error response for unauthorized access.

### 5. Verify
- Test creating a normal user still works.
- Test creating an admin user works.
- Test the new admin appears correctly in the admin user list.
- Test a non-admin request cannot create an admin.

## Notes For Implementation
- Prefer extending the existing flow instead of building a separate admin-only create page.
- Keep role values consistent with the rest of the codebase.
- If there is shared validation logic, update that instead of duplicating checks.

## Acceptance Checklist
- [ ] Add User form shows `Admin`
- [ ] Form submits the correct role value
- [ ] Backend accepts valid admin creation requests
- [ ] Backend blocks non-admin callers
- [ ] Existing role creation flows are not broken
