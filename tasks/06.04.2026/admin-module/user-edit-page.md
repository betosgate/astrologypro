# Task: User Edit Page

## Objective
Implement a dedicated user edit page where the admin can update user metadata (except for the email address).

## Requirements
- [ ] Create a new edit route: `/admin/users/edit/[id]`.
- [ ] Fetch the user's current data (from the appropriate profile table) using the ID provided in the URL.
- [ ] **Email Policy**: The **Email** field must be **read-only** and cannot be modified.
- [ ] Implement a clean form UI with Save/Cancel options.
- [ ] Ensure proper validation and error handling for form submissions.
