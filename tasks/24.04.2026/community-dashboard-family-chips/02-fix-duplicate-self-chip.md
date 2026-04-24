# Task 02 - Fix Duplicate Self Chip

- Status: Planned
- Priority: P1
- Area: Perennial / Community Dashboard / Top Summary UX
- Page Route: `/community`

---

## Objective

Ensure the primary member appears exactly once in the top family-member chip row.

## Problem

The dashboard can currently render `River Ashton` twice:

- once as the intended primary `Self` chip
- once again through household/family aggregation

## Required Change

Apply a small, explicit deduplication rule so the primary member is rendered only once.

## Constraints

- Do not remove actual family members
- Do not rely on display-name matching alone if a more stable identifier is available
- Keep the primary member chip present

## Acceptance Criteria

- [ ] `Self` appears exactly once
- [ ] Other household chips remain intact
- [ ] The fix is stable even when names overlap

