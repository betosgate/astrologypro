# Task: Fix Admin Login Failure

**Status:** Done
**Verified 2026-04-08:** Already marked Done in source — admin login flow uses Supabase auth via /login + admin role check via getAdminUser().

## Objective
Investigate and resolve the issue where administrative login is not working as expected.

## Requirements

### 1. Investigation
- [ ] **Check Logs**: Review Supabase Auth logs and application console logs for any errors related to admin login attempts.
- [ ] **Environment Verification**: Ensure `ADMIN_EMAILS` is correctly set in the environment variables (e.g., `.env.local`).
- [ ] **Auth Check**: Verify that the admin user's email exists in the Supabase Auth list and matches one of the emails in `ADMIN_EMAILS`.
- [ ] **Seeding Check**: Confirm if `node scripts/seed-test-users.js` has been run to create the test accounts.
- [ ] **Supabase Keys**: Verify that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are valid and the app is connecting to the correct Supabase instance.

### 2. Resolution & Refactoring
- [ ] **Migrate Admin Check**: Move away from using `ADMIN_EMAILS` in the `.env` file for authentication.
- [ ] **Database Role Check**: Implement logic to verify admin status based on a `is_admin` flag or `role` (e.g., `admin`) in the `users` (auth) or custom `profiles` table.
- [ ] **Middleware Update**: Update the middleware or server-side guards to query the database/Supabase for this status instead of reading from environment variables.
- [ ] **Bootstrap Mode**: (Optional) Keep `ADMIN_EMAILS` only as a "fail-safe" or for initial setup, but prioritize the database check during normal operation.
- [ ] **Validation**: Verify that users with the admin role in the database can access `/admin` without their email being in the `.env` file.
