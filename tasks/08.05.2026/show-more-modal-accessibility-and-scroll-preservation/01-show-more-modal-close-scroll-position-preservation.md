# Task - Show More Modal Close Scroll Position Preservation - 2026-05-08

- Status: Planned
- Priority: P1
- Owner: Frontend
- Scope: Horoscope toolkit modal close behavior, relationship chart report UX
- Routes: `/community/charts/detailed`, `/admin/horoscope`
- Task File: `tasks/08.05.2026/show-more-modal-accessibility-and-scroll-preservation/01-show-more-modal-close-scroll-position-preservation.md`

## Objective

Prevent the detailed horoscope/report page from jumping upward after the Show More modal is closed.

## Current Problem

When a user opens Show More from a deep report section and then closes the modal, the page can scroll upward automatically. This is confusing because the page already has a dedicated Scroll to Top button, and modal close should return the user to the same report section.

## Suspected Failure Points

- `src/app/admin/horoscope/components/show-more-modal.tsx`
  - Modal close/unmount can interact with browser focus restoration, scroll anchoring, or container layout.

- `src/app/admin/horoscope/page.tsx`
  - The report page scrolls inside `.result-scroll-container`, not `window`.
  - Any modal behavior that changes this container or restores focus may affect scroll position.

## Required Outcome

1. Capture the active `.result-scroll-container` scroll position before opening Show More.
2. Closing the modal should preserve the exact report position where Show More was opened.
3. The fix should work for close button, outside click, and escape-key close.
4. The dedicated Scroll to Top button should remain the only intentional way to jump to top.

## Implementation Notes

- Preserve scroll state at Show More trigger time, not only during modal cleanup.
- Restore scroll position after modal state changes settle.
- Avoid changing generated report content, API payloads, or relationship report routing.
- Verify against pages where the browser window is not the active scroll container.

## Acceptance Criteria

- [ ] Open Show More from a deep report card and close it; the same card remains in view.
- [ ] Close button, outside click, and escape-key close behave consistently.
- [ ] Scroll to Top button still scrolls the report container to the top.
- [ ] Modal body remains independently scrollable when content is long.
- [ ] Targeted lint passes.

## Verification Gate

1. Open `/community/charts/detailed` with a long business relationship report.
2. Scroll to a mid-page or lower Show More button.
3. Open the modal.
4. Close by X button and confirm the page position is preserved.
5. Repeat with outside click and Escape.
6. Run targeted lint on the modal file.
