# Task: US Timezone & DST Scheduling Logic

## Objective
Ensure the scheduling system is robust across all US timezones, correctly handling Daylight Saving Time (DST) transitions and displaying times in the viewer's local context.

## Requirements
- [ ] **Timezone Lib**: Standardize on `date-fns-tz` or `luxon` for all server-side and client-side calculations.
- [ ] **Timezone Presets**: Provide a quick selector for:
    - Eastern Time (ET)
    - Central Time (CT)
    - Mountain Time (MT)
    - Pacific Time (PT)
    - **Alaska Time (AKT)**
    - **Hawaii-Aleutian Time (HAT)**
    - **IST (India Standard Time)** - Note: IST does not observe Daylight Saving Time.
- [ ] **DST Logic**:
    - Verify that recurring slots (weekly) remain anchored to the correct wall-clock time after a DST change.
    - Handle the "Double Hour" and "Missing Hour" edge cases during transition days.
- [ ] **Viewer Local Time**: Detect the client's timezone automatically but allow them to manually toggle to the Diviner's timezone for reference.

## Implementation Notes
- Store everything in the database as UTC.
- Perform all calculations (intersection of busy slots) in UTC.
- Only convert to local time for the final UI presentation.
