# Task: Admin Testimonial Request — Parity with Old Project

- Status: Completed (2026-04-08, verified)
- Completion Notes: Implemented at src/app/admin/testimonials/requests/ with src/components/admin/testimonial-requests-table-client.tsx; sidebar integration verified in admin-sidebar.tsx.
Date: 2026-04-07
Category: Request Testimonial Module
Status: Completed (2026-04-08, verified)

## Objective
Align the "Request Testimonial" module with the old project's specifications. This includes updating the list page (`/admin/testimonials/requests`), the request form (with Admin vs Astrologer conditional logic), and integrating "Manage Testimonial" into the main administrative sidebar.

---

## Gap Analysis — Current vs Old Project

### 1. Request Testimonial List Page Columns

| # | Column | Old Project | New Project | Gap? |
|---|--------|-------------|-------------|------|
| 1 | Checkbox | ✅ Multi-select for bulk delete | ❌ Missing | **YES** |
| 2 | # | ✅ Serial number | ❌ Missing | **YES** |
| 3 | Request to name | `requested_to_name` | ✅ Present | OK |
| 4 | Requested To Email| ✅ Sortable | ✅ Present | **YES** — add sorting |
| 5 | Notes | ✅ Short message | ✅ Present | OK |
| 6 | Created On | ✅ Sortable, Format: `MMMM D YYYY, h:mm:ss A` | Partial (Short date) | **YES** — format & sort |
| 7 | Updated On | ✅ Sortable, Format: `MMMM D YYYY, h:mm:ss A` | ❌ Missing | **YES** |
| 8 | Actions | ✅ Preview, Edit (cond), Status Toggle, Delete | Partial (Mark Sent, Complete, Delete) | **YES** — add Preview, toggle, conditional Edit |

> **Conditional Edit**: Edit button should only appear if `added_by` matches current logged-in user.

### 2. Search Filters

| Filter Type | Label | Searches Field | Status |
|-------------|-------|----------------|--------|
| Text Input | Search By Testimonial | `testimonial_content` | ❌ Missing |
| Text Input | Search By Requested By Email | `requested_to_email` | ❌ Missing |
| Date Picker | Submitted On Start Date | `created_on` (start) | ❌ Missing |
| Date Picker | Submitted On End Date | `created_on` (end) | ❌ Missing |
| Date Picker | Updated On Start Date | `updated_on` (start) | ❌ Missing |
| Date Picker | Updated On End Date | `updated_on` (end) | ❌ Missing |

**Action Buttons**: Add 🔍 Search and 🔄 Reset icons below the filters.

### 3. Pagination Parity
*   Show "Showing X To Y of Z" text.
*   Add **Page Size** dropdown/input (default 10).
*   Add **Page No** direct input field.
*   Add **First** and **Last** navigation arrows (in addition to Prev/Next).

### 4. "Request Testimonial" Form Logic (Admin vs Astrologer)

The form must behave differently based on the user's role:

#### Admin Form
*   **Astrologer Dropdown**: Visible & required.
*   **Notes Field**: Large textarea (25 rows $\times$ 25 cols).
*   **Validation**: "Request to name is Required", "Request to Email (+ regex)", "Phone is Required", "Testimonial Content is Required".

#### Astrologer Form
*   **Astrologer Dropdown**: **HIDDEN**. Auto-sets `testimonial_for` to the logged-in astrologer's ID.
*   **Notes Field**: Simple **single-line text input**.
*   **Validation**: Same as Admin.

### 5. Preview Dialog
*   Action icon (👁️) should open a modal showing:
    *   `requested_to_name` (Customer Name)
    *   `requested_to_email` (Customer Email)
    *   `notes` (Notes)

---

## 🛠 Required Changes

### Sidebar Navigation Integration
Create a new sidebar category **"MANAGE TESTIMONIAL"** (or move under ENGAGEMENT) with:
1.  **Create Testimonial** (links to `/admin/testimonials`)
2.  **Request Testimonial** (links to `/admin/testimonials/requests`)

### Database / API
*   Ensure `testimonial_requests` table tracks `updated_at` and `added_by` (creator ID).
*   API `POST testimonial/testimonial-add` must handle auto-injecting `requested_by_id`, `added_by`, and auto-setting `testimonial_for` for astrologers.
*   Update List API to support all new sorting/filtering parameters.

### Form Component
*   Implement `app-testimonial-form` logic to switch between admin (textarea) and astrologer (text input) modes for the Notes field.

---

## Success Criteria
*   Sidebar shows "Manage Testimonial" with both sub-pages.
*   The request list page matches the 8-column layout of the old project.
*   The request form correctly toggles between "Admin" and "Astrologer" layouts.
*   Search filter executes only on "Search" button click (not just on type).
*   Pagination features (Page Size, Page No, First/Last) are fully functional.
*   Edit button logic respects ownership of the request.
