# Task: Admin User Management Enhancement (Add & Invite)

- Status: Completed (2026-04-08, verified)
- Completion Notes: InviteUserForm at src/components/admin/invite-user-form.tsx, mounted in user-management-client.tsx:775. Add User flow available.
Date: 2026-04-07
Category: Admin Dashboard

## Objective
Implement dedicated "Add User" and "Invite User" functionalities in the Admin Dashboard to allow administrators to directly create new user accounts or send registration invitations.

## Requirements

### 1. "Add User" Form
Create a new form with the following fields (as per requirements):
- **First Name*** (Text)
- **Last Name*** (Text)
- **Email*** (Email, uniqueness validation)
- **Phone*** (Text)
- **Select State*** (Dropdown)
- **City*** (Text)
- **Zip*** (Text)
- **Select Gender*** (Dropdown)
- **Password*** (Password with visibility toggle)
- **Confirm Password*** (Password with visibility toggle)
- **Select User Type*** (Dropdown: Admin, Diviner, Client, etc.)
- **More about yourself** (Textarea)
- **Active** (Checkbox, default checked)

### 2. "Invite User" Flow
- Provide a simplified form to send an invitation link via email.
- Required fields: Email, User Type, and optional personal message.
- Implementation of invitation token generation and email delivery.

### 3. UI/UX (Admin Users List)
- Path: `src/app/admin/users/page.tsx`
- Add two primary Action Buttons in the header:
    - **"Add User"**: Opens the direct creation form (Modal or New Page).
    - **"Invite User"**: Opens the invitation modal.
- Ensure the existing "User Requests" (or Request User) view remains accessible.

### 4. Technical Integration
- **Backend API**:
    - `POST /api/admin/users`: Direct creation via Supabase Admin Auth (overpassing email confirmation if needed).
    - `POST /api/admin/invite`: sending invitation emails.
- **Validation**:
    - Strict frontend validation for password matching.
    - Server-side validation for email uniqueness and field requirements.

## Proposed Path
- Form Component: `src/components/admin/user-form.tsx`
- New Page: `src/app/admin/users/add/page.tsx`
- Modal Component: `src/components/admin/invite-user-modal.tsx`

## Success Criteria
- Admin can create a user immediately with all profile details.
- User receives an email when invited.
- Form matches the high-density premium aesthetic of the dashboard.
