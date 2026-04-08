# Task 02 - Create Client-Side Auth Provider

- Status: Completed (2026-04-08, verified)
- Completion Notes: `src/components/providers/auth-provider.tsx` (137 lines) — `useAuth()` context, listens to Supabase auth state, dispatches `dispatchUnauthorizedApiEvent` on 401, debounces with `unauthorizedInFlightRef`, mounted in `src/app/layout.tsx:124`.

## Objective
Implement a client-side `AuthProvider` that listens for Supabase auth state changes and manages the session in a shared React context.

## Why This Task Exists
A global client-side auth context ensures that the UI can react immediately to session changes (like logging out) without waiting for a full page refresh. This provides a more "app-like" experience and prevents stale data from being displayed.

## Standard Reference Pattern
- **Reference**: [Supabase Auth Client-Side State](https://supabase.com/docs/guides/auth/server-side/nextjs)
- **Key Files**: `src/components/providers/auth-provider.tsx`, `src/app/layout.tsx`

## Global Rules for the Auth Provider
### 1. Browser-Side Listener
- Initialize a `supabase` browser client once in the provider.
- Use `supabase.auth.onAuthStateChange` to monitor events like:
    - `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`, `USER_UPDATED`.

### 2. Auto-Synchronization
- When a `TOKEN_REFRESHED` event occurs, the provider should call `router.refresh()` to propagate the new cookies to the server-side components.
- When `SIGNED_OUT` occurs, the provider should `router.push('/login')` immediately.

### 3. Contextual Data
- Expose `user`, `session`, and `isLoading` through a custom hook (e.g., `useAuth()`).
- The provider must wrap the entire application within `src/app/layout.tsx`.

## Required Implementation
1. Create `src/components/providers/auth-provider.tsx` with a standard React Context and a Supabase listener.
2. In `src/app/layout.tsx`, wrap the children with the new `AuthProvider`.
3. Verify that the browser console shows the session events as they happen (e.g., manually delete the cookie and see the provider react).

## Verification Test Plan
- [ ] Log out via the UI and verify that the page redirects to `/login` without a manual refresh.
- [ ] Log in and verify that `useAuth()` correctly provides the `User` object to child components.
- [ ] Confirm no redundant renders are caused by the auth listener.
