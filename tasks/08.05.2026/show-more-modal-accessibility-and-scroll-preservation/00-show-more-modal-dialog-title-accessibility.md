# Task - Show More Modal Dialog Title Accessibility - 2026-05-08

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: Horoscope toolkit modal accessibility
- Routes: `/community/charts/detailed`, `/admin/horoscope`
- Task File: `tasks/08.05.2026/show-more-modal-accessibility-and-scroll-preservation/00-show-more-modal-dialog-title-accessibility.md`

## Objective

Resolve the Radix Dialog accessibility warning for the Show More modal by ensuring every `DialogContent` has a valid `DialogTitle`.

## Current Problem

Opening the Show More modal can emit this console warning:

```txt
DialogContent requires a DialogTitle for the component to be accessible for screen reader users.
```

The modal has a visible heading, but it is rendered as a plain HTML heading instead of the Radix-compatible `DialogTitle` component.

## Required Outcome

1. Show More modal should include `DialogTitle` inside `DialogContent`.
2. Existing visual heading design should remain unchanged.
3. The modal should remain accessible for screen reader users.
4. The console warning should no longer appear when Show More is opened.

## Implementation Notes

- Review `src/app/admin/horoscope/components/show-more-modal.tsx`.
- Replace the visible heading element with `DialogTitle`, or add a visually hidden title if the design requires the heading to stay separate.
- Remove unused dialog imports.
- Keep modal layout and loading states unchanged.

## Acceptance Criteria

- [ ] Opening Show More does not trigger the Radix missing-title warning.
- [ ] Modal heading still displays as `Deep Astrological Analysis`.
- [ ] Close button and overlay close behavior still work.
- [ ] No visual regression in modal spacing or typography.
- [ ] Targeted lint passes.

## Verification Gate

1. Open `/community/charts/detailed` with a report that contains Show More buttons.
2. Click Show More.
3. Confirm no DialogTitle console warning appears.
4. Close the modal by close button and outside click.
5. Run targeted lint on the modal file.
