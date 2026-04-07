# Task 04 - Standardize Trainee Logout

## Objective
Implement a visible and functional "Log out" method for the Trainee Portal on both desktop and mobile, ensuring parity with the Admin UI.

## Why This Task Exists
Currently, the logout button in the Trainee Portal is only present in the mobile navigation and may be pointing to a non-functional or non-standard endpoint. Desktop users have no obvious way to sign out, which is a significant UX gap compared to the Admin Portal.

## Current Repo State
- **Trainee Layout**: `src/app/trainee/layout.tsx` defines the header but lacks a logout button for desktop.
- **Mobile Nav**: `src/components/community/mobile-nav.tsx` contains a sign-out form that may be inconsistent with client-side auth.
- **Admin Reference**: `src/components/admin/admin-sidebar.tsx` successfully implements logout using `supabase.auth.signOut()`.

## Global Rules for Logout
### 1. Consistent Implementation
- Use the client-side `supabase.auth.signOut()` method followed by a `router.push('/login')` for all portals.
- Avoid using `<form action="/api/auth/signout">` unless the API is explicitly designed and verified to handle it.

### 2. Desktop & Mobile Visibility
- The "Log out" option must be easily accessible on desktop (e.g., in the header or an account dropdown).
- It must be consistently styled across all user portals (Trainee, Admin, etc.).

### 3. Clear Feedback
- After logging out, ensure common client-side state (like the `AuthContext`) is fully cleared.
- Redirect the user to the generic `/login` page.

## Required Implementation
1. Create a Client Component `TraineeLogout` (or a more generic `LogoutButton`) that implements the `signOut` logic.
2. In `src/app/trainee/layout.tsx`, add the `LogoutButton` to the header (desktop view, near the "Account" link).
3. Update `src/components/community/mobile-nav.tsx` to use the same client-side logic instead of the form action.
4. Verify that clicking "Log out" successfully redirects to `/login` and clears the session.

## Verification Test Plan
- [ ] Log in as a trainee on a desktop browser.
- [ ] Verify that a "Log out" button is visible in the header.
- [ ] Click "Log out" and confirm redirect to `/login`.
- [ ] Attempt to go back to `/trainee` and verify the middleware or layout check redirects you back to login.
- [ ] On a mobile-simulated screen, verify the "Sign Out" button in the menu works identically.
