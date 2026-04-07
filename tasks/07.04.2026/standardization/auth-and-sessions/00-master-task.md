# Auth & Session Standardization Master Task

## Objective
Implement a robust, modern authentication and session synchronization system using Next.js Middleware and a client-side Auth Provider to eliminate session-expiry "silent failures" and automatic redirect issues.

## Canonical Folder
- Repo path: `tasks/07.04.2026/standardization/auth-and-sessions`

## Why This Task Pack Exists
Currently, the application relies on individual layout/page checks for session redirecting and lacks a global middleware for session refreshing. This causes users to be "silently logged out" where APIs fail but the UI doesn't redirect until a full page refresh. Additionally, portals like Trainee lack a desktop-accessible "Log out" button. This pack centralizes auth logic for improved reliability and UX parity.

## Global Standardization Rules
1. **Middleware First**: Use a global `middleware.ts` to refresh the session on *every* request (including static assets and APIs).
2. **Global Auth Context**: Use a client-side `AuthProvider` to listen for session changes and trigger immediate UI responses (like redirects or data refreshes).
3. **No Silent Failures**: All 401 Unauthorized API responses must trigger a session state check or a redirect.
4. **Single Source of Truth**: Authorization logic (who can access what) should be centralized in the middleware and auth helpers, not duplicated on every page's server component.

## UI Patterns To Sync
- **Auth Provider**: Must wrap the root layout (`src/app/layout.tsx`).
- **Middleware**: Must protect `/admin` and `/trainee` paths.

## Execution Order
1. `01-middleware/01-implement-supabase-middleware.md`
2. `02-providers/02-create-auth-provider-context.md`
3. `03-api/03-standardize-api-auth-checks.md`
4. `04-logout/04-trainee-logout.md`

## Standard Per-Task Workflow
For each child task:
1. Identify current implementation gaps.
2. Follow the "Standard Reference Pattern" defined in the child task.
3. Implement the required changes.
4. Verify using the verification test plan.

## Done Definition
- All requests (page loads and API fetches) are covered by the new middleware.
- The browser console no longer shows silent 401s; instead, the UI redirects or shows a clear login prompt.
- `AuthProvider` is correctly managing the client-side session state.
