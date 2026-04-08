# Task: Admin Testimonial List — Parity with Old Project

- Status: Completed (2026-04-08, verified)
- Completion Notes: Implemented at src/app/admin/testimonials/{page,create,[id]/edit}.tsx with src/components/admin/testimonials-table-client.tsx using the standard SortHeader/pushParams/SearchAutocomplete pattern.
Date: 2026-04-07
Category: Testimonial Module
Status: Completed (2026-04-08, verified)

## Objective
Align the admin "Created Testimonial List" page (`/admin/testimonials`) and "Add/Edit Testimonial" form (`/admin/testimonials/create`, `/admin/testimonials/[id]/edit`) with the old project's full feature set, including all table columns, search filters, bulk actions, preview dialog, rich-text editor, and proper pagination.

---

## Gap Analysis — Current vs Old Project

### List Page Table Columns

| # | Column | Old Project | New Project | Gap? |
|---|--------|-------------|-------------|------|
| 1 | Checkbox (multi-select) | ✅ Bulk select for delete | ❌ Missing | **YES** |
| 2 | # (Serial number) | ✅ Auto-generated | ❌ Missing | **YES** |
| 3 | Title (`testimonial_title`) | ✅ Sortable | ❌ Missing | **YES** |
| 4 | Email (`requested_to_email`) | ✅ Shown | ❌ Missing | **YES** |
| 5 | Added By (`added_by_name`) | ✅ Sortable — who created | ❌ Missing | **YES** |
| 6 | Added For (`requested_to_name`) | ✅ Sortable — customer name | Partial (shows `client_name`) | **YES** — rename & match |
| 7 | Phone No (`requested_to_phone_no`) | ✅ Shown | ❌ Missing | **YES** |
| 8 | Status | ✅ Active/Inactive toggle | Partial (multi-status badges) | **YES** — simplify to Active/Inactive |
| 9 | Created On | ✅ Sortable, `MMMM D YYYY, h:mm A` | Partial (shows `MMM D, YYYY` — no time) | **YES** — add time |
| 10 | Actions | ✅ Preview, Edit, Status Toggle, Delete | Partial (Edit, Approve/Reject/Hide, Delete) | **YES** — add Preview + toggle |
| — | Diviner | ❌ Not in old project | ✅ Currently shown | Keep — project-specific |
| — | Rating | ❌ Not in old project | ✅ Star display | Keep — project-specific |

### Search Filters

| # | Filter | Old Project | New Project | Gap? |
|---|--------|-------------|-------------|------|
| 1 | Search By Title | ✅ Text input on `testimonial_title` | ❌ Missing | **YES** |
| 2 | Search By Added For | ✅ Text input on `requested_to_name` | Partial (searches `client_name` only) | **YES** — rename |
| 3 | Search by Created On Start Date | ✅ Datepicker | ❌ Missing | **YES** |
| 4 | Search by Created On End Date | ✅ Datepicker | ❌ Missing | **YES** |
| 5 | Status filter | ❌ Not a filter in old project | ✅ Dropdown (current) | Keep |
| — | Search + Reset buttons | ✅ Icon buttons below filters | ❌ Missing (auto-search on type) | **YES** |

### Pagination

| Feature | Old Project | New Project | Gap? |
|---------|-------------|-------------|------|
| "Showing X To Y of Z" text | ✅ | ❌ Missing | **YES** |
| Configurable Page Size (default 10) | ✅ Input | ❌ Hardcoded 10 | **YES** |
| Page No input | ✅ | ❌ Missing | **YES** |
| First/Prev/Next/Last arrows | ✅ 4 arrows | Partial (Prev/Next only) | **YES** — add First/Last |

### Add / Edit Testimonial Form

| # | Field | Old Project | New Project | Gap? |
|---|-------|-------------|-------------|------|
| 1 | Title | ✅ Required | ✅ Present (optional) | **YES** — make required |
| 2 | Customer Name (`requested_to_name`) | ✅ Required | ✅ Present as `client_name` | OK — rename label |
| 3 | Customer Email (`requested_to_email`) | ✅ Required, auto-lowercase | ❌ Missing | **YES** |
| 4 | Phone (`requested_to_phone_no`) | ✅ Required, formatted | ❌ Missing | **YES** |
| 5 | Astrologer/Diviner dropdown | ✅ Required, from API | ✅ Present, from API | OK |
| 6 | Feedback (`testimonial_content`) | ✅ CKEditor (Rich text) | ❌ Plain `<textarea>` | **YES** — add rich editor |
| 7 | Upload Images | ✅ Multiple, S3 | ✅ Multiple, Supabase Storage | OK |
| 8 | Upload Audio | ✅ Multiple, S3 | ✅ Multiple, Supabase Storage | OK |
| 9 | Upload Videos | ✅ Multiple, S3 | ✅ Multiple, Supabase Storage | OK |
| 10 | Active checkbox | ✅ Default Active | Partial (status dropdown) | **YES** — add simple Active toggle |
| — | Rating (Star selector) | ❌ Not in old project | ✅ Present | Keep |
| — | Featured toggle | ❌ Not in old project | ✅ Present | Keep |
| — | Reset button | ✅ (hidden in edit mode) | ❌ Missing | **YES** |

### Preview Dialog

| Feature | Old Project | New Project | Gap? |
|---------|-------------|-------------|------|
| Preview button in actions | ✅ | ❌ Missing | **YES** |
| Preview modal shows: title, content, added_by, added_for, phone | ✅ | ❌ Missing | **YES** |

---

## Requirements — What to Implement

### 1. List Page Enhancements (`/admin/testimonials`)

1.  **Add missing table columns**:
    *   Checkbox column (leftmost) — for multi-select
    *   `#` serial number column
    *   `Title` column (`title` field, sortable)
    *   `Email` column (new DB field `requested_to_email` or from `client_email`)
    *   `Added By` column (admin user who created — store in new field `added_by_name`)
    *   `Phone No` column (new DB field `requested_to_phone_no`)
    *   Keep Diviner and Rating columns (project-specific)
    *   Update `Created On` date format to `MMMM D YYYY, h:mm A`

2.  **Add sortable columns**: Title, Added By, Added For (client_name), Created On — with sort arrow indicators and click-to-sort.

3.  **Search filters — 4 fields + buttons**:
    *   "Search By Title" — text input
    *   "Search By Added For" — text input
    *   "Search by Created On Start Date" — datepicker
    *   "Search by Created On End Date" — datepicker
    *   Keep existing Status dropdown
    *   🔍 Search button + 🔄 Reset button (icon buttons below filters)

4.  **Pagination upgrade**:
    *   Show "Showing X To Y of Z" text
    *   Configurable Page Size input (default: 10)
    *   Page No input field
    *   First / Prev / Next / Last navigation buttons

5.  **Actions column**:
    *   Preview button (👁️) — opens modal
    *   Edit button (✏️) — navigates to edit form
    *   Status Toggle button (🔄) — Active/Inactive toggle
    *   Delete button (🗑️) — with confirm dialog

6.  **Bulk Actions**:
    *   "Select All" checkbox in header
    *   Bulk Delete button (appears when items selected)

7.  **Preview Dialog**:
    *   Modal showing: Title, Feedback/Content, Added By, Added For, Phone No

### 2. Add/Edit Form Enhancements

1.  **Make Title required** — add validation "Title is Required"
2.  **Add Customer Email field** — required, auto-lowercase on save, validation "Customer Email is Required"
3.  **Add Phone field** — required, formatted phone input, validation "Phone is Required"
4.  **Replace plain `<textarea>` with Rich Text Editor** — use a React-compatible rich editor (e.g., `react-quill`, `tiptap`, or `@ckeditor/ckeditor5-react`)
5.  **Add Active checkbox** — default checked (Active), maps to status active/inactive
6.  **Add Reset button** — clears all fields, hidden in edit mode
7.  **Form validation messages**:
    *   "Title is Required"
    *   "Customer Name is Required"
    *   "Customer Info is Required" (email)
    *   "Phone is Required"
    *   "Select Astrologer Field" (diviner)
    *   "Description is Required" (content/feedback)

### 3. Database Schema Updates

New columns needed on `testimonials` table:
*   `requested_to_email` VARCHAR(200) — customer email
*   `requested_to_phone_no` VARCHAR(30) — customer phone  
*   `added_by_name` VARCHAR(100) — name of admin who created
*   `added_by_id` TEXT — ID of the admin who created

> **Note:** Some of these fields already exist on `testimonial_requests` table but NOT on `testimonials` table itself. Need migration to add them.

### 4. API Updates

*   `GET /api/admin/testimonials` — add support for:
    *   `title` search parameter
    *   `client_name` (added_for) search parameter
    *   `date_from` and `date_to` range parameters
    *   `sort_by` and `sort_order` parameters
    *   `page` and `page_size` parameters (server-side pagination)
*   `POST /api/admin/testimonials` — accept new fields: `requested_to_email`, `requested_to_phone_no`, `added_by_name`, `added_by_id`
*   `PATCH /api/admin/testimonials/[id]` — accept same new fields on update
*   New: `GET /api/admin/testimonials/[id]/preview` — return preview data

### 5. Dashboard Integration

*   Under "Manage Testimonial" (or equivalent nav), show:
    *   **Create Testimonial** → testimonial list + add form
    *   **Request Testimonial** → testimonial request list (already exists at `/admin/testimonials/requests`)

---

## Technical Notes
*   Rich text editor recommendation: `react-quill` (lightweight) or `tiptap` (modern, extensible). CKEditor is too large for Next.js.
*   Phone input formatting: use existing pattern or `react-phone-number-input` package.
*   Storage: continue using Supabase Storage (not S3) for media uploads.
*   Auto-injected fields on submit: `added_by_id` and `added_by_name` from admin session.

## Success Criteria
*   Admin testimonial list page matches old project column layout with all 10 columns.
*   All 4 search filters work correctly (title, added_for, date range).
*   Pagination shows "Showing X to Y of Z" with configurable page size and First/Last buttons.
*   Preview dialog opens on button click and shows correct data.
*   Add/Edit form includes all fields (title, name, email, phone, diviner, rich text, media uploads, active toggle).
*   Bulk delete via checkboxes works.
*   Sortable columns respond to click with ascending/descending order.
