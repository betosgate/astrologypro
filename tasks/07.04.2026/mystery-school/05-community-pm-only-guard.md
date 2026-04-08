# Task 05: Community PM-Only Guard

- Status: Completed (2026-04-08, re-audited)
- Completion Notes: /community layout (src/app/community/layout.tsx:30) redirects non-perennial users to /mystery-school, so Mystery School-only users cannot remain inside the PM portal.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Not fully implemented
- This is an active remaining bug-fix task
- Audit current `/community` gating and rendering first, then patch the PM-only behavior

## Objective
Make `/community` a Perennial Mandalism-only portal in both routing and rendered content.

## Problem

After the Mystery School route migration, some legacy Mystery School users can still enter
`/community` because the Community layout currently accepts any active `community_members`
row. The Community dashboard also still contains a Mystery School-specific rendering branch.

That creates the wrong behavior:

- PM users see PM content in `/community`
- legacy MS users can also open `/community`
- `/community` then renders a Mystery School-flavored membership dashboard

This is incompatible with the target architecture.

## Required Behavior

- `/community` must be PM-only
- a user whose access is Mystery School-only must not stay in `/community`
- Mystery School-only users should be redirected to `/mystery-school`
- the Community dashboard should render PM content only
- Mystery School messaging inside `/community` should be limited to:
  - role switcher behavior for dual-entitlement users
  - the existing PM upsell block such as "The Mystery School Awaits You"

## Requirements

- Add a strict PM-only gate to the Community portal shell/layout
- Prevent Mystery School-only users from seeing the Community dashboard
- Remove or disable the Mystery School-specific membership dashboard branch from `/community`
- Preserve valid PM behavior in `/community`
- Preserve dual-entitlement switcher behavior
- Preserve legacy redirects from old Mystery School Community subroutes into `/mystery-school`

## Files Likely Affected

- `src/app/community/layout.tsx`
- `src/app/community/page.tsx`
- `src/lib/user-roles.ts`
- any Community-only components still rendering `membership_type = "mystery_school"` content

## Test Cases

1. Active PM-only user opens `/community`
   - stays in `/community`
   - sees PM-only content

2. Legacy Mystery School-only user opens `/community`
   - is redirected to `/mystery-school`
   - does not see a Mystery School dashboard rendered inside `/community`

3. Dual-entitlement user opens `/community`
   - stays in `/community`
   - sees PM content there
   - can use the switcher to enter `/mystery-school`

## Success Criteria

- `/community` no longer renders Mystery School membership content
- Mystery School-only users cannot remain inside the Community dashboard
- PM-only and dual-entitlement users still have correct Community access
