# Perennial Signup Implementation Checklist

- Completion Notes: Tracks progress against the master task. Tasks 01-04 are partially shipped; tasks 05-09 are deferred pending Stripe configuration.
- Status: Partial (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/99-implementation-checklist.md`

## Purpose

This file converts the Perennial signup task set into a strict implementation sequence so an AI coding agent can execute the feature in one run with minimal ambiguity.

Read this file after reading:

1. `00-master-task.md`
2. `01-page-shell-and-route.md`
3. `02-plan-selection-household-rules-and-pricing.md`
4. `03-member-form-fields-validation-and-legacy-rules.md`
5. `04-additional-members-household-management.md`
6. `05-review-payment-and-post-payment-contract.md`
7. `06-ux-acceptance-criteria-and-edge-cases.md`
8. `07-ui-copy-parity-and-adaptation.md`
9. `08-field-mapping-and-payload-normalization.md`
10. `09-payment-flow-contract-and-stripe-lifecycle.md`

## Non-Negotiable Summary

Before coding, lock these rules:

1. This is a multi-user household signup flow.
2. Every member gets a real account after successful payment.
3. Every member must have a unique email.
4. Do not render password or confirm-password inputs.
5. Generated passwords are emailed automatically after successful payment.
6. Generated passwords must satisfy the internal strength rule.
7. Membership becomes active only after successful Stripe payment.
8. `Single`, `Couple`, `Family` pricing is fixed and exact.
9. `relation + sub_relation` is required for additional members.
10. The full optional questionnaire remains for every member.
11. Only the primary member manages billing.
12. Non-billing members still receive full PM access after activation.
13. `Single` requires exactly 1 completed member.
14. `Couple` requires exactly 2 completed members.
15. `Family` requires 3 to 5 completed members.
16. The page must use the current AstrologyPro theme and shared design-system patterns.
17. The Perennial payment lifecycle must follow the dedicated payment-flow contract rather than ad-hoc checkout logic.
18. `STRIPE_PRICE_COMMUNITY_COUPLE` is required for full `Couple` checkout support and is currently missing from `.env.local`.

## Recommended Build Order

### Step 1: Inspect current code before editing

1. Find the current community/join/signup routes and components.
2. Find any existing PM add-member or plan-selection UI that might be reused safely.
3. Read the current Next.js docs under `node_modules/next/dist/docs/` if the route/component conventions are relevant.
4. Avoid assuming old Next.js patterns are valid in this repo.

### Step 2: Create the dedicated route and top-level page

1. Add the new Perennial signup page route.
2. Make the page full-screen and product-facing.
3. Do not build it as a modal, drawer, or tiny embedded form.
4. Keep the implementation visually aligned with the current AstrologyPro theme and shared UI components.
5. Add strong section scaffolding:
   - page intro
   - plan selection
   - household forms
   - summary
   - review/payment CTA

### Step 3: Define frontend data structures

1. Define the member form shape for:
   - primary member
   - additional members
2. Use current project field names for common fields in the state shape.
3. Include all required profile/contact/birth fields.
4. Include legacy `relation + sub_relation` behavior for added members, using `relation_type` and `sub_relation` as the canonical state/payload names.
5. Include the full optional questionnaire shape for every member.
6. Include plan state and household-capacity state.
7. Include validation error state per member and per field.

### Step 4: Implement plan selection and capacity logic

1. Add plan UI for:
   - `Single`
   - `Couple`
   - `Family`
2. Hardcode exact monthly prices:
   - `$19.95`
   - `$29.95`
   - `$39.95`
3. Hardcode capacity limits:
   - `Single` = 1 total member
   - `Couple` = 2 total members
   - `Family` = up to 5 total members
4. Prevent invalid add-member actions based on selected plan.
5. Keep visible household count synchronized with selected plan.

### Step 5: Implement member form UI

1. Render the primary member section first.
2. Render additional member sections below it.
3. Make it obvious which member is the billing owner.
4. Include all required fields.
5. Include full optional questionnaire expand/collapse for every member.
6. Do not include password fields anywhere in the UI.
7. Add copy that credentials will be generated and emailed after payment.

### Step 6: Implement legacy relationship behavior

1. Require `relation` for every added member.
2. Require `sub_relation` after `relation` is chosen.
3. Restrict options exactly as defined in the task docs.
4. Do not require these fields for the primary member.

### Step 7: Implement validation thoroughly

1. Validate required fields for every member.
2. Validate email format.
3. Validate duplicate emails across the whole household.
4. Validate phone format according to legacy formatting behavior.
5. Validate ZIP as exactly 5 digits.
6. Validate required birth data.
7. Validate `relation_type` / `sub_relation` rules for added members.
8. Surface clear error text.
9. On failure, scroll and focus the first invalid field.

### Step 8: Implement add/remove member behavior

1. Start with one primary member by default.
2. Allow adding members only within plan capacity.
3. Allow removing only non-primary members.
4. Remove or reindex associated errors cleanly.
5. Handle plan downgrades with overflow intentionally.
6. Do not silently discard entered member data.

### Step 9: Build the summary and review state

1. Show selected plan.
2. Show monthly amount.
3. Show current household count.
4. Show primary billing owner.
5. Show all member names and emails for review.
6. Show generated-credentials messaging.
7. Allow returning to edit mode before payment.

### Step 10: Prepare payment-stage UI contract

1. Make the page communicate that activation happens only after payment success.
2. Make the page communicate that all accounts are created only after payment success.
3. Distinguish payment pending vs membership active states clearly.
4. Add loading, error, retry, and success affordances.
5. Do not imply active membership before success.
6. Treat generated credentials as subject to a strong backend password policy even though the form does not collect passwords.

### Step 10A: Implement the Stripe lifecycle intentionally

1. Use the dedicated Perennial payment-flow contract.
2. Ensure payment init is tied to a durable pending-signup payload.
3. Use Perennial-specific success and cancel return routes.
4. Do not rely on client-only state after Stripe redirect.
5. Treat verified backend payment confirmation as the source of truth for activation and account creation.
6. Explicitly account for the missing `STRIPE_PRICE_COMMUNITY_COUPLE` env dependency.

### Step 11: Polish mobile and responsive behavior

1. Verify long forms remain usable on mobile.
2. Verify questionnaire sections do not become impossible to manage.
3. Keep summary/CTA visible enough to support conversion.
4. Ensure validation scroll behavior still works on mobile layouts.

## Required Copy Concepts

The final UI should explicitly communicate all of these ideas somewhere appropriate:

1. the primary member is the billing owner
2. additional members get their own accounts
3. each member must use a unique email
4. credentials are generated automatically
5. credentials are emailed after successful payment
6. membership activates after successful payment

## Verification Checklist

The implementing AI must verify these scenarios before considering the task complete:

1. `Single` plan supports only one member.
2. `Couple` plan supports exactly two members total.
3. `Family` plan supports up to five members total.
4. `Family` plan does not proceed with fewer than three completed members.
5. Add-member button stops at the correct limit.
6. Duplicate-email validation blocks progression.
7. Missing required field validation blocks progression.
8. Missing `relation_type` / `sub_relation` on added members blocks progression.
9. First invalid field is scrolled into view and focused.
10. Optional questionnaire is present for primary and additional members.
11. Password fields are absent from the UI.
12. Generated-password email messaging is present.
13. Review state correctly reflects member list and plan.
14. Payment copy does not imply premature activation.
15. Mobile layout remains usable.

## Definition Of Done

The task is done only if:

1. the dedicated Perennial signup page is implemented
2. all major business rules are represented in the UI
3. the flow is coherent from plan selection through review/payment
4. no core requirement from the task set is left as a "follow-up"
5. the feature can be implemented by an AI in one run without needing clarification on the product model
6. the final page looks like a native AstrologyPro page, not a disconnected redesign
7. the missing `STRIPE_PRICE_COMMUNITY_COUPLE` setup requirement is documented clearly for manual env configuration
