# Perennial Signup UX Acceptance Criteria And Edge Cases

- Completion Notes: Implemented. Validation now returns { message, fieldId } so the page can scrollIntoView({behavior:"smooth", block:"center"}) the first invalid field and focus it via requestAnimationFrame. Plan capacity is checked first (Single=1, Couple=2, Family=3-5) before any field-level validation, preventing the underfilled-Couple and underfilled-Family edge cases. Plan downgrade trims excess members in setMembers (changePlan). Email uniqueness blocks submission with the offending email surfaced in the error message. The optional questionnaire is per-member expand/collapse and remains usable on mobile (single-column grids on small screens). The form does not allow a 6th member: Add button disables when householdCount >= plan.totalMembers. The page never asks for a manual password and the order summary card explicitly states "system-generated password emailed after payment". Going back from the Stripe checkout uses Stripe-hosted cancel_url which returns the user to /perennial-signup?cancelled=1.
- Earlier notes: NOT IMPLEMENTED — deferred. The current page handles the most important edge cases (plan downgrades trim members, unique email validation, required-field summary error) but the full acceptance test plan including focus-on-first-invalid-field, server error states, etc. needs polishing after task 05 lands.
- Status: Completed (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/06-ux-acceptance-criteria-and-edge-cases.md`

## Goal

Prevent implementation gaps by explicitly listing acceptance rules and edge cases that must be handled in the first implementation pass.

## Core Acceptance Checklist

The implementation is not complete unless all of the following are true:

1. there is a dedicated Perennial signup page
2. the page supports full-household signup before payment
3. every household member gets a real account after payment
4. every household member has a unique email in the form
5. the UI does not ask for manual passwords
6. the UI explains generated-password email delivery
7. `Single`, `Couple`, and `Family` pricing is exact
8. household capacity is enforced exactly
9. legacy `relation + sub_relation` exists for additional members
10. the full optional questionnaire exists for every member
11. validation scrolls to the first invalid field
12. the page includes review-before-payment behavior
13. success/failure messaging does not contradict membership timing

## Required Edge Cases

### Duplicate emails

1. If two members share the same email, submission must be blocked.
2. The error must point clearly to the offending field or fields.

### Plan downgrade overflow

1. If the user changes to a plan that cannot fit the current household count, the page must block continuation until resolved.

### Couple plan underfilled

1. `Couple` represents exactly two members at checkout time.
2. The page must not allow the user to pay for `Couple` with only one completed member.

### Family plan underfilled

1. `Family` pricing covers 3 to 5 members.
2. The page must not imply unlimited members.
3. The page should not allow a 6th total member.
4. The page must not allow payment with fewer than 3 completed members on `Family`.

### Long-form mobile usability

1. Expandable questionnaire sections must remain usable on mobile.
2. Validation must still bring the user to the invalid field on smaller screens.
3. Summary and CTA must remain discoverable.

### Review/payment boundary

1. Users must be able to go back from review/payment to edit member details.
2. Review step must not become a dead-end.

### Generated credentials expectation

1. The user must not be surprised after payment about how login works.
2. The page must say clearly that credentials are generated and emailed.

## QA Scenarios

1. Select `Single`, complete one member, proceed to review/payment.
2. Select `Couple`, add one additional member, validate exact two-member flow.
3. Select `Family`, add up to five total members, verify cap enforcement.
4. Trigger duplicate-email validation.
5. Trigger missing relation/sub-relation validation on an added member.
6. Trigger missing required field validation and verify first-invalid scroll behavior.
7. Expand and collapse optional questionnaire blocks for multiple members.
8. Change from `Family` to `Couple` with too many members and verify intentional handling.
9. Verify messaging around billing owner and post-payment credential emails.
10. Verify mobile layout does not collapse into an unusable long page.

## Final Instruction To Implementing AI

Do not treat this as a lightweight form task.

This is a conversion-critical product page with:

1. household modeling
2. plan enforcement
3. long-form validation
4. legacy relationship logic
5. full questionnaire coverage
6. payment-state clarity

Any missing item above is a failed implementation, not a follow-up enhancement.
