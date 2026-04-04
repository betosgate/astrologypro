# 01 Close Wheel Sign List Search Date Filter And View Parity

## Why

Angular gives admins three list behaviors that are still missing from the current Next page: sign search through the working wheel-sign selector, start-date range filtering, and row view access.

## Current Verified Gap

- Angular list supports search by sign through `wheel_signs/wheel-sign-autocomplete`
- Angular list supports date-range filtering on `startDateTime`
- Angular list keeps the default row view flow enabled
- Next `/admin/astrology/wheel-signs` currently:
  - uses plain text search on `sign_name`
  - does not configure date-range filtering
  - does not configure row preview or view

## Required Behavior

- Add list search behavior that matches the working wheel-sign admin flow
- Add a start-date range filter on `startDateTime`
- Restore row view or preview access from the list

## Acceptance Criteria

- admins can find wheel signs using the working sign-search workflow
- admins can filter by start-date range
- admins can open the row view or preview from the list
- existing edit navigation and no-delete behavior continue to work

## Verification Test Plan

1. Open `/admin/astrology/wheel-signs`.
2. Search for a known wheel sign and confirm the matching row appears.
3. Apply a start-date range that should include a known record.
4. Confirm in-range rows remain visible and out-of-range rows are excluded.
5. Open the row view or preview and confirm the wheel-sign details render.
6. Navigate to edit from the same row and confirm existing actions still work.
