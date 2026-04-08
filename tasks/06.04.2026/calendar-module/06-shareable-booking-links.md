# Task: Shareable Booking Links & Menu Integration

- Status: Completed (2026-04-08, verified)
- Completion Notes: Per-diviner public link at /[username]; admin sidebar entries verified in admin-sidebar.tsx.

## Objective
Provide diviners with easy-to-use shareable links for their booking pages and integrate the Calendar module into the Admin Sidebar.

## Requirements
- [ ] **Link Generation Logic**:
    - Create a "Copy Link" utility for each service.
    - Accessible from both the **Admin List View** (on behalf of diviners) and the **Diviner's Personal Dashboard**.
- [ ] **Dashboard Integration**:
    - Add a "Calendar Management" section to both the **Admin Sidebar** and **Diviner Dashboard**.
    - Sub-menus:
        - **Overview**: View all upcoming bookings.
        - **Availability**: Set hours and overrides.
        - **Connections**: Google/Outlook OAuth status.
- [ ] **UI Action**:
    - A dedicated "Share" button at the top of the Diviner's Dashboard.
    - A "Calendar Settings" page in the Admin core.

## Technical Details
- Ensure the `username` used in the URL is the unique slug from the `diviners` table.
- Link state should be persistent and easy to access.
