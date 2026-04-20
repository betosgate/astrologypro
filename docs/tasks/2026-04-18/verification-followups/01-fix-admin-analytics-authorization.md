# Task VF-01 - Fix Admin Analytics Authorization

- Status: Not Started
- Priority: P0
- Owner: Full Stack
- Area: Admin analytics APIs
- Source: Local verification of `docs/tasks/2026-04-17`
- Created: 2026-04-18

## Files

- `src/app/api/admin/analytics/landing-pages/route.ts`
- `src/app/api/admin/campaigns/analytics/route.ts`
- `src/lib/admin-auth.ts`

## Problem

The seeded admin account can log into `/admin`, but these APIs return `403`:

- `/api/admin/analytics/landing-pages`
- `/api/admin/campaigns/analytics`

The routes use inconsistent admin checks:

- Landing page analytics checks an `admins` table.
- Campaign analytics checks `profiles.role = 'admin'`.
- The project-standard admin check uses `admin_users` through `getAdminUser()` / `requireAdmin()`.

## Implementation

1. Replace local admin-check logic in both analytics routes with `getAdminUser()` or `requireAdmin()`.
2. Return the same response shape used by other admin APIs when unauthorized.
3. Do not add a new admin table or fallback path.

## Acceptance Criteria

- `admin.test@astrologypro.com` can load `/admin/analytics/landing-pages` without "Failed to load analytics".
- `admin.test@astrologypro.com` can load `/admin/campaigns/analytics` without `403`.
- Both APIs return `200` for admin users and `401` or `403` for non-admin users.

## Verification

```bash
npm run build
```

Browser/API checks:

- Log in as `admin.test@astrologypro.com`.
- Open `/admin/analytics/landing-pages`.
- Open `/admin/campaigns/analytics`.
- Fetch `/api/admin/analytics/landing-pages`.
- Fetch `/api/admin/campaigns/analytics`.
