# Perennial Signup Frontend Master Task

- Status: Ready For Implementation
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/00-master-task.md`

## Purpose

Build the canonical Perennial Mandalism signup page as a full household signup and checkout flow that matches the confirmed product requirements from stakeholder clarification on 2026-04-08.

This folder is the source of truth for the Perennial signup frontend implementation. If older task files or old-project notes conflict with this folder, this folder wins.

## Scope

This task set is for the Perennial signup frontend page and its immediate frontend integration requirements.

The implementation must cover:

1. page shell and route
2. primary member + additional household member multi-step UI
3. complete required-field validation
4. old relation + sub-relation behavior
5. full optional questionnaire for every member
6. capacity-based plan selection and pricing summary
7. pre-payment review flow
8. payment step handoff
9. success/error/loading UX
10. Stripe lifecycle clarity for pending signup, success, cancel, and finalization

The implementation must not leave major business logic ambiguous for the implementing AI.

## Final Confirmed Product Decisions

These decisions are already confirmed and must be treated as non-negotiable unless a newer explicit stakeholder instruction overrides them.

1. Perennial signup is a multi-user household signup flow.
2. Every household member gets a real account.
3. Every household member must have a unique email address.
4. Passwords are not entered manually in the form.
5. Passwords are system-generated after successful payment and emailed automatically.
6. System-generated passwords must satisfy a strong internal password policy.
7. Accounts are created only after successful Stripe payment.
8. After payment succeeds, all member accounts are created immediately as active.
9. Only the main household purchaser manages billing.
10. Non-billing members still receive full Perennial content access.
11. Relationship handling must use the legacy `relation + sub_relation` behavior.
12. The full old optional questionnaire remains for every member.
13. The signup remains a full household signup flow before payment.
14. Family plan limit is exactly 5 total members including the main user.

## Generated Password Policy

Although the signup form does not ask users to create passwords manually, automatically generated passwords must still meet a strong platform rule.

Required generated-password standard:

1. minimum length: `12`
2. at least one uppercase letter
3. at least one lowercase letter
4. at least one number
5. at least one special character
6. avoid weak or trivial generated values

Recommended validation pattern for generated-password compliance:

```txt
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/
```

## Critical Clarification From Earlier Notes

Some older notes in the repo or prior chat context conflict with the final confirmed product direction. Resolve them like this:

1. Older "new model" notes that only the main PM member gets login access are no longer valid for this signup feature.
2. Older requirements that asked for password and confirm-password inputs are superseded by the final decision that passwords are system-generated and emailed automatically.
3. Generic "tier" language should not be used unless mapped directly to these Perennial household plans:
   - `Single` = 1 total member
   - `Couple` = 2 total members
   - `Family` = 3 to 5 total members
4. The UI must not imply unlimited family members.

## Core User Journey

1. Visitor opens the Perennial signup page.
2. Visitor chooses a Perennial household plan:
   - `Single`
   - `Couple`
   - `Family`
3. The page initializes with one primary member form.
4. Depending on plan, the visitor may add household members up to the allowed limit.
5. Each member form collects required profile, contact, and astrology data.
6. Each member may optionally expand the full questionnaire section.
7. Validation runs across all member forms.
8. If invalid, the page shows a global message and scrolls/focuses the first invalid field.
9. If valid, the page moves to a clear review/payment stage.
10. Payment is completed successfully.
11. Only after payment succeeds, the system provisions all accounts as active and emails generated credentials to each member.

## Pricing Model

The frontend must represent pricing as household plans, not ambiguous backend tiers.

- `Single` = exactly 1 total member = `$19.95/month`
- `Couple` = exactly 2 total members = `$29.95/month`
- `Family` = 3 to 5 total members = `$39.95/month`

Plan rules:

1. `Single` must allow only the primary member.
2. `Couple` must allow exactly one additional member.
3. `Family` must allow up to 4 additional members, for 5 total including the main member.
4. The page must prevent adding members beyond the selected plan limit.
5. The page must clearly show current household count vs allowed count.

## Stripe Price Configuration Requirement

The current local env already contains:

1. `STRIPE_PRICE_COMMUNITY_INDIVIDUAL`
2. `STRIPE_PRICE_COMMUNITY_FAMILY`

For the confirmed Perennial `Single / Couple / Family` model, one more dedicated Stripe price env var is required:

1. `STRIPE_PRICE_COMMUNITY_COUPLE`

Current status:

1. `Single` price env exists
2. `Family` price env exists
3. `Couple` price env is missing and must be created/configured manually later

The implementing AI must not assume the `Couple` plan can be fully wired without that env var and corresponding Stripe price.

## Route And UX Direction

Use a dedicated Perennial signup page, not a tiny dialog or a generic join screen.

The page should feel like a premium long-form guided signup:

1. clear plan selection
2. clear primary member section
3. clear household member section
4. optional questionnaire blocks
5. sticky or persistent pricing/payment summary
6. visible progress state
7. mobile-safe layout

## Theme And Design-System Rule

The new Perennial signup page must use the current AstrologyPro site's existing visual theme and component system.

That means:

1. reuse the current project's design tokens, component primitives, spacing rhythm, and typography patterns
2. make the page feel native to the existing app and marketing site
3. do not implement it as a disconnected microsite or an unrelated visual redesign
4. prefer existing shared UI components and established layout conventions wherever possible
5. only introduce Perennial-specific composition or section styling where needed for the signup journey, while still staying visually consistent with the current site

## Execution Order

1. `01-page-shell-and-route.md`
2. `02-plan-selection-household-rules-and-pricing.md`
3. `03-member-form-fields-validation-and-legacy-rules.md`
4. `04-additional-members-household-management.md`
5. `05-review-payment-and-post-payment-contract.md`
6. `06-ux-acceptance-criteria-and-edge-cases.md`
7. `07-ui-copy-parity-and-adaptation.md`
8. `08-field-mapping-and-payload-normalization.md`
9. `09-payment-flow-contract-and-stripe-lifecycle.md`

## Non-Negotiable Implementation Constraints

1. Do not implement this as a primary-user-only signup.
2. Do not ask the user to manually type passwords for any member.
3. Do not use the current PM self-service family-member model as the UX reference for this page.
4. Do not activate membership before successful payment.
5. Do not allow more than the selected plan capacity.
6. Do not omit relation/sub-relation logic for added members.
7. Do not remove the optional questionnaire from extra members.
8. Do not leave first-invalid-field handling unspecified.
9. Do not leave email uniqueness requirements implicit.
10. Do not build the page as a small modal or embedded subform.
11. Do not introduce a visual theme that clashes with the current AstrologyPro site.

## Expected Outcome

After implementation:

1. the repo has one clear Perennial signup frontend flow with explicit business rules
2. the UI matches the confirmed household-account product model
3. the implementing AI should not need follow-up clarification to finish the frontend in one pass
4. no corrective "fix tomorrow" task should be required for missing core requirements
