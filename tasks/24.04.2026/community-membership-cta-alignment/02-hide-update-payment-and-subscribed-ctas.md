# Task 02 - Hide Update Payment And Subscribed CTAs

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Membership Card / Frontend
- Page Route: `/community`

---

## Goal

Remove the visible `Update Payment` and `Subscribed` buttons from the PM `Your Membership` card.

## Important Rule

Do not hard-delete these button blocks.

Comment out the rendered CTA blocks inside the membership card component so:

- the UI no longer shows them
- the old implementation remains in source control in an easy-to-restore form

## Implementation Notes

Target file:

- `src/components/community/membership-card.tsx`

Expected approach:

- comment out the `Update Payment` button render block
- comment out the conditional `Subscribed` button render block
- add a short inline comment noting this is a client-requested hide, not dead code removal

Do not:

- remove the imported modal components unless they become fully unused as part of the same scoped cleanup decision
- delete the modal files in this task
- change backend endpoints in this task

## Acceptance Criteria

- [ ] `Update Payment` is no longer visible in the PM membership card
- [ ] `Subscribed` is no longer visible in the PM membership card
- [ ] The removed render blocks are preserved as commented code
- [ ] The rest of the membership card layout remains intact
