# Master Task - Fix Cosmic Blueprint Card Member vs Client Birth Data Source

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Natal Chart Readiness
- Page Route: `/community`

---

## Goal

Fix the Perennial dashboard bug where the logged-in member's "Discover your cosmic blueprint" card can still say birth data is missing even when `/community/profile` shows the member's birth data as complete.

## Why This Happens

The dashboard card is checking the logged-in member's own chart readiness from `clients.birth_date`, `clients.birth_time`, and `clients.birth_city`.

But the PM profile flow reads and writes the logged-in member's data in `community_members.date_of_birth`, `community_members.birth_time`, and `community_members.birth_city`.

That means the dashboard can show a false incomplete state whenever:

- `community_members` is correct
- `clients` is stale, missing, or not yet synced

## Important Domain Distinction

Do not flatten these entities together:

- `community_members` = the authenticated primary PM member
- `community_family_members` = added household members
- `clients` = broader client-domain record used elsewhere in the platform

This task is only about the logged-in PM member's own natal-readiness card.

## Task Breakdown

1. `01-audit-cosmic-blueprint-card-data-contract.md`
   Confirm the current read path and document why `community_members` is the correct source for this card.

2. `02-switch-cosmic-blueprint-card-to-community-member-birth-fields.md`
   Implement the dashboard fix in `src/app/community/page.tsx`.

3. `03-regression-and-qa-checklist.md`
   Verify the member flow, partial-missing-field flow, and stale-`clients` flow.

## Out Of Scope

- Family-member chart logic
- Reworking the `clients` sync architecture
- Merging PM, family-member, and client-domain entities
- Changing `/community/profile` completion logic

## Acceptance Criteria

- [ ] The cosmic blueprint card no longer depends on `clients` for the logged-in PM member's birth-data readiness
- [ ] A PM member with complete `community_members` birth data sees the ready state on `/community`
- [ ] A PM member with one missing field sees that exact field named
- [ ] Household-member flows remain unchanged

