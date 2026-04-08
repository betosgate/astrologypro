# Task: Admin Tarot Card Module

- Status: Completed (2026-04-08, verified)
- Completion Notes: Implemented at src/app/admin/tarot/cards/{page,new,[id]}.tsx with API at src/app/api/admin/tarot/cards/.
Date: 2026-04-07
Category: Tarot Module

## Objective
Provide administrators with a module to manage Tarot Cards (separately from Tarot Spreads), including listing, filtering, adding, and editing tarot cards.

## Requirements
1.  **Tarot Card Listing Page**:
    *   Search / Filter Fields (Top search options):
        *   Search By Card Name (text input)
        *   Search By Status (select dropdown: Active / Inactive)
        *   Search By Related Spreads (select dropdown) - Options are populated from the backend API (`tarot-spreads/spread-list`).
        *   Search By Created On Start Date & End Date (datepicker)
        *   Search By Updated On Start Date & End Date (datepicker)
    *   Data Table Columns:
        *   Card Name
        *   Related Spreads
        *   Priority
        *   Status
        *   Updated On
        *   Created On
        *   Actions (Preview, Edit, Delete)
    *   Buttons:
        *   "ADD TAROT CARD" button which navigates the user to the Add Form component.
        *   Search and Reset action icons.
2.  **Add / Edit Tarot Card Form**:
    *   Clicking the "ADD TAROT CARD" button opens a dynamic form (rendered via a custom `lib-showform` form builder).
    *   Form Fields:
        *   Card Name (text input) - Required
        *   Related Spreads (select dropdown with multiple choices) - Required. Fetches available options from the `tarot-spreads/spread-list` API.
        *   Priority (number input) - Required
        *   Description (textarea for detailed description)
        *   Active (checkbox) - Used to mark the status (Checked = 1/Active, Unchecked = 0/Inactive).
        *   Upload Tarot Spread Image (file upload) - A drag-and-drop file upload area. Directly uploads the image to an AWS S3 Bucket. (Uses the API endpoint: `user-profile/request-bucket-url`).
    *   Form Action Buttons:
        *   Submit / Update: Saves the form data. (Hits the `tarot-card/tarot-card-add` API for creating, or `tarot-card/card-update` if editing).
        *   Cancel: Exits the form and redirects the user back to the Listing Page.
        *   Reset: Clears all entered form data.
3.  **General Admin UI/UX Features**:
    *   **Drag-and-Drop Priority**: Instead of manually typing Priority numbers, allow the Admin to simply drag and drop the rows on the Listing Page to reorder how they appear to users.
    *   **Bulk Actions**: Checkboxes on the left side of the data table for Bulk Activate, Bulk Deactivate, and Bulk Delete.
    *   **Preview Button**: An action icon (👁️) on the listing page that opens a popup/modal to preview exactly how this Card will look on the live website or app.
    *   **Pagination**: Options to show 10, 25, or 50 (max) items per page on the listing table.

## Technical Notes
*   Ensure Tarot Cards are a separate module from Tarot Spreads.
*   The add/edit form must use the custom `lib-showform` form builder.
*   Image upload connects to AWS S3 via `user-profile/request-bucket-url`.
*   Form submission uses `tarot-card/tarot-card-add` (create) or `tarot-card/card-update` (edit).

## Success Criteria
*   An admin can view the list of Tarot Cards and use all filters correctly.
*   An admin can add a new Tarot Card with an image uploaded to S3.
*   An admin can edit an existing Tarot Card.
*   The Tarot Cards module is completely independent from the Tarot Spreads module.
