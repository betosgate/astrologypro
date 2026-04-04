# 01 Close Report List Date Filter Parity

- Status: Done

## Why

Angular lets admins filter report rows by the clicked timestamp. The current Next reports page does not yet expose a date-range filter even though the shared list infrastructure already supports it.

## Current Verified Gap

- Angular search settings include date-range search on `clicked_on`
- Next `/admin/reports` currently has no date-range filter configured
- Next generic list page already supports `dateRangeFields`

## Required Behavior

- Add a date-range filter to `/admin/reports` for `clicked_on`
- Keep the filter compatible with existing search and sorting

## Acceptance Criteria

- users can filter report rows by clicked-time start and end date
- filtered results match the requested date window
- quarter and schedule search continue to work together with the date filter
- sorting still behaves correctly after filtering

## Verification Test Plan

1. Open `/admin/reports`.
2. Apply a clicked-time start and end date that should include a known row.
3. Confirm matching rows remain visible and out-of-range rows are excluded.
4. Combine the date range with quarter search and confirm both conditions are respected.
5. Change sort order and confirm the filtered rows still sort correctly.
