# Perennial Signup Task Folder

This folder is the source of truth for implementing the new Perennial Mandalism signup page.

If older Perennial notes elsewhere in the repo conflict with this folder, follow this folder.

## Read In This Order

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
11. `99-implementation-checklist.md`

## Key Rules

1. This is a multi-user household signup flow.
2. Every member gets a real account after successful payment.
3. Every member must have a unique email.
4. Do not render password fields in the signup form.
5. Passwords are generated automatically and emailed after payment.
6. Generated passwords must meet a strong internal password rule.
7. Use current project field names for common fields.
8. Preserve old Perennial UI copy/tone where it does not conflict with the new model.
9. Keep old `relation + sub_relation` behavior for additional members.
10. Keep the full optional questionnaire for every member.
11. Membership activates only after successful payment.
12. Use the current AstrologyPro theme and shared design system when implementing the page.
13. Use the dedicated Perennial payment-flow contract; do not invent checkout lifecycle behavior.
14. A dedicated Stripe env var is required for the `Couple` plan and is not currently present in `.env.local`.

## Final Reminder

Do not implement this from memory or from scattered old notes.

Read the full task set first, then implement.
