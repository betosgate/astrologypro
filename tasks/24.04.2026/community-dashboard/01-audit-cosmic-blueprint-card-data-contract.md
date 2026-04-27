# Task 01 - Audit Cosmic Blueprint Card Data Contract

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Audit
- Page Route: `/community`
- Primary File: `src/app/community/page.tsx`

---

## Objective

Confirm which entity the "Discover your cosmic blueprint" card is supposed to represent and which data source it currently uses.

## Current Understanding To Verify

The card is about the logged-in PM member's own natal readiness.

That means the relevant entity should be:

- `community_members`

Not:

- `community_family_members` for added members
- `clients` for client-domain sync state

## Audit Targets

1. Find where the card computes `ownChartMissingFields`
2. Confirm which table is queried for those values
3. Confirm which table `/community/profile` reads
4. Confirm which route persists PM profile birth data
5. Record whether any existing comment or helper already identifies `community_members` as canonical for dashboard birth-data checks

## Expected Finding

The dashboard card is currently reading:

- `clients.birth_date`
- `clients.birth_time`
- `clients.birth_city`

while the PM profile flow reads/writes:

- `community_members.date_of_birth`
- `community_members.birth_time`
- `community_members.birth_city`

## Deliverable

A short audit note in the task implementation PR description or handoff comment that states:

- which source is currently used
- which source should be used
- why this is a PM-member-vs-client-domain mismatch, not a family-member issue

## Acceptance Criteria

- [ ] The current cosmic blueprint card read path is identified
- [ ] The PM profile read/write path is identified
- [ ] The entity distinction is documented clearly enough that implementation does not re-open the design question

