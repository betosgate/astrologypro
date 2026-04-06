**Status:** Done

# Task: User Role Management

## Objective
Enable administrators to manage and change user roles (e.g., Client, Diviner, Advocate, Trainee) directly from the Admin User List.

## Requirements

### 1. Role Change Interface
- [ ] **Action**: Add a "Change Role" dropdown or action button for each user in the list.
- [ ] **Role Options**: Display all available system roles (Client, Diviner, Social Advocate, Community Member, Trainee).
- [ ] **Multi-Role Support**: If the system supports multiple roles per user, provide a multi-select interface; otherwise, a single-select dropdown.

### 2. Implementation Logic
- [ ] **Service/RPC**: Create or update the necessary Supabase RPC/service to update the user's role in the authentication and profile tables.
- [ ] **Data Integrity**: Ensure that changing a role correctly handles the movement or creation of records in the respective role-specific tables (e.g., creating a `diviner` record if someone is upgraded from `client` to `diviner`).
- [ ] **Permission Update**: Ensure the user's access tokens/permissions are refreshed or updated to reflect the new role upon their next login.

### 3. Verification & Auditing
- [ ] **Audit Trail**: Log every role change event in the `admin_activity_log`, including the old role and the new role assigned.
- [ ] **User Notification**: Automatically notify the user via email when their role has been changed by an administrator.
- [ ] **Admin Confirmation**: Require a confirmation step for sensitive role changes (e.g., promoting someone to a role with elevated permissions).
