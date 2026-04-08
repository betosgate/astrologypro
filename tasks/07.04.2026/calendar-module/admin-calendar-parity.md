# Task: Admin Personal Scheduling System

- Status: Completed (2026-04-08, verified)
- Completion Notes: Admin calendar at src/app/admin/calendar/{page,new,[id]/edit}/page.tsx; admin bookings list at src/app/admin/bookings/page.tsx with detail view. Reuses the CalendarView/AvailabilityBuilder components.
Date: 2026-04-07
Category: Calendar Module

## Objective
Provide administrators with the same personal scheduling, OAuth connection, and availability management tools that are currently available to Diviners.

## Requirements
1.  **Personal Calendar for Admins**:
    *   Add a "My Schedule" section to the Admin Dashboard.
    *   Allow Admins to connect their own Google or Microsoft accounts.
    *   Allow Admins to create their own availability slots and date overrides.
2.  **Shared Infrastructure**:
    *   Ensure the `CalendarView` and `AvailabilityBuilder` components are accessible and functional for the Admin role.
    *   Ensure Admins have a corresponding record in the underlying provider table (diviners) if required for data integrity.
3.  **Global Bookings Overview**:
    *   Create a specialized `/admin/bookings` list for platform-wide session monitoring.
    *   Include filters for Diviner, Client, Status, and Date Range.

## Technical Notes
*   Reuse the `CalendarView` components but wrap them in an admin-authorized state.
*   Ensure all write operations verify `admin` role status.
*   Log all administrative calendar changes in the `admin_activity_log`.

## Success Criteria
*   An admin can successfully block a day on a diviner's schedule from the admin panel.
*   The blocked day is immediately reflected on that diviner's public booking page.
*   A "Global Bookings" list is accessible via the Admin Sidebar.
