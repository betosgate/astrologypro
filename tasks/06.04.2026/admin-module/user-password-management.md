**Status:** Done

# Task: User Password Management

## Objective
Provide admins with tools to manage user security, including password reset links and forced password changes.

## Requirements

### 1. Send Password Reset Link
- [ ] **Action**: Add a "Send Password Reset Link" button to the user list and details modal.
- [ ] **Workflow**: When clicked, generate a secure password reset link (via Supabase/Auth) and send it automatically to the user's registered email.
- [ ] **Notification**: Notify the user that an administrator has initiated a password reset for their account.

### 2. Force Password Change
- [ ] **Action**: Add a "Force Set Password" option for admins.
- [ ] **Workflow**: Allow admins to manually input a new password for any user.
- [ ] **Security**: Log this action in the `admin_user_notes` as a high-priority security event.
- [ ] **User Notification**: Send an automated email to the user informing them that their password was changed by an administrator, with instructions to sign in and update it for security.
