# Task 02: Build Admin CRUD For Booking Services

- Status: Pending
- Priority: High

## Goal
Create full CRUD functionality for booking services inside the new admin `Service Config` module.

## Why This Task Exists
- Service management currently exists in the diviner dashboard.
- Service creation and editing now needs to move to admin control.
- Admin should manage the booking services from one centralized place.

## Expected Result
- Admin can create a service
- Admin can view the service list
- Admin can edit a service
- Admin can delete a service
- The admin UI should reuse or follow the current service management pattern already used in the diviner dashboard

## Important Fields
Each service should support:
- Service name
- Description
- Multiple images
- Price assignment
- Diviner assignment

Note:
- Price assignment will be handled using admin price management data
- Diviner assignment will be handled in the next task in more detail

## Scope
- Admin service list UI
- Create service form
- Edit service form
- Delete action
- Backend CRUD endpoints or server actions

## Steps

### 1. Inspect Existing Diviner Service Module
- Find the current diviner dashboard service CRUD flow
- Identify:
  - service list UI
  - create/edit form fields
  - image uploader logic
  - API routes or server actions
- Decide which parts can be reused safely in admin

### 2. Build The Admin List View
- Show all services in a table or card list
- Include at least:
  - service name
  - short description or summary
  - assigned price reference
  - assigned diviner count or names
  - status if relevant
- Add search if the existing service module already supports search and it is easy to carry over

### 3. Create Service Flow
- Add a create button
- Build a form or modal for creating a service
- Include:
  - name
  - description
  - multiple image upload
  - price assignment field
  - diviner assignment field
- Add basic validation for required fields

### 4. Edit Service Flow
- Allow admin to open an existing service in edit mode
- Pre-fill the form with the current service data
- Support updating all editable fields

### 5. Delete Service Flow
- Add a delete action
- Use a confirmation step before final delete
- Make sure the list refreshes correctly after deletion

### 6. Backend Support
- Add or update admin-side create, read, update, and delete endpoints
- Reuse existing service table logic where possible
- Add admin authorization checks to all mutation actions

### 7. Verify
- Create a new service
- Edit the same service
- Delete a test service
- Confirm the UI refreshes correctly after each action

## Notes For Implementation
- Prefer reusing the current diviner service components if they are flexible enough
- If reuse is hard, extract shared pieces instead of copy-pasting large blocks
- Keep the final source of truth under admin control

## Acceptance Checklist
- [ ] Admin can create services
- [ ] Admin can edit services
- [ ] Admin can delete services
- [ ] Multiple images are supported
- [ ] Admin authorization is enforced on mutations
