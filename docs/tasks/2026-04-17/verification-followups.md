# Verification Follow-Up Tasks - 2026-04-17 Sprint

- Status: Not Started
- Priority: P0/P1 mixed
- Owner: Full Stack
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-17

## Goal

Fix the issues found during local verification of the Diviner Service Landing Page and Campaign Destination Tracking work. These tasks are required before the sprint can be considered complete.

## Verification Summary

Local checks completed:

- `npm ci`
- `npm run lint`
- `npm run build`
- Local Next.js app on `http://localhost:3000`
- Browser/API checks with:
  - `diviner1@test.astrologypro.com` / `TestUser123!`
  - `admin.test@astrologypro.com` / `AdminTest2026!`
- Campaign destination API mutation check with cleanup

Build passed, but lint failed and several runtime issues remain.

---

## Task VF-01 - Fix Admin Analytics Authorization

- Status: Not Started
- Priority: P0
- Area: Admin analytics APIs
- Files:
  - `src/app/api/admin/analytics/landing-pages/route.ts`
  - `src/app/api/admin/campaigns/analytics/route.ts`
  - `src/lib/admin-auth.ts`

### Problem

The seeded admin account can log into `/admin`, but these APIs return `403`:

- `/api/admin/analytics/landing-pages`
- `/api/admin/campaigns/analytics`

The routes use inconsistent admin checks:

- Landing page analytics checks an `admins` table.
- Campaign analytics checks `profiles.role = 'admin'`.
- The project-standard admin check uses `admin_users` through `getAdminUser()` / `requireAdmin()`.

### Implementation

1. Replace local admin-check logic in both analytics routes with `getAdminUser()` or `requireAdmin()`.
2. Return the same response shape used by other admin APIs when unauthorized.
3. Do not add a new admin table or fallback path.

### Acceptance Criteria

- `admin.test@astrologypro.com` can load `/admin/analytics/landing-pages` without “Failed to load analytics”.
- `admin.test@astrologypro.com` can load `/admin/campaigns/analytics` without `403`.
- Both APIs return `200` for admin users and `401` or `403` for non-admin users.

### Verification

```bash
npm run build
```

Browser/API checks:

- Log in as `admin.test@astrologypro.com`.
- Open `/admin/analytics/landing-pages`.
- Open `/admin/campaigns/analytics`.
- Fetch `/api/admin/analytics/landing-pages`.
- Fetch `/api/admin/campaigns/analytics`.

---

## Task VF-02 - Deactivate or Delete Tracking Links When Draft Campaigns Are Deleted

- Status: Not Started
- Priority: P0
- Area: Campaign destination tracking
- Files:
  - `src/app/api/dashboard/campaigns/route.ts`
  - `src/app/api/dashboard/campaigns/[id]/route.ts`
  - `src/app/r/[code]/route.ts`

### Problem

Creating a draft campaign with a service destination creates a `tracking_links` row. Deleting the draft campaign deletes the campaign but leaves the tracking link active:

- `campaign_id = null`
- `is_active = true`
- `/r/cmp_...` still resolves as a legacy tracking link

This creates orphaned active campaign URLs.

### Implementation

1. In `DELETE /api/dashboard/campaigns/[id]`, load `tracking_link_id` and/or `campaign_code`.
2. When deleting the draft campaign, either:
   - delete the associated `tracking_links` row, or
   - set `tracking_links.is_active = false`.
3. Ensure cleanup is scoped to the authenticated diviner’s campaign only.
4. Confirm `/r/[code]` redirects inactive/deleted campaign links to `/`.

### Acceptance Criteria

- Deleting a draft campaign disables or removes its campaign tracking link.
- No active `tracking_links` row remains for the deleted campaign code.
- Existing non-campaign tracking links still work.

### Verification

1. Log in as `diviner1@test.astrologypro.com`.
2. Create a draft campaign with `destination_type = SERVICE`.
3. Confirm campaign has `campaign_code`, `share_url`, and `tracking_link_id`.
4. Delete the draft campaign.
5. Query `tracking_links` by the campaign code.
6. Confirm the row is gone or `is_active = false`.

---

## Task VF-03 - Fix Landing Page Dashboard Summary Counts

- Status: Not Started
- Priority: P1
- Area: Diviner landing pages API/UI
- Files:
  - `src/app/api/dashboard/landing-pages/route.ts`
  - `src/app/dashboard/landing-pages/page.tsx`

### Problem

For `diviner1@test.astrologypro.com`, `/api/dashboard/landing-pages` returned enabled services with:

- `is_published = true`
- `publish_status = "published"`

But the summary returned:

- `total_enabled = 2`
- `total_published = 0`

The summary currently counts only `service_landing_pages.status === "published"` and ignores `diviner_services.is_published`.

### Implementation

1. Decide the summary source of truth:
   - If a custom `service_landing_pages` row exists, use its `status`.
   - If no custom landing page exists, use `diviner_services.is_published` / `publish_status`.
2. Update `total_published`, `total_draft`, and status filtering to match that decision.
3. Make the landing pages UI labels match the API.

### Acceptance Criteria

- A diviner with 2 enabled and published service pages sees `total_published = 2`.
- Published filter includes template-backed published pages even when no custom builder row exists.
- Draft filter does not incorrectly include published template-backed pages.

### Verification

```bash
curl http://localhost:3000/api/dashboard/landing-pages
```

Use an authenticated browser session for `diviner1@test.astrologypro.com` and verify:

- `/dashboard/landing-pages` summary counts match returned rows.
- Public URLs for published rows load.

---

## Task VF-04 - Restore Lint as a Useful Gate

- Status: Not Started
- Priority: P1
- Area: Code quality / CI
- Files:
  - `eslint.config.mjs`
  - `next.config.ts`
  - affected React client components

### Problem

`npm run lint` fails with 413 problems:

- 188 errors
- 225 warnings

Many errors are React compiler lint rules such as:

- `react-hooks/set-state-in-effect`
- `react-hooks/static-components`
- `react-hooks/purity`

Build currently skips TypeScript errors and has an invalid `eslint` key in `next.config.ts` for Next 16.

### Implementation

1. Remove or replace the invalid `eslint` config from `next.config.ts`.
2. Decide whether React compiler lint rules are intended to be blocking in this project.
3. Fix or explicitly tune lint rules so `npm run lint` is actionable.
4. Do not silence new sprint-specific issues without review.

### Acceptance Criteria

- `npm run lint` completes successfully, or the remaining failures are intentionally documented and scoped.
- `next.config.ts` no longer produces the Next 16 invalid config warning for `eslint`.
- Build no longer relies on unsupported lint config.

### Verification

```bash
npm run lint
npm run build
```

---

## Task VF-05 - Confirm or Implement Missing Task-Specified Files

- Status: Not Started
- Priority: P1
- Area: Landing page builder completeness
- Files listed below

### Problem

The task docs list files/routes that are not present. Some behavior may have been implemented inline, but this needs explicit confirmation or implementation.

Missing files from the original task specification:

- `src/app/api/dashboard/landing-pages/[templateId]/preview/route.ts`
- `src/components/dashboard/landing-page-card.tsx`
- `src/components/dashboard/landing-page-filters.tsx`
- `src/components/dashboard/landing-page-summary.tsx`
- `src/components/dashboard/landing-page-empty-state.tsx`
- `src/components/dashboard/builder/section-list-item.tsx`
- `src/components/dashboard/builder/page-settings-panel.tsx`
- `src/components/dashboard/builder/builder-toolbar.tsx`

### Implementation

1. Review whether each missing file is still required by the product behavior.
2. If behavior exists inline, document the intentional deviation in the relevant task file or README.
3. If behavior is missing, implement the file/route using existing patterns.
4. Pay special attention to the missing preview API route because the task explicitly called for a draft preview workflow.

### Acceptance Criteria

- Each missing file is either implemented or explicitly marked as intentionally consolidated elsewhere.
- Draft preview workflow is verified.
- Landing page builder UI remains usable after any extraction/refactor.

### Verification

- Open `/dashboard/landing-pages/[templateId]/builder`.
- Edit a draft section.
- Preview draft content without publishing.
- Confirm public page still shows only published content.

---

## Task VF-06 - Normalize Local Environment Requirements

- Status: Not Started
- Priority: P2
- Area: Developer environment
- Files:
  - `.nvmrc`
  - `README.md`
  - `docs/test-users.md`

### Problem

The repo requires Node `22.19.0` in `.nvmrc`, but verification initially ran on Node `20.19.0`. `npm ci` warned that `@daily-co/daily-js` requires Node `>=22.14.0`.

Also, Next 16 expects `.env.local` at the project root. The IDE originally had `src/.env.local` open, but local build only succeeded after `.env.local` was present at the repo root.

### Implementation

1. Document Node `22.19.0` as required for local development.
2. Document that `.env.local` belongs at repo root.
3. Add an `.env.local.example` if one does not already exist.

### Acceptance Criteria

- New developers can run `npm ci`, `npm run dev`, and `npm run build` without env-file-location confusion.
- README local setup matches actual Next 16 behavior.

### Verification

```bash
node -v
npm ci
npm run build
```

