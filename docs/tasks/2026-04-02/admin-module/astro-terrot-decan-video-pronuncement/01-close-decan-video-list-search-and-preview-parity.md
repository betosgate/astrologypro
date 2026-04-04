# 01 Close Decan Video List Search And Preview Parity

## Why

Angular lets admins search this list by sign and decan and open a preview dialog from each row. The current Next list shows the data but does not yet expose those working list behaviors.

## Current Verified Gap

- Angular list supports autocomplete-backed search for:
  - `sign`
  - `decan`
- Angular list exposes a Preview action
- Next `/admin/astrology/decan-videos` currently has no configured search fields
- Next `/admin/astrology/decan-videos` currently has no configured preview

## Required Behavior

- Add list search for sign and decan
- Add preview from the list
- Keep the current no-delete behavior intact

## Acceptance Criteria

- admins can search decan-video records by sign
- admins can search decan-video records by decan
- admins can open preview from a list row
- existing edit navigation and created-on visibility continue to work

## Verification Test Plan

1. Open `/admin/astrology/decan-videos`.
2. Search by sign and confirm the list narrows to matching rows.
3. Search by decan and confirm the list narrows to matching rows.
4. Open preview for a known row and confirm the expected content appears.
5. Navigate to edit from a row and confirm list enhancements did not break row actions.
