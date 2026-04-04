# Task: Testimonial Request List

**Date:** 2026-04-01
**Status:** Done

## Objective
Implement a dedicated list page for testimonial requests with advanced filtering and search capabilities.

## List Page Specification (based on screenshot)
- **Title:** Testimonial Requests
- **API Endpoint:** `testimonial/testimonial-list`
- **Columns:**
  - `Request to name`: `requested_to_name`
  - `Requested To Email`: `requested_to_email`
  - `Notes`: `notes`
  - `Created On`: `created_at`
  - `Updated On`: `updated_at`
  - `Actions`: View (eye), Edit (pencil), Delete (trash), Toggle (status)

## Search Filters
The page should include the following filters at the top:
- **Search By Testimonial:** Text search (likely on `notes` or `testimonial_title`).
- **Search By Requested By Email:** Text search on `requested_to_email`.
- **Submitted On (Date Range):**
  - Start Date
  - End Date
- **Updated On (Date Range):**
  - Start Date
  - End Date

## Implementation Patterns
- Use the standard `GenericListPage` and `DataTable` components.
- Ensure `DataTableToolbar` is updated to support the date range filters.
- Use the `$regex` pattern for text searches in the `searchcondition` payload.
- Use `$gte` and `$lte` for date range filters in the `condition` payload.

## Tasks
- [ ] Implement the list page at `/admin/testimonials/requests`.
- [ ] Configure `GenericListPage` with the specified columns and search fields.
- [ ] Implement date range filtering in `DataTableToolbar` and `GenericListPage`.
