# Task: Admin User List - Pagination Relocation
Date: 2026-04-07
Category: Admin Dashboard

## Objective
Relocate the "Items per page" dropdown (e.g., "10 / page") from its current position in the top-right header to the bottom of the table, alongside the pagination controls. This align the UI with common dashboard standards where page-size and page-number controls are grouped together.

## Requirements
- **UI Relocation**:
    - File: `src/app/admin/users/page.tsx`
    - Locate the `<Select>` component used for setting the page limit (currently shown as `10 / page` in the top right).
    - Move this component to the footer of the user table, specifically next to the "Prev/Next" buttons or page number indicators.
- **Functionality**:
    - Ensure that changing the value (e.g., from 10 to 25 or 50) correctly updates the `limit` query parameter or state.
    - The table should automatically re-fetch the data with the new limit once a selection is made.
- **Styling**:
    - The dropdown should be compact and fit seamlessly into the footer layout.
    - Ensure it is responsive and doesn't break the layout on smaller screens.

## Success Criteria
- The top-right header is cleaner without the pagination dropdown.
- Users can clearly see and change the page size right before or after navigating pages at the bottom.
