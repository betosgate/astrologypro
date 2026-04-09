# Task: Admin Add User Functionality (Admin Role Extension)

- Status: Pending
- Completion Notes: 

## Objective
The "Add User" form already exists in the Admin Dashboard with various user types (Diviner, Client, Social Advocate, Trainee, etc.). The specific goal of this task is to extend the existing form and backend logic to allow the creation of new **Admin** users. 

## Requirements

### 1. Admin UI (Add User Form Updates)
- [ ] Locate the existing "Add User" form component in the Admin Dashboard.
- [ ] Update the **User Type** dropdown to include a new `Admin` option alongside the existing roles.
- [ ] Ensure the form handles the `Admin` selection appropriately before sending the payload to the backend.

### 2. API Implementation & Logic Updates
- [ ] Update the existing user creation API endpoint (e.g., `POST /api/admin/users`) to support processing the `Admin` role.
- [ ] Ensure the backend logic properly assigns the `Admin` role to the newly created user in the database.
- [ ] Implement strict backend validation to verify that only *existing* Admins can successfully submit a request to create another Admin (preventing privilege escalation via API spoofing).
