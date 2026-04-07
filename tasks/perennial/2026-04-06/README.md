# Perennial Requirement Gap Task Index - 2026-04-06

- Module: Perennial / Community Membership
- Current Route Base:
  - `/community`
- Status: Planned
- Analysis Type: Requirement-to-current implementation gap review
- Folder Path: `docs/tasks/perennial/2026-04-06`

## Scope Of This Review

This folder contains the validated Perennial tasks derived from the shared requirement document, limited to the Perennial / community membership area and only for items that are not yet fully implemented in the current project.

## Verified Current Comparison Summary

### Already Implemented In Current Project

- protected community membership access
- community dashboard
- family member CRUD basics
- natal chart generation
- relationship charts
- monthly transits page
- rituals create/list/detail
- resources and library pages
- Sunday Service member page
- checkout start flow for community / upgrade

### Still Open From The Requirement Doc

- membership welcome and enrollment confirmation emails
- monthly transit ready email
- Sunday Service new episode email
- admin interface for email sequence visibility and control
- full community subscription lifecycle parity:
  - cancel at end of billing period
  - individual to family upgrade
  - family to individual downgrade
- member cross-sell discount token flow to AstrologyPro checkout
- admin CMS for holy books
- DB-backed doctrine link management
- Sunday Service admin publishing workflow and book filter/detail parity

## Recommended Execution Order

1. `01-membership-welcome-and-enrollment-emails.md`
2. `02-monthly-transit-ready-email.md`
3. `03-community-subscription-lifecycle-management.md`
4. `04-community-email-sequence-overview-and-controls.md`
5. `05-community-email-history-and-template-preview.md`
6. `06-member-discount-token-issuance-and-validation.md`
7. `07-member-discount-application-at-booking.md`
8. `08-holy-books-admin-management.md`
9. `09-doctrine-links-admin-management.md`
10. `10-sunday-service-admin-publishing.md`
11. `11-sunday-service-member-filter-detail-and-notification.md`
12. `12-dashboard-membership-and-summary-parity.md`
13. `13-dashboard-chart-and-family-summary-parity.md`
14. 14-dashboard-content-and-quick-actions-parity.md`r`n15. `15-dashboard-visual-hierarchy-and-member-journey.md`

## Umbrella Task Files

These broader files are still useful as grouped references, but the smaller task files above are the preferred execution plan.

- `01-community-membership-lifecycle-and-emails.md`
- `02-community-email-sequences-admin-interface.md`
- `03-member-cross-sell-discount-token-flow.md`
- `04-holy-books-admin-cms.md`
- `05-doctrine-links-admin-cms.md`
- `06-sunday-service-admin-and-notification-parity.md`

## Source Files Reviewed

### Current Next Implementation

- `src/app/community/layout.tsx`
- `src/app/community/page.tsx`
- `src/app/community/transits/page.tsx`
- `src/app/community/library/page.tsx`
- `src/app/community/sunday-service/page.tsx`
- `src/app/community/upgrade/page.tsx`
- `src/app/api/community/checkout/route.ts`
- `src/app/api/community/family/route.ts`
- `src/app/api/community/family/[id]/route.ts`
- `src/app/api/community/sunday-service/route.ts`
- `src/app/api/cron/monthly-transits/route.ts`

## Notes

- This task set is requirement-driven, not legacy Angular parity-driven.
- Only Perennial / community items from the requirement document are included here.
- Shared platform modules such as affiliate management, certification badge system, training PDFs, and social advocacy are intentionally excluded from this folder.

