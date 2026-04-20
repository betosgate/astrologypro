# Master Task - Community Plan Management Fixes - 2026-04-16

- Status: Planned
- Priority: P0 (Critical for revenue and UX)
- Owner: Full-stack
- Scope: Price calculator NaN bug, Plan persistence in UI, Stripe Checkout redirect for new subscriptions.
- Task File: `tasks/16.04.2026/plan-management-fixes/00-master-task.md`

---

## Technical Context

The Community Plan page (`/community/plan`) allows members to view their current plan, calculate costs for adding members, and switch between tiers (e.g., Individual to Family). 

During QA, three critical failures were identified:
1. **API Mismatch**: The price preview API returns a nested `breakdown` object, while the frontend expects flat values (resulting in `NaN`).
2. **Hardcoded Defaults**: The plan retrieval API defaults to the "Individual" tier regardless of what is saved in the database.
3. **No Checkout**: Upgrading a plan for a member without an existing Stripe subscription triggers a database update but fails to collect payment.

## Goal

Align the frontend and backend pricing models, ensure plan changes persist correctly in the UI, and guarantee that all plan upgrades translate into valid Stripe payments or checkouts.

## Sub-Tasks

| # | File | What to do | Status |
|---|---|---|---|
| 01 | `01-fix-pricing-calculator-nan.md` | Align `/api/community/plan/preview` response structure with frontend types | Planned |
| 02 | `02-fix-sticky-plan-tier-ui.md` | Update `/api/community/plan` to respect `pm_tier_id` from the database | Planned |
| 03.1| `03.1-backend-detect-missing-subscription.md` | Detect missing Stripe subscription in `change-tier` API | Planned |
| 03.2| `03.2-frontend-handle-checkout-redirect.md` | Handle checkout redirection in the Plan page UI | Planned |
| 04 | `04-end-to-end-qa-checklist.md` | Final verification of pricing logic and payment workflows | Planned |

## Implementation Notes

- **Consistency**: Use the naming convention found in `src/app/api/community/plan/route.ts` (mapping DB column names to camelCase or frontend-friendly keys).
- **Safety**: Do not update `pm_tier_id` in the database until payment is confirmed (via Stripe Checkout) if a new subscription is being created.
- **UI**: Ensure the loading states in the calculator correctly handle the new flat response structure.

## Acceptance Criteria

- [ ] Price Calculator shows valid USD amounts for all member counts.
- [ ] Swapping tasks from Individual to Family results in the page showing "Family" correctly after refresh.
- [ ] Selecting a plan when no subscription exists redirects to the Stripe Checkout page.
- [ ] Selecting a plan when a subscription exists handles proration correctly and stays on page.
