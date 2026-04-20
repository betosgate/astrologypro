# Implementation Guide - 2026-04-18 Verification Follow-Ups

## READ THIS FIRST

This folder contains the follow-up tasks from local verification of the 2026-04-17 sprint.

- Task folder: `docs/tasks/2026-04-18/verification-followups/`
- Created: 2026-04-18
- Scope: Fix issues found during local verification of the 2026-04-17 Diviner Service Landing Page and Campaign Destination Tracking work.

## Execution Order

Complete the P0 tasks first, then move through the P1 tasks in order.

| Step | Task File | Priority | Summary |
|---|---|---|---|
| 1 | `verification-followups/01-fix-admin-analytics-authorization.md` | P0 | Align admin analytics APIs with project-standard admin auth. |
| 2 | `verification-followups/02-deactivate-tracking-links-on-draft-delete.md` | P0 | Disable or delete campaign tracking links when draft campaigns are deleted. |
| 3 | `verification-followups/03-fix-landing-page-dashboard-summary-counts.md` | P1 | Make landing page summary counts match template-backed published pages. |
| 4 | `verification-followups/04-restore-lint-as-useful-gate.md` | P1 | Remove invalid Next config and make lint actionable. |
| 5 | `verification-followups/05-confirm-or-implement-missing-task-files.md` | P1 | Confirm intentional consolidation or implement missing task-specified files. |
| 6 | `verification-followups/06-fix-next16-dynamic-params-in-admin-service-routes.md` | P0 | Fix false 404s from synchronous dynamic params in admin service routes. |
| 7 | `verification-followups/07-align-campaign-share-url-status-behavior.md` | P1 | Make campaign share URL behavior match draft/active campaign status in UI and redirects. |
| 8 | `verification-followups/08-add-missing-sidebar-menu-routes.md` | P1 | Add missing admin/diviner sidebar and mobile menu routes for verified pages. |

## Verification Baseline

The original verification run completed:

- `npm ci`
- `npm run lint`
- `npm run build`
- Local Next.js app on `http://localhost:3000`
- Browser/API checks with:
  - `diviner1@test.astrologypro.com` / `TestUser123!`
  - `admin.test@astrologypro.com` / `AdminTest2026!`
- Campaign destination API mutation check with cleanup

Build passed, but lint failed and runtime issues remain. Each child task includes its own acceptance criteria and verification steps.

## 2026-04-18 Rerun Notes

Local verification was rerun against `http://localhost:3000` with the documented diviner, admin, and client accounts.

- `npm run build` passed.
- `npm run lint` still failed with 413 problems and remains covered by Task 04.
- `/api/admin/analytics/landing-pages` and `/api/admin/campaigns/analytics` still returned `403` for `admin.test@astrologypro.com` and remain covered by Task 01.
- `/api/dashboard/landing-pages/[templateId]/preview` returned `404` and remains covered by Task 05.
- Deleting a temporary draft campaign still left an active orphaned tracking link and remains covered by Task 02.
- `/admin/service-templates/[id]` returned 404 for a valid template ID and is now covered by Task 06.
- `/api/admin/diviners/[id]/services` returned 404 for a valid diviner ID and is now covered by Task 06.
- A draft campaign share URL redirected to the diviner profile, while the same URL redirected to the service only after activation; this behavior mismatch is now covered by Task 07.
- Some verified routes exist but are missing or hard to discover in sidebar/mobile navigation; this is now covered by Task 08.
