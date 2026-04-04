# 01 Close Decan Info List Created On Parity

## Why

Angular shows `created_on` on the decan-info list. The current Next list omits that field, which removes a real piece of admin context that exists in the working module today.

## Current Verified Gap

- Angular list headers include:
  - `sign`
  - `planet`
  - `tarrot_name`
  - `greek_daemon`
  - `decan`
  - `created_on`
- Next list currently shows:
  - `sign`
  - `planet`
  - `tarrot_name`
  - `greek_daemon`
  - `decan`
  - `decan_priority`
- Next list does not currently render `created_on`

## Required Behavior

- Add `created_on` visibility to `/admin/astrology/decan-info`
- Keep the existing useful Next columns if they are not disruptive
- Preserve current sorting and navigation behavior

## Acceptance Criteria

- the decan-info list shows `created_on`
- `created_on` renders in a readable datetime format
- existing list search and edit navigation continue to work

## Verification Test Plan

1. Open `/admin/astrology/decan-info`.
2. Confirm each row shows `created_on`.
3. Verify the displayed datetime is readable and consistent with the admin list style.
4. Search by sign or daemon and confirm the list still behaves correctly.
5. Navigate to edit from a row and confirm list changes did not break row actions.
