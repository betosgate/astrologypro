# Task: Admin User List - Multi-Role Display

- Status: Completed (2026-04-08, verified)
- Completion Notes: roles[] consolidated in src/app/admin/users/page.tsx:249-379 (merge across diviners/clients/advocates/community/trainee with dedup); rendered as multiple badges in user-management-client.tsx:1039-1041; modal copy updated at line 1463.
Date: 2026-04-07
Category: Admin Dashboard

## Objective
Update the Admin User List to support and display multiple roles for a single user. Users in AstrologyPro often hold multiple positions (e.g., a "Diviner" who is also a "Mystery School" member), and the dashboard should reflect all active roles as separate badges in the "Role" column.

## Requirements
- **Data Consolidation**:
    - File: `src/app/admin/users/page.tsx`
    - Modify `getAllUsers` to consolidate profile data by `userId`.
    - Instead of creating separate rows for the same `userId` found in different tables, merge them into a single entry.
    - Change `AdminUser` type to support an array of roles: `roles: { slug: string, label: string }[]`.
- **UI Implementation**:
    - Component: `UserManagementClient` (or the relevant table row component).
    - In the "Role" column, map over the `roles` array.
    - Render a separate badge/pill for each role (e.g., [Diviner] [Community]).
- **Badge Styling & UI Refinement**:
    - Ensure badges are distinct and well-spaced.
    - Use secondary colors for additional roles to maintain a clean layout.
    - **Clarify Modal Terminology**:
        - Change header from "Change Role" to **"Add / Grant New Role"**.
        - Change action button from "Create Role Record" to **"Grant New Role"**.
        - Update description: "The user will keep their current role(s) while gaining this new one."

## Success Criteria
- A user who is both a Diviner and a Community Member has one row in the table showing both labels.
- The "Role" column correctly displays multiple badges for multi-role users.
- The search/filter logic correctly identifies users who hold at least one of the filtered roles.

## Technical Notes
- Current fetch logic runs parallel queries for each role table. The consolidation should happen in "Phase 2" of the `getAllUsers` function after all data is collected but before pagination/sorting.
