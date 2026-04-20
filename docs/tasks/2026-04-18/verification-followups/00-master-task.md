# Master Task - Verification Follow-Ups - 2026-04-18

- Status: Not Started
- Priority: P0/P1 mixed
- Owner: Full Stack
- Module: Diviner landing pages, campaign destinations, admin analytics, code quality
- PMS Type: Master Task
- Folder Path: `docs/tasks/2026-04-18/verification-followups`
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Goal

Fix the issues found during local verification of the Diviner Service Landing Page and Campaign Destination Tracking work. These tasks are required before the 2026-04-17 sprint can be considered complete.

## Verification Summary

Local checks completed before these follow-ups were created:

- `npm ci`
- `npm run lint`
- `npm run build`
- Local Next.js app on `http://localhost:3000`
- Browser/API checks with:
  - `diviner1@test.astrologypro.com` / `TestUser123!`
  - `admin.test@astrologypro.com` / `AdminTest2026!`
- Campaign destination API mutation check with cleanup

Build passed, but lint failed and several runtime issues remain.

## Child Tasks In Scope

1. `01-fix-admin-analytics-authorization.md` - Fix inconsistent admin authorization in analytics APIs.
2. `02-deactivate-tracking-links-on-draft-delete.md` - Disable or remove tracking links when draft campaigns are deleted.
3. `03-fix-landing-page-dashboard-summary-counts.md` - Fix landing page dashboard summary counts and filters.
4. `04-restore-lint-as-useful-gate.md` - Restore lint as an actionable quality gate.
5. `05-confirm-or-implement-missing-task-files.md` - Confirm or implement task-specified files that are missing.
6. `06-fix-next16-dynamic-params-in-admin-service-routes.md` - Fix false 404s in admin service routes caused by synchronous dynamic params.
7. `07-align-campaign-share-url-status-behavior.md` - Make campaign share/copy URL behavior align with draft vs active status.
8. `08-add-missing-sidebar-menu-routes.md` - Add missing or hard-to-discover admin/diviner sidebar and mobile menu routes.

## Execution Notes

- Complete both P0 tasks first.
- Preserve existing campaign, landing page, and admin flows while fixing these issues.
- Read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing Next.js app route, config, or framework-specific behavior.
- Use project-standard admin authorization via `src/lib/admin-auth.ts`.
- Do not add parallel admin, campaign, tracking, or landing page systems.

## Done Definition

- All eight child tasks are complete.
- Admin analytics APIs are accessible to seeded admin users and blocked for non-admin users.
- Deleted draft campaigns do not leave active orphaned campaign tracking URLs.
- Landing page dashboard counts and filters match the API rows shown to diviners.
- `npm run lint` is either passing or has remaining intentional failures documented and scoped.
- Missing task-specified files are implemented or intentionally documented as consolidated elsewhere.
- Admin service template edit and diviner service assignment routes load for valid IDs.
- Campaign share URLs either clearly require activation or redirect to the expected destination according to the documented product behavior.
- Admin and diviner users can find the verified main routes from sidebar or mobile navigation without typing URLs manually.

## Final Verification Gate

Run these checks after the child tasks are complete:

```bash
npm run lint
npm run build
```

Browser/API checks:

- Log in as `admin.test@astrologypro.com`.
- Open `/admin/analytics/landing-pages`.
- Open `/admin/campaigns/analytics`.
- Log in as `diviner1@test.astrologypro.com`.
- Open `/dashboard/landing-pages`.
- Create and delete a draft campaign with a service destination.
- Confirm the deleted draft campaign's `/r/cmp_...` URL no longer resolves as an active campaign link.
- Open `/dashboard/landing-pages/[templateId]/builder` and verify draft preview behavior.
- Open `/admin/service-templates/[id]` for a valid template ID.
- Open `/admin/diviners/[id]` and verify service assignment data loads.
- Create a service-destination campaign and verify `/r/cmp_...` behavior before and after activation matches the chosen product rule.
- From the admin sidebar/menu, open landing-page analytics and campaign analytics.
- From the diviner desktop sidebar and mobile navigation, open campaigns, landing pages, and analytics.
