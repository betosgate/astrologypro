# Task: Premium Availability Management UI

## Objective
Implement a high-end interface for **Administrators and Diviners** to manage availability directly within the dashboard. Admins must be able to create, edit, and view availability on behalf of any selected Diviner.

## Form Fields (based on mockup)
- [ ] **Event Title**: Text input for the name of the availability block/event.
- [ ] **Date Range**:
    - `Start Date` (Date Picker)
    - `End Date` (Date Picker)
- [ ] **Available Week Days**: Row of checkboxes (Sun, Mon, Tue, Wed, Thu, Fri, Sat).
- [ ] **Time Configuration**:
    - `Time Span`: Dropdown for session duration.
    - `Time Zone`: Searchable dropdown including **IST (India Standard Time)** and all **6 US Timezones** (ET, CT, MT, PT, AKT, HAT).
    - `Start Time` & `End Time`: Time pickers.
- [ ] **Event Details**: **Rich Text Editor** (WYSIWYG) for description/instructions.
- [ ] **Actions**: Premium styled buttons ().

## Technical Requirements
- [ ] **Dynamic Availability Mapping**: 
    - The `Start Date` and `End Date` define the validity period for this specific availability block.
    - `Available Week Days` determine which days within that period are active.
- [ ] **Database Integration**: 
    - Map these fields to `availability_slots` or a new `availability_templates` table to support date-ranged availability.
- [ ] **UI/UX**: Match the provided screenshot's layout (two columns, grouped sections).

## Removed Fields
- [x] Product
- [x] Event Type

## UI/UX Goals
- **Density**: High-density view but remains clear and "premium".
- **Feedback**: Instant save or clear "Unsaved Changes" indicators.
- **Validation**: Prevent overlapping slots or end times before start times.
