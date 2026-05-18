# Master - Community Post-Booking Polish Phase 3

- Status: Proposed
- Priority: P1
- Owner: Full Stack
- Area: Community / post-booking UX / session access
- Source: Follow-up after Community My Readings Phase 1 and auth handoff Phase 2
- Created: 2026-05-18

## Purpose

Polish the Community reading experience after the core post-booking flow is
working. Phase 1 gave Community users a My Readings page and details drawer.
Phase 2 made Community-origin bookings attach to the authenticated Community
user. Phase 3 should make the experience easier to find, clearer after
booking, and ready for production join-access rules.

The goal is not to add risky booking mutations yet. The goal is to make the
read-only booking journey feel complete and consistent.

## Task Breakdown

1. `01-community-dashboard-my-readings-entry.md`
   - Add a clear Community dashboard entry point for My Readings.
   - Surface upcoming reading count when available.
2. `02-community-booking-confirmation-copy.md`
   - Update booking confirmation copy for Community-origin bookings.
   - Tell users they can find the reading later in Community Sessions.
3. `03-discount-cta-visibility.md`
   - Make the 5% Community discount visible on reading CTAs and redirect areas.
   - Keep public booking behavior separate.
4. `04-join-window-rules.md`
   - Define and implement shared join-button availability rules.
   - Keep Join enabled for current QA until the rule is intentionally turned on.
5. `05-phase-3-qa.md`
   - Verify dashboard entry, confirmation copy, discount CTA visibility, and join-window behavior.

## Non-Goals

- No reschedule action in this phase.
- No cancel action in this phase.
- No migration or repair of old bookings.
- No new details drawer.
- No change to public guest booking ownership.
- No change to trainee behavior unless implementing shared join-window logic requires a controlled shared helper.

## Completion Gate

- Community users can easily reach My Readings from the Community dashboard.
- Community-origin booking confirmation tells users where to find the booking later.
- Community reading CTA areas clearly mention the 5% member discount.
- Join-button access behavior is documented and implemented behind a clear rule.
- Existing Details drawer and Join behavior still work for QA.
- Public booking flow remains separate from Community auth flow.
