# Task: Admin Edit User (Shared Form Component)

- Status: Pending
- Completion Notes: 

## Objective
Implement the "Edit User" functionality by repurposing the existing "Add User" form component. When an Admin chooses to edit a user, the form should open pre-populated with that user's data. Upon saving and returning to the User List, the list data must automatically reflect the changes.

## Requirements

### 1. Component Reusability & Pre-population
- [ ] Modify the existing "Add User" form component to support an "Edit Mode."
- [ ] Configure the Edit Route (e.g., `/dashboard/users/edit/[id]`) to correctly capture the target user's `id` from the URL parameters.
- [ ] On page load, execute an API fetch using the captured `id` parameter to retrieve the user's current data.
- [ ] Automatically pre-populate the form fields with the fetched data so the Admin can view and edit the current values.

### 2. Backend Submission
- [ ] Ensure form submission in "Edit Mode" triggers a `PUT` or `PATCH /api/admin/users/[id]` request rather than a duplicate creation request.
- [ ] Process the backend update and ensure proper success/error handling feedback is shown to the Admin.

### 3. Automatic List Refresh
- [ ] Upon a successful edit, redirect the Admin back to the primary User List view.
- [ ] Implement data invalidation/refetching logic (via React Query, SWR, or state callbacks) to ensure that the User List automatically fetches and displays the updated data the moment the Admin returns to the list view, eliminating the need for a manual page refresh.
