# Task 05 - Implement Content Counts and Detailed Membership Info - 2026-04-02

- Status: Todo
- Priority: P3
- Parent Task: `00-master-task.md`

## Goal

Utilize the content count API and expand the membership information details.

## Tasks

- [ ] Call `content/content-type-counts` and store the counts for Live Stream, Video Library, etc.
    - **Endpoint:** `GET` `content/content-type-counts` (VERIFIED: This is a GET request)
    - **Payload:** None.
- [ ] Create a "Content Overview" card to display these counts (as seen in Angular's `order-card`).
- [ ] Expand the `SubscriptionWidget` or create a new card to show:
    - User Email (from `memberShipData.email`).
    - **Endpoint:** `POST` `user/fetch-membership-details` (VERIFIED: No leading slash)
    - **Payload:** `{ "user_cognito_id": "COGNITO_ID" }` (VERIFIED: Key is `user_cognito_id`)
    - Membership Amount per month.
    - Created Date (formatted).
    - Status Confirmation (Active/Inactive text).

## Done Definition

- Content counts are displayed accurately on the dashboard.
- Membership information is more detailed, matching the Angular dashboard's info density.

## Verification Plan

- Verify that the `content/content-type-counts` API is called.
- Confirm that the email and amount values match the subscription data.
