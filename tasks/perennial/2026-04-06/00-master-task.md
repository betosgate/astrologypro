# Master Task - Perennial Requirement Gaps - 2026-04-06

- Module: Perennial / Community Membership
- Status: Planned
- Owner: Fullstack
- Folder Path: `docs/tasks/perennial/2026-04-06`
- Primary Next Route:
  - `/community`

## Objective

Close the remaining requirement gaps for the Perennial / community membership experience, focusing on subscription lifecycle, member emails, content administration, and cross-sell flow.

## Current Product Truth

- The current project already provides the core member-facing Perennial experience.
- The remaining verified requirement gaps are:
  - membership and enrollment email flows
  - email sequence admin visibility and controls
  - subscription cancel / upgrade / downgrade lifecycle
  - member discount token flow
  - holy books admin CMS
  - doctrine links admin CMS
  - Sunday Service admin publishing, notification, and filtering/detail parity

## Child Tasks

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

## Done Definition

- community signup and upgrade flows trigger the required membership emails
- community subscription management supports cancel, upgrade, and downgrade rules from the requirement doc
- admins can inspect and control community-related email sequences
- members can use the required 5 percent discount token flow when booking AstrologyPro readings
- holy books and doctrine links are database-managed through admin workflows
- Sunday Service supports admin publishing workflows, member notification, and the required browsing detail/filter behavior

## Verification Gate

1. Validate membership welcome and enrollment confirmation emails trigger correctly.
2. Validate monthly transit ready and Sunday Service new episode notifications can be sent through the intended flow.
3. Validate community subscription cancel / upgrade / downgrade rules behave correctly.
4. Validate member discount tokens create, validate, apply, and mark used correctly.
5. Validate holy books and doctrine links can be managed without code deploy.
6. Validate Sunday Service publish, browse, and filter behavior matches the requirement.

## Notion Ready Summary

Title: Perennial requirement gaps

Summary:
The current Perennial implementation already covers the core community member experience, but several requirement-driven business flows are still open. This task set now breaks those gaps into smaller execution units covering membership emails, transit notifications, subscription lifecycle management, email operations, cross-sell discount tokens, sacred-content admin flows, Sunday Service publishing plus notification behavior, and dashboard refinement.

