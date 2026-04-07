# Task: Availability Builder Navigation & UI Fix
Date: 2026-04-07
Category: Calendar Module

## Problem Statement
Users are currently unable to find the **Weekly Recurring Availability** form. The Header on the Calendar page (`/dashboard/calendar`) mentions setting a weekly schedule, but provides no link to the underlying builder. Furthermore, the sidebar is missing a direct link to the "Availability" management page.

## Current Status (Audit)

### ✅ DONE (Functional)
- [x] **Base Form Layout**: Core fields for title and description are in place.
- [x] **Date Range Logic**: Start and End date pickers are functional.
- [x] **Weekday Selection**: Multi-select pills for Sun–Sat are working.
- [x] **Time Slot Config**: Start and End time pickers are integrated.
- [x] **Duration Handling**: Dropdown for session duration is working.
- [x] **Database Sync**: API to save/edit availability slots is fully implemented.
- [x] **Management UI**: List view for templates, active/inactive toggles, and delete functionality are working.

### ❌ NOT DONE (Missing)
- [ ] **Rich Text Integration**: The description currently uses a standard `<textarea>`. It must be upgraded to a **Rich Text Editor (WYSIWYG)**.
- [ ] **Searchable Timezone**: Currently uses a static `<select>` dropdown. Needs a searchable, premium picker for US/IST timezones.
- [ ] **Sidebar Shortcut**: The "Availability" link is missing from the Diviner Dashboard sidebar.
- [ ] **Calendar CTA**: The header on the grid view (`/dashboard/calendar`) is missing a **"Manage Weekly Schedule"** call-to-action button.
- [ ] **Navigation Loop**: There is no "Back to Calendar" button on the Availability page to return to the grid.

### 🛠️ FIXES/REFINEMENTS
- [ ] **Overlapping Validation**: Add front-end and back-end checks to prevent creating overlapping time slots on the same days.
- [ ] **Empty State Handling**: Ensure a clean "No Availability" message with a clear CTA if no templates exist.
- [ ] **Loading Feedback**: Add a skeleton or spinner during the "Saving..." state of the form.

## Detailed Requirements

1.  **Sidebar Link**:
    *   **Path**: `src/components/dashboard/sidebar.tsx`
    *   **Action**: Add "Availability" link pointing to `/dashboard/availability`.
    *   **Icon**: `LayoutGrid`.

2.  **Calendar CTA**:
    *   **Path**: `src/app/dashboard/calendar/page.tsx`
    *   **Action**: Add a "Manage Weekly Schedule" button in the header that links to the availability form.

3.  **Cross-Linking**:
    *   **Path**: `src/app/dashboard/availability/page.tsx`
    *   **Action**: Add a "Back to Calendar Grid" button in the header.

4.  **Premium UI Components**:
    *   Replace `Textarea` with a Rich Text Editor.
    *   Replace the timezone `select` with a searchable dropdown.

## Current State
- The page exists at `/dashboard/availability/page.tsx`.
- The API exists at `/api/dashboard/availability`.
- It is currently an "orphaned" page with no incoming navigation links.

## Success Criteria
- A user on the Calendar page can click one button to reach the Weekly Availability form.
- "Availability" is visible and accessible from the sidebar at all times for Diviners.
