# Task 01 - Audit Family Chip Data Source And Deduplication

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Audit
- Page Route: `/community`

---

## Objective

Identify how the top summary chip list is currently assembled and confirm why the primary member appears twice.

## What To Verify

1. Where the primary PM member chip is created
2. Where family-member chips are created
3. Whether the primary member is being added both:
   - explicitly as `Self`
   - and again via aggregated household/member data
4. What fields are available for relationship sorting and display

## Deliverable

A short handoff note in the PR or implementation summary that states:

- the source of the duplicate `Self`
- the exact list source for chips
- the safest deduplication rule

## Acceptance Criteria

- [ ] The duplicate source is identified
- [ ] A clear deduplication rule is documented
- [ ] Tasks 02-06 can proceed without reopening the data question

