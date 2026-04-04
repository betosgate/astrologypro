# 02 Close Report Preview IP Metadata Parity

- Status: Done

## Why

Angular exposes a row preview for reports, and that preview includes click context such as location and network metadata from `ip_info`. The current Next reports page does not yet expose preview even though the generic list system can render it from the row data directly.

## Current Verified Gap

- Angular list exposes a Preview action
- Angular preview shows:
  - quarter
  - schedule
  - clicked time
  - city
  - country
  - hostname
  - IP address
  - coordinates
  - zip
  - region
  - timezone
- Next `/admin/reports` currently does not configure preview fields
- Next generic list already supports `previewFromRow`

## Required Behavior

- Enable preview on `/admin/reports`
- Configure preview to render the row-backed report fields and IP metadata when present
- Prefer preview-from-row because Angular preview already uses the clicked row data directly

## Acceptance Criteria

- users can open preview from a report row
- preview shows quarter, schedule, and clicked time
- preview also shows available `ip_info` metadata without requiring an extra fetch
- empty or missing IP fields degrade gracefully

## Verification Test Plan

1. Open `/admin/reports`.
2. Launch preview for a report row with populated IP metadata.
3. Confirm quarter, schedule, clicked time, and IP metadata fields are shown.
4. Launch preview for a row with partial or missing `ip_info` and confirm the dialog still renders cleanly.
5. Confirm preview opening does not interfere with list search, filter, or sort state.
