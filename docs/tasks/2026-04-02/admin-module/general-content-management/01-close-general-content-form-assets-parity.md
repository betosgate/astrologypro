# 01 Close General Content Form Assets Parity

## Why

Angular general-content add and edit both allow admins to upload an asset file with the content record. The current Next form does not yet expose that field, so the module is not functionally complete.

## Current Verified Gap

- Angular form includes an `assets` file field
- Angular stores that asset under the journal-content workflow
- Next `/admin/content/general/add` and `/admin/content/general/edit/[id]` currently do not expose an `assets` field

## Required Behavior

- Add the missing `assets` upload field to the Next general-content form
- Ensure create and edit both support the field
- Preserve the existing sign, decan, title, and description behavior

## Acceptance Criteria

- admins can upload an asset when creating general content
- admins can replace or preserve the asset when editing general content
- existing fields continue to work

## Verification Test Plan

1. Open `/admin/content/general/add`.
2. Fill the required fields and upload an asset.
3. Submit the record and confirm save succeeds.
4. Open the saved record in edit mode.
5. Confirm the asset workflow is still available and does not break the other fields.
