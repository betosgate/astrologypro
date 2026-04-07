# Task 03 - Standardize API Authentication

## Objective
Establish a standard pattern for API authentication checks and 401 handling both on the server (Route Handlers) and the client (Fetch logic).

## Why This Task Exists
When a session expires, APIs currently fail silently or return HTML redirects (if intercepted poorly) instead of a standardized JSON error. This prevents the client UI from reacting appropriately.

## Standard Reference Pattern
- **Reference**: `src/lib/admin-auth.ts`
- **Key Pattern**: `getAdminUser()` usage in `api/admin/**/route.ts`

## Global Rules for APIs
### 1. Centralized Check
- Use `getAdminUser()` (which internally uses `requireAdmin()`) at the top of every protected API Route Handler.
- If `null` is returned, the API must return a `401 Unauthorized` status with a JSON object: `{ error: "Unauthorized" }`.

### 2. Client-Side Interceptor
- Standardize the `fetch()` calls. If an API returns a `401`, the client should trigger a session sync (e.g., via the `AuthProvider`).
- For critical operations, use a dedicated `apiClient` wrapper (e.g., in `src/lib/api.ts`) that handles these status codes globally.

### 3. Loading Feedback
- Use `isPending` or separate `loading` states for API-driven actions (like "Change Status").
- If an API call fails with a 401, a toast should inform the user that their session has expired.

## Required Implementation
1. Review all `src/app/api/admin/**/route.ts` handlers and ensure they return a `401` on auth failure.
2. Create an `apiClient` helper (optional, but recommended) for standardized fetching.
3. In `src/app/admin/**/page.tsx` client components, add basic error handling to the `fetch` calls to detect 401s.
4. Integrate with the `AuthProvider` to ensure that a 401 response results in a clear "Session Expired" notification and redirect.

## Verification Test Plan
- [ ] Use a browser inspector to verify that a call to a protected API (e.g., `/api/admin/training/programs`) with an invalid cookie returns a JSON 401.
- [ ] Confirm that the admin interface reacts to this 401 by showing a login prompt or redirecting.
- [ ] Ensure that no 500 errors occur due to unhandled null users.
