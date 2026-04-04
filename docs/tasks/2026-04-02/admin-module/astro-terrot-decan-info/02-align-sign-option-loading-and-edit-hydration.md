# 02 Align Sign Option Loading And Edit Hydration

## Why

The sign field is central to this form, and there is a real compatibility problem between the Angular flow and the current shared Next form utilities. Without fixing it, add or edit can fail to load sign options or fail to preselect the existing sign on edit.

## Current Verified Gap

- Angular loads sign options from `wheel_signs/wheel-sign-autocomplete`
- Angular reads that option payload from `response.res`
- Next dynamic select currently parses:
  - `json.data`
  - `json.results.res`
  - `json.results`
  - `json.dt.res`
- Next dynamic select does not currently parse `json.res`
- Angular edit hydrates the sign control from `sign_id`
- Next generic edit reset currently hydrates select fields from the same field key only, which means the `sign` field can miss existing `sign_id`-backed values

## Required Behavior

- Align dynamic sign option loading with the response shape used by the working Angular endpoint
- Align edit hydration so the selected sign is restored correctly when the fetched record stores the chosen sign under `sign_id`
- Preserve the existing generic form behavior for modules that already work

## Acceptance Criteria

- the sign dropdown loads options from `wheel_signs/wheel-sign-autocomplete`
- editing an existing decan-info record preselects the saved sign correctly
- add flow and edit flow both keep the sign field usable

## Verification Test Plan

1. Open `/admin/astrology/decan-info/add`.
2. Confirm the sign dropdown loads real sign options.
3. Open `/admin/astrology/decan-info/edit/[id]` for an existing record.
4. Confirm the current sign is preselected correctly.
5. Change the sign, save, reopen, and confirm the updated sign still hydrates correctly.
