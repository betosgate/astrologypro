# Task: Admin Tarot Spread Module

- Status: Completed (2026-04-08, verified)
- Completion Notes: Implemented at src/app/admin/tarot/spreads/{page,new,[id]}.tsx with API at src/app/api/admin/tarot/spreads/.
Date: 2026-04-07
Category: Tarot Module

## Objective
Provide administrators with a module to manage Tarot Spreads (separately from Tarot Cards), including listing, filtering, adding, and editing tarot spreads.

## Requirements
1.  **Tarot Spread Listing Page**:
    *   Search / Filter Fields (Top search options):
        *   Search By Spread Name (text input)
        *   Search By Status (select dropdown: Active / Inactive)
        *   Search By Created On Start Date & End Date (datepicker)
        *   Search By Updated On Start Date & End Date (datepicker)
    *   Data Table Columns:
        *   # (Index)
        *   Spread Name
        *   Description
        *   Priority
        *   Status
        *   Updated On
        *   Created On
        *   Actions (Edit, Delete, or toggle Status)
    *   Buttons:
        *   "ADD TAROT SPREAD" button which navigates the user to the Add Form component (`/admin-dashboard/tarot-spreads/add-tarot-spreads`).
        *   Search and Reset action icons.
2.  **Add / Edit Tarot Spread Form**:
    *   Clicking the "ADD TAROT SPREAD" button opens a dynamic form (rendered via a custom `lib-showform` form builder) on a separate page.
    *   Form Fields:
        *   Spread Name (text input) - Required
        *   Priority (number input) - Required
        *   Description (text input, typically rendered as a larger text area) - Required
        *   Status (checkbox) - Used to mark the active status (Checked = 1/Active, Unchecked = 0/Inactive).
        *   Upload Tarot Spread Image (file upload) - A drag-and-drop file upload area ("Browse or Drop Files Here"). Directly uploads the image (or multiple images) to an AWS S3 Bucket. (Uses the API endpoint: `user-profile/request-bucket-url`).
    *   Form Action Buttons:
        *   Submit / Update: Saves the form data. (Hits the `tarot-spreads/tarot-spread-add` API for creating, or `tarot-spreads/spread-update` if editing an existing spread).
        *   Cancel: Exits the form and redirects the user back to the Spread Listing Page (`/admin-dashboard/tarot-spreads`).
        *   Reset: Clears all entered form data.
3.  **General Admin UI/UX Features**:
    *   **Drag-and-Drop Priority**: Instead of manually typing Priority numbers, allow the Admin to simply drag and drop the rows on the Listing Page to reorder how they appear to users.
    *   **Bulk Actions**: Checkboxes on the left side of the data table for Bulk Activate, Bulk Deactivate, and Bulk Delete.
    *   **Preview Button**: An action icon (👁️) on the listing page that opens a popup/modal to preview exactly how this Spread will look on the live website or app.
    *   **Pagination**: Options to show 10, 25, or 50 (max) items per page on the listing table.

## Technical Notes
*   Ensure Tarot Spreads are a separate module from Tarot Cards.
*   The add/edit form must use the custom `lib-showform` form builder.
*   Image upload connects to AWS S3 via `user-profile/request-bucket-url`.
*   Form submission uses `tarot-spreads/tarot-spread-add` (create) or `tarot-spreads/spread-update` (edit).

## Success Criteria
*   An admin can view the list of Tarot Spreads and use all filters correctly.
*   An admin can add a new Tarot Spread with images uploaded to S3.
*   An admin can edit an existing Tarot Spread.
*   The Tarot Spreads module is completely independent from the Tarot Cards module.
