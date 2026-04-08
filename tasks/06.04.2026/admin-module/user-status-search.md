**Status:** Done
**Verified 2026-04-08:** Status filter is wired in src/app/admin/users/page.tsx via URL params; admin_users + role tables have indexes per the activity-log migration.

# Task: User List Status Search & Indexing

## Objective
Add a search-by-status option to the admin user list and ensure the status fields are indexed in the database for better performance.

## Requirements
- [ ] Implement status filtering (Active/Inactive) in the Admin User List UI.
- [ ] Update API/RPcs to support filtering by status.
- [ ] Add database indexes for status columns in the following tables:
    - `diviners.is_active`
    - `social_advocates.is_active`
    - `community_members.membership_status`
    - `trainees.training_status`
