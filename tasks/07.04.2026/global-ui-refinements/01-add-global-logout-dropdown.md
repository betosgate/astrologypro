# Add Global Logout Dropdown to Shared Layouts

## Objective
Add a functional "Sign Out" button to the desktop navigation header of role layouts that currently lack it without breaking existing responsive states or components.

## Files To Read First
- `src/app/community/layout.tsx`
- `src/app/trainee/layout.tsx`
- `src/app/advocate/layout.tsx`
- `src/app/affiliate/layout.tsx`
- `src/components/portal/logout-button.tsx` (for reference of existing behavior)

## Exact Gap
The layouts for Community, Trainee, Advocate, and Affiliate successfully render an "Account" link or other top-level links but provide no user "Log Out" path in desktop view. Specifically, they rely on a standard `<header>` with flex items on the right side, but the logout form/button is missing.

## Required Implementation
1. **Identify the missing header components**: Open all 4 layout files mentioned.
2. **Add a Sign Out Action**: For Server Components (since these layouts are rendered server-side), use the existing `<PortalLogoutButton />` imported from `@/components/portal/logout-button` where possible, or inject a straightforward native `<form action="/api/auth/signout" method="post">` button to handle redirection cleanly.
3. **Menu Restructuring**: Incorporate the Sign Out button visually next to the `Account` link within the `<div className="flex items-center gap-2">` blocks cleanly.
4. **Mobile Fallback Check**: Ensure that adding desktop buttons does not double up or break existing logout implementation inside `MobileNav` mobile-only components.

## Acceptance Criteria
- A desktop user logged in as an Advocate, Affiliate, Trainee, or Community Member can click exactly one "Log Out" / "Sign Out" button at the top header area of the page.
- Clicking the button successfully unauthenticates the user and redirects to `/login`.
- No visual collision occurs with the existing `PortalSwitcher` or `NotificationBell`.
