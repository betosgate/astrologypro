# Task: Ritual List and Navigation

- Status: Completed (2026-04-08, verified)
- Completion Notes: src/app/community/rituals/page.tsx (list) + src/app/api/community/rituals/route.ts.

## Objective
Implement the "My Rituals" list view within the **Perennial User Dashboard** where users can see their personal ritual history.

## Requirements
- [ ] **Data Fetching**:
    - Load the list of rituals filtered strictly to the current authenticated user.
    - Implement a separate count request to handle accurate pagination.
- [ ] **UI Presentation**:
    - Display ritual name, date created, and a "Navigate" action button.
    - Normalize display fields (Date, Title) to match project standards.
- [ ] **Navigation Logic**:
    - The "Navigate" action must use the `ritual_config_id` to route the user to the specific ritual result page.
- [ ] **Pagination**:
    - Support standard 10-item pagination with server-side limit/skip/sort logic.

## Technical Details
- Sort by `created_on` (Descending) by default.
- Ensure the row action opens the result in the same or new tab as per UX requirement.
