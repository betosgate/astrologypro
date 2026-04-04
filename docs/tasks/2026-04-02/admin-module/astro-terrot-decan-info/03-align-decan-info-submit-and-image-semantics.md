# 03 Align Decan Info Submit And Image Semantics

## Why

Angular does not submit this form as a raw mirror of the visible controls. It transforms the payload before save, and it also hydrates the image field from a stored record field that does not exactly match the visible form control. Those semantics matter for create, edit, and reopen behavior.

## Current Verified Gap

- Angular edit hydrates the visible image control from `tarrot_thumb_image`
- Angular submit transforms the outgoing payload to:
  - `sign_id: formValue.sign`
  - `sign: selected sign label`
  - `tarrot_thumb_image: formValue.images`
- Angular removes the temporary `images` field before submit
- Next form currently uses:
  - `sign` as the visible control key
  - `tarrot_thumb_image` as the visible file field key
- Next generic form submit currently sends the visible field keys directly unless page-specific logic overrides that behavior

## Required Behavior

- Rehydrate the existing tarot image correctly on edit
- Align save behavior with the Angular business semantics for sign id, sign label, and tarot image payload
- Keep create and edit behavior internally consistent so reopening a saved record reflects what was just submitted

## Acceptance Criteria

- edit form shows the existing tarot image correctly
- create and edit both submit the sign id and sign label in the shape the module expects
- create and edit both submit the tarot image in the shape the module expects
- reopening a saved record shows the sign and image correctly

## Verification Test Plan

1. Open `/admin/astrology/decan-info/edit/[id]` for a record with an existing tarot image.
2. Confirm the existing image is visible before making changes.
3. Change the sign and optionally replace the image.
4. Save the record.
5. Reopen the same record and confirm the new sign and image hydrate correctly.
6. Repeat with a new record from the add flow and confirm the first saved version reopens correctly.
