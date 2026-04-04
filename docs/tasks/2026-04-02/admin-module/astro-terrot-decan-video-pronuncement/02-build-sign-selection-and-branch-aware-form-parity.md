# 02 Build Sign Selection And Branch Aware Form Parity

## Why

Angular uses a real sign selection flow and then branches the form into three different content-authoring paths. The current Next form still treats sign as free text and only partially models the branch-specific field requirements.

## Current Verified Gap

- Angular sign field loads from `wheel_signs/wheel-sign-autocomplete`
- Angular sign field stores the selected sign id, not just a typed label
- Angular form supports three branch workflows:
  - uploaded video
  - YouTube video
  - pronouncement
- Next form currently uses a free-text `sign` field
- Next form does not model the branch-specific field set as completely as Angular

## Required Behavior

- Replace free-text sign entry with a proper sign-selection flow
- Keep decan and content-type selection behavior aligned with Angular
- Ensure the visible fields change correctly for all three content branches

## Acceptance Criteria

- add and edit forms load selectable sign options
- uploaded-video branch shows the correct authoring fields
- YouTube-video branch shows the correct authoring fields
- pronouncement branch shows the correct authoring fields
- branch switching does not leave stale or conflicting fields active

## Verification Test Plan

1. Open `/admin/astrology/decan-videos/add`.
2. Confirm sign options load and can be selected.
3. Switch between uploaded video, YouTube video, and pronouncement.
4. Confirm each branch shows only the relevant fields.
5. Open `/admin/astrology/decan-videos/edit/[id]` for one record from each branch and confirm the correct branch is selected on load.
