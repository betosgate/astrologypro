# 02 Align General Content Sign Option Loading And Submit Semantics

## Why

Angular does not submit this module as a raw mirror of the visible fields. It depends on the working sign-autocomplete response shape and then enriches the final payload with the selected sign label, asset link data, and the current admin id.

## Current Verified Gap

- Angular loads sign options from `wheel_signs/wheel-sign-autocomplete`
- Angular reads that response from `response.res`
- Next dynamic select currently does not parse `json.res`
- Angular submit transforms:
  - `sign_id` from the selected sign control
  - `sign` from the selected sign label
  - `assets_path_link` from the uploaded asset
  - `added_by` from the logged-in admin
- Next generic form currently submits visible field keys directly unless page-specific logic overrides that behavior

## Required Behavior

- Align sign option loading with the response shape used by the working Angular endpoint
- Align create and edit submit behavior with the module’s expected sign and asset metadata semantics
- Preserve existing fetch and edit hydration behavior

## Acceptance Criteria

- sign options load from `wheel_signs/wheel-sign-autocomplete`
- create and edit both submit the selected sign id and sign label correctly
- create and edit both submit `assets_path_link` when an asset exists
- create and edit both include the current admin linkage where the module expects it

## Verification Test Plan

1. Open `/admin/content/general/add`.
2. Confirm sign options load in the selector.
3. Create a record with an asset and save it.
4. Reopen the same record in edit mode and update one field.
5. Confirm the save still succeeds and the sign and asset behavior remains correct.
