# Task 01 - Implement Supabase Auth Middleware

- Status: Completed (2026-04-08, verified)
- Completion Notes: `src/lib/supabase/middleware.ts` calls `supabase.auth.getUser()` to refresh tokens; protects /admin, /api/admin, /trainee, /api/trainee, /community, /mystery-school, /dashboard, /portal, /advocate, /affiliate, /onboarding. Browser → 302 to `/login?reason=<group>&redirect=<path>`; API → `401 JSON {error:"Unauthorized"}`. Matcher in `src/proxy.ts` excludes static assets.

## Objective
Implement a global `middleware.ts` that handles session refreshing and provides a unified point for route protection.

## Why This Task Exists
Currently, session refreshing is only happening when `getUser()` is called in Server Components, and there is no automatic refresh for API calls or client-side navigation that isn't backed by a server component check. This results in "silent logouts" where users stay on the page while their session is technically expired.

## Standard Reference Pattern
- **Reference**: [Supabase Auth with Next.js Middleware](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **Key Files**: `src/middleware.ts` (new), `src/lib/supabase/middleware.ts` (helper)

## Global Rules for Middleware
### 1. Unified Session Refresh
- Use `supabase.auth.getUser()` inside the middleware to automatically refresh the session (and update cookies) on every request.
- The middleware must intercept *all* requests except for `_next/static`, `_next/image`, `favicon.ico`, and public assets (e.g., in `/public`).

### 2. Global Route Protection
- Centralize access logic. Instead of repeating `if (!user) redirect("/login")` on every page, handle it once in the middleware for:
    - `/admin/**`
    - `/trainee/**`
- Include a `reason` parameter in the redirect URL (e.g., `/login?reason=expired`) to improve UX feedback.

### 3. API Route Interception
- Ensure API routes (`/api/admin/**`) are also protected by the middleware.
- Instead of redirecting to `/login` for API requests, they should return a `401 Unauthorized` JSON response.

## Required Implementation
1. Create `src/lib/supabase/middleware.ts` to host the `updateSession` helper.
2. Create `src/middleware.ts` in the root (or `src/`) according to the Next.js standard.
3. Configure the `config.matcher` to include all routes except for static assets.
4. Integrate the `updateSession` helper in the root `middleware.ts`.
5. Verify that the session cookie (`sb-access-token` / `sb-refresh-token`) is updated in the browser on subsequent requests.

## Verification Test Plan
- [ ] Log in and manually set the access token cookie to an expired value (but keep the refresh token).
- [ ] Navigate to an admin page and verify the middleware successfully refreshes the token without a manual redirect.
- [ ] Log out (delete cookies) and verify navigating to `/admin` immediately redirects to `/login?reason=admin`.
- [ ] Verify that non-protected routes (like `/` or `/blog`) still load correctly without a session.
