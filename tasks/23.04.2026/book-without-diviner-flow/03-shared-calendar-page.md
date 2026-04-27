# 03 Shared Calendar Page

## Goal

Build the shared booking page UI using the existing diviner booking/calendar structure as the visual and interaction baseline.

## Requirements

- the page must feel aligned with the existing diviner booking page, not like a demo page
- the first decisive action should be selecting a date
- the page should clearly communicate that the system will help match an available diviner

## UI Sections

At minimum:
- page header with template/service context
- short submission context summary
- calendar / date picker section
- availability state / loading / empty states
- diviner selection section that appears only when needed

## Constraints

- do not rebuild a totally different booking aesthetic
- reuse existing booking primitives if possible
- keep the flow simple:
  - choose date
  - resolve diviner
  - continue

## Calendar Behavior

Claude must first determine whether the existing booking calendar/date-selection logic can be reused directly.

If not, Claude may build a shared wrapper, but it should remain visually aligned with:
- `BookingWizard`
- existing public booking/availability UI

## Acceptance Criteria

- page is not a placeholder
- page matches the product direction of the current booking experience
- the user can clearly choose a date before any forced diviner choice

