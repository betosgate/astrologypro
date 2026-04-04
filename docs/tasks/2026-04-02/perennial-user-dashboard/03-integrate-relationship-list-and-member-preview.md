# Task 03 - Integrate Relationship List and Member Preview - 2026-04-02

- Status: Todo
- Priority: P2
- Parent Task: `00-master-task.md`

## Goal

Integrate a direct preview of the relationship list on the dashboard.

## Tasks

- [ ] Create a "Relationship" card to display the first few additional members (with `slice: 1` as in Angular).
    - **Endpoint:** `POST` `user/perennial_mandalism_aditonal_member-details-fetch` (VERIFIED: No leading slash)
    - **Payload:** `{ "user_cognito_id": "COGNITO_ID" }` (VERIFIED: Key is `user_cognito_id`)
- [ ] Display member initials in an avatar, their full name (uppercase), and their `sub_relation`.
- [ ] Add a count of "Members Connected" (e.g., `membersData.length - 1`).
- [ ] Implement an empty state message: "No other members to display."
- [ ] Add an "Explore Compatibility" button that links to the compatibility tab or page.

## Done Definition

- The relationship list is visible directly on the dashboard.
- Member details (name, initials, relation) match the Angular display.
- Navigation to compatibility works.

## Verification Plan

- Verify the list correctly skips the first (main) user.
- Confirm the member count reflects the total members minus one.
- Check the layout on small screens (mobile responsiveness).
