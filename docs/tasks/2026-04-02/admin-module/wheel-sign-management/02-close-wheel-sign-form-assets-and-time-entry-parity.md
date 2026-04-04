# 02 Close Wheel Sign Form Assets And Time Entry Parity

## Why

Angular’s wheel-sign form includes one more upload surface than the current Next form and uses a more structured date-and-time entry flow. The current Next form is missing the `assets` field and still treats time as free text.

## Current Verified Gap

- Angular form includes uploads for:
  - `theme_image`
  - `icon_image`
  - `assets`
- Next form currently includes:
  - `theme_image`
  - `icon_image`
- Next form currently does not include `assets`
- Angular uses structured date and time entry for start and end values
- Next form currently uses text fields for `start_time` and `end_time`

## Required Behavior

- Add the missing `assets` upload to the Next form
- Improve time entry so admins can enter or adjust start and end times reliably
- Preserve the current add and edit route structure

## Acceptance Criteria

- add and edit both support `assets` upload
- start and end times can be entered with a reliable admin workflow
- existing theme and icon image workflows continue to work

## Verification Test Plan

1. Open `/admin/astrology/wheel-signs/add`.
2. Fill the title, date, time, and priority fields.
3. Upload theme image, icon image, and assets.
4. Submit the record and confirm the save succeeds.
5. Open the saved record in edit mode and confirm the uploaded values and time fields remain usable.
