# Task 04 - Deeplink Incomplete Member CTA To Edit Context

- Status: Planned
- Priority: P1
- Area: Perennial / Community Family / Edit UX
- Dashboard Route: `/community`
- Family Route: `/community/family`
- Primary Files:
  - `src/app/community/page.tsx`
  - `src/app/community/family/page.tsx`

---

## Objective

Make the `Complete Profile ->` CTA for incomplete family-member cards take the user directly into the edit context for that exact member.

## Problem

A generic link to `/community/family` is weaker UX because the user still has to locate and open the correct member manually.

## Recommended Approach

Use a lightweight frontend deeplink such as:

- `/community/family?edit=<memberId>`

Then have `/community/family` open the matching member's edit state automatically.

## Acceptable Alternative

If query-param driven auto-open is too much for this pass, implement a smaller version that:

- navigates to `/community/family`
- expands the correct member row automatically

## Constraints

- Keep this frontend-scoped if possible
- Do not change family-member data contracts
- Do not introduce a new backend endpoint for this task

## Acceptance Criteria

- [ ] Clicking `Complete Profile ->` from an incomplete dashboard card lands the user in the correct member edit context
- [ ] The user does not need to manually search for the member after navigation
- [ ] Existing `/community/family` add/edit/remove flows remain intact

