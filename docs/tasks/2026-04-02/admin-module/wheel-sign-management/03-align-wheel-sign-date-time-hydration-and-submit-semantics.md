# 03 Align Wheel Sign Date Time Hydration And Submit Semantics

## Why

Angular does not submit the visible wheel-sign date and time fields directly. It converts them into `startDateTime` and `endDateTime`, removes the temporary UI fields, and updates records using the payload shape this module expects. The shared Next form does not currently preserve those semantics.

## Current Verified Gap

- Angular combines:
  - `start_date` + `start_time` into `startDateTime`
  - `end_date` + `end_time` into `endDateTime`
- Angular rehydrates edit mode by splitting stored timestamps back into date and time inputs
- Angular update flow sends the edit identifier in the shape this module expects
- Next generic form currently:
  - submits visible fields directly
  - does not combine date and time into timestamp fields
  - resets fields by matching the same key name only
  - uses the default generic edit identifier behavior

## Required Behavior

- Rehydrate wheel-sign edit mode from stored `startDateTime` and `endDateTime`
- Convert date and time inputs back into the stored timestamp fields on save
- Ensure update payloads use the identifier shape required for successful wheel-sign edits
- Preserve existing non-date fields during save

## Acceptance Criteria

- add flow saves valid `startDateTime` and `endDateTime`
- edit flow reopens with the correct start and end date-time values
- edit flow submits successfully using the module-compatible payload
- saved changes persist after reopening the same record

## Verification Test Plan

1. Create a wheel-sign record with known start and end date-time values.
2. Reopen it in edit mode and confirm the same date and time values are shown.
3. Change the start or end time and save.
4. Confirm the update succeeds.
5. Reopen the record and confirm the updated date-time values persisted correctly.
