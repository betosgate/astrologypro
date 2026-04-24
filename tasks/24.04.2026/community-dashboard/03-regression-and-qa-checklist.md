# Task 03 - Regression And QA Checklist For Cosmic Blueprint Card Fix

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / QA
- Page Route: `/community`

---

## QA Goal

Prove that the cosmic blueprint card now reflects the logged-in PM member's actual profile data from `community_members`, regardless of whether `clients` is stale.

## Core Scenarios

### Scenario 1 - Complete PM Member Birth Data

- [ ] Log in as a PM member
- [ ] Confirm `/community/profile` has `date_of_birth`, `birth_time`, and `birth_city`
- [ ] Open `/community`
- [ ] Confirm the card does not show `Missing: date of birth, birth time, birth city`
- [ ] Confirm the card shows the ready state

### Scenario 2 - One Missing PM Field

- [ ] Clear only `birth_time` for a test PM member
- [ ] Open `/community`
- [ ] Confirm the card says `Missing: birth time`
- [ ] Confirm it does not mention other fields that are present

### Scenario 3 - Stale Or Missing `clients` Record

- [ ] Use a PM member whose `community_members` birth data is complete
- [ ] Make the linked `clients` birth data stale, empty, or absent in test data
- [ ] Open `/community`
- [ ] Confirm the card still behaves correctly from `community_members`

### Scenario 4 - Family-Member Regression Check

- [ ] Verify family-member sections still render normally
- [ ] Verify no new family-member gating or copy changes were introduced by this fix

## Extra Check

- [ ] Confirm the ready-state CTA still links to `/community/horoscope`
- [ ] Confirm the incomplete-state CTA still links to `/community/profile`

## Acceptance Criteria

- [ ] The bug is fixed for the primary PM member
- [ ] The behavior is no longer sensitive to stale `clients` birth data
- [ ] The change does not alter unrelated family-member flows
