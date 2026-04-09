# Task 04: Make Diviner Service Area Read-Only And Show Only Assigned Services

- Status: Pending
- Priority: High

## Goal
Stop diviners from creating or editing services. Diviners should only be able to see the services assigned to them by admin.

## Why This Task Exists
- Service control is moving to admin
- Diviner dashboard should no longer be the source of service CRUD
- Diviners still need visibility into which services are available to them

## Expected Result
- Diviner sees only services assigned to them
- Diviner cannot create a new service
- Diviner cannot edit an assigned service
- Diviner cannot delete an assigned service
- Any old diviner-side service actions should be removed, disabled, or hidden

## Scope
- Diviner service list query
- Diviner dashboard UI permissions
- Diviner service mutations
- Backend protection against unauthorized service writes

## Steps

### 1. Inspect Current Diviner Service Module
- Find the current diviner dashboard service page
- Identify:
  - create button
  - edit action
  - delete action
  - create/update/delete APIs used by diviner

### 2. Restrict The Diviner UI
- Remove or hide the add-service button
- Remove or disable edit buttons
- Remove or disable delete buttons
- Update the page text so diviner understands services are assigned by admin

### 3. Filter Visible Services
- Update the diviner service list query so it returns only services assigned to the current diviner
- Make sure unassigned services do not appear

### 4. Protect Backend Writes
- If diviner-facing create/update/delete endpoints still exist, block those mutation paths
- Return a clear unauthorized or forbidden response when a diviner tries to mutate service data directly
- Do not rely on frontend hiding alone

### 5. Add Helpful Read-Only Context
- In the diviner service list, show useful information such as:
  - service name
  - description
  - images
  - assigned price
- Optionally show a note like:
  - `Services are managed by admin`

### 6. Verify
- Log in as a diviner
- Confirm only assigned services are visible
- Confirm create/edit/delete actions are not available
- Confirm direct mutation attempts are blocked on the backend

## Notes For Implementation
- Read-only does not mean empty; keep the service information useful for diviners
- Preserve existing booking behavior for assigned services
- Make sure public booking pages still work for assigned services after this change

## Acceptance Checklist
- [ ] Diviner sees only assigned services
- [ ] Diviner cannot add services
- [ ] Diviner cannot edit services
- [ ] Diviner cannot delete services
- [ ] Backend blocks unauthorized diviner service mutations
