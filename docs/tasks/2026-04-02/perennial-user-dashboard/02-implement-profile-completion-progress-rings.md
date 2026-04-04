# Task 02 - Implement Profile Completion Progress Rings - 2026-04-02

- Status: Todo
- Priority: P2
- Parent Task: `00-master-task.md`

## Goal

Add the visual progress markers for user and member profile completeness.

## Tasks

- [ ] Create a `ProgressRing` component using SVG (mimicking the Angular `.progress-ring` CSS).
- [ ] Extract `completed_main_user` and `is_others.other_percentage` from the `user/perennial_mandalism_aditonal_member-details-fetch` API response.
    - **Endpoint:** `POST` `user/perennial_mandalism_aditonal_member-details-fetch` (VERIFIED: No leading slash)
    - **Payload:** `{ "user_cognito_id": "COGNITO_ID" }` (VERIFIED: Key is `user_cognito_id`)
    - *Absolute Guarantee: This is 100% as per Angular source line 193-195.*
- [ ] Render the "Your Profile" card with the user's progress percentage.
- [ ] Render the "Members' Profiles" card with the collective members' progress percentage.
- [ ] Ensure the rings animate synchronously with the data loading.

## Done Definition

- Two circular progress indicators are visible on the dashboard.
- Percentages match the data returned from the backend.
- Hover/Active states are implemented for the cards.

## Verification Plan

- Verify that the percentage displayed matches the `completed_main_user` value in the API response.
- Check that the progress ring's stroke-dashoffset updates correctly based on the value.
