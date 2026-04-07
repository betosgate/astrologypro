# Task: Mystery School Dedicated Route Migration
Date: 2026-04-07
Category: Community Membership Module

## Status
Superseded by the dedicated Mystery School task set in:

- `tasks/07.04.2026/mystery-school/00-master-task.md`
- `tasks/07.04.2026/mystery-school/04-dedicated-route-migration.md`
- `tasks/07.04.2026/mystery-school/05-verification-and-user-flows.md`

Use the `tasks/07.04.2026/mystery-school/` folder as the source of truth for any new implementation work.
This file is now retained as older context/reference only.

## Problem Statement
Mystery School and Perennial Mandalism currently share the same base portal path: `/community`.

This creates product ambiguity because Mystery School is meant to function as a distinct portal experience, not just a membership variant inside the generic Community shell.

Target product decision:
- Perennial Mandalism should remain under `/community`
- Mystery School should move to a dedicated base route: `/mystery-school`
- The new `/mystery-school` landing route should directly show what is currently rendered by `/community/decans`

## Current Status (Audit)

### ✅ DONE (Current Implementation)
- [x] Both `perennial_mandalism` and `mystery_school` currently map to `/community` in `src/types/user.ts`.
- [x] Community layout already branches behavior by `membership_type`.
- [x] Mystery School navigation currently appears inside `src/app/community/layout.tsx`.
- [x] Mystery School decan content already exists at:
  - `src/app/community/decans/page.tsx`
  - `src/app/community/decans/[id]/page.tsx`
  - `src/app/community/decans/[id]/ritual/page.tsx`
- [x] Mystery School training content already exists under `src/app/community/training/*`.

### ❌ NOT DONE (Missing)
- [ ] No dedicated `/mystery-school` app route exists.
- [ ] Login/auth role destinations still send Mystery School users to `/community`.
- [ ] Portal switcher still exposes Mystery School through the generic Community href.
- [ ] Route tracking / saved portal logic does not recognize `/mystery-school` as a first-class portal base.
- [ ] Mystery School pages are still coupled to the Community layout shell and nav assumptions.

### 🛠️ FIXES/REFINEMENTS
- [ ] Create a dedicated Mystery School layout and navigation model.
- [ ] Decide whether Mystery School should reuse Community visual components or have a separate shell.
- [ ] Prevent Perennial users from accidentally entering Mystery School routes.

## Required Product Outcome

1. `perennial_mandalism` users enter the product at `/community`
2. `mystery_school` users enter the product at `/mystery-school`
3. `/mystery-school` should render the current Mystery School decan landing experience that now lives at `/community/decans`
4. Mystery School deep routes should also move under the new base path
5. The new `/mystery-school` route should be treated as the only canonical Mystery School path going forward
6. Mystery School training/foundation pages must also move under `/mystery-school`

## Detailed Requirements

1. **Role Destination Split**
   * Update role-based destination logic so Mystery School no longer resolves to `/community`
   * Inspect and update at minimum:
     * `src/types/user.ts`
     * `src/app/auth/callback/route.ts`
     * `src/app/api/auth/post-login-redirect/route.ts`
     * `src/app/login/page.tsx` trusted portal base list

2. **Dedicated Mystery School App Route**
   * Create a new route tree rooted at `/mystery-school`
   * Minimum expected pages:
     * `/mystery-school` → decans landing page
     * `/mystery-school/decans/[id]`
     * `/mystery-school/decans/[id]/ritual`
     * `/mystery-school/training`
     * `/mystery-school/training/[categoryId]`
     * `/mystery-school/training/[categoryId]/[lessonId]`
     * `/mystery-school/training/graduation`
     * `/mystery-school/training/ritual-builder`
   * The new `/mystery-school` homepage should be the actual decans home experience, not a redirect placeholder

3. **Layout / Navigation Separation**
   * Extract Mystery School out of `src/app/community/layout.tsx`
   * Remove Mystery School-only navigation from the Community shell
   * Create a dedicated Mystery School layout if needed
   * Ensure navigation labels, header, route tracker, and portal switcher reflect the new base path

4. **Link Migration**
   * Update all internal links that currently point to:
     * `/community/decans`
     * `/community/decans/[id]`
     * `/community/decans/[id]/ritual`
     * `/community/training`
     * `/community/training/[categoryId]`
     * `/community/training/[categoryId]/[lessonId]`
     * `/community/training/graduation`
     * `/community/training/ritual-builder`
     * any other Mystery School-only Community routes
   * Target route examples:
     * `/community/decans` → `/mystery-school`
     * `/community/decans/:id` → `/mystery-school/decans/:id`
     * `/community/decans/:id/ritual` → `/mystery-school/decans/:id/ritual`
     * `/community/training` → `/mystery-school/training`
     * `/community/training/:categoryId` → `/mystery-school/training/:categoryId`
     * `/community/training/:categoryId/:lessonId` → `/mystery-school/training/:categoryId/:lessonId`
     * `/community/training/graduation` → `/mystery-school/training/graduation`
     * `/community/training/ritual-builder` → `/mystery-school/training/ritual-builder`
   * Inspect:
     * page links
     * success/CTA links
     * admin preview links
   * Remove the old Community-based Mystery School path usage instead of preserving it as an ongoing route model

5. **Access Control**
   * Mystery School routes must remain gated to active Mystery School members
   * Perennial users must not access Mystery School portal content unless product rules explicitly allow it
   * Preserve existing `requireMysterySchoolAccess` behavior where applicable

6. **Portal Switching**
   * Ensure multi-role users can switch directly into the Mystery School portal from `/switch`
   * If a user has both PM and Mystery School entitlements, clarify whether the switcher should show:
     * separate portals
     * or one shared Community entry plus Mystery School entry
   * This decision must be explicit in implementation, not left implicit

## Technical Audit Notes

Current known coupling points to inspect:

- `src/types/user.ts`
  Mystery School currently maps to `/community`

- `src/lib/user-roles.ts`
  Portal switcher currently pushes generic Community portal data

- `src/app/community/layout.tsx`
  Community layout currently includes Mystery School-specific nav items like Training and Decans

- `src/app/community/decans/page.tsx`
  This is the current source for the new `/mystery-school` landing experience

- `src/app/community/decans/[id]/page.tsx`
  Decan detail route should move to `/mystery-school/decans/[id]`

- `src/app/community/decans/[id]/ritual/page.tsx`
  Ritual flow route should move to `/mystery-school/decans/[id]/ritual`

- `src/app/community/training/page.tsx`
  Training overview route should move to `/mystery-school/training`

- `src/app/community/training/[categoryId]/page.tsx`
  Training category route should move to `/mystery-school/training/[categoryId]`

- `src/app/community/training/[categoryId]/[lessonId]/page.tsx`
  Training lesson route should move to `/mystery-school/training/[categoryId]/[lessonId]`

- `src/app/community/training/graduation/page.tsx`
  Graduation route should move to `/mystery-school/training/graduation`

- `src/app/community/training/ritual-builder/page.tsx`
  Ritual builder route should move to `/mystery-school/training/ritual-builder`

- `src/lib/email.ts`
  Remove Community-based Mystery School path usage if any still exists

- `src/app/api/auth/save-last-portal/route.ts`
  Current trusted portal base list includes `/community` but not `/mystery-school`

- `src/app/api/auth/post-login-redirect/route.ts`
  Current trusted portal base list includes `/community` but not `/mystery-school`

- `src/app/login/page.tsx`
  Trusted redirect destinations include `/community` but not `/mystery-school`

## Expected Deliverables

1. New dedicated `/mystery-school` route tree
2. Updated role destination logic
3. Updated internal links to use the new canonical route
4. Updated portal switcher behavior
5. Full Mystery School training route migration under `/mystery-school`
6. Verified access-control behavior for both PM and Mystery School users

## Verification Checklist

- [ ] Mystery School user login lands on `/mystery-school`
- [ ] Perennial Mandalism user login lands on `/community`
- [ ] `/mystery-school` shows the former decans landing experience
- [ ] `/mystery-school/decans/[id]` loads correctly
- [ ] `/mystery-school/decans/[id]/ritual` loads correctly
- [ ] `/mystery-school/training` loads correctly
- [ ] `/mystery-school/training/[categoryId]` loads correctly
- [ ] `/mystery-school/training/[categoryId]/[lessonId]` loads correctly
- [ ] `/mystery-school/training/graduation` loads correctly
- [ ] `/mystery-school/training/ritual-builder` loads correctly
- [ ] Multi-role users can still switch portals without confusion
- [ ] CTA and internal navigation open the correct Mystery School route

## Success Criteria

- Mystery School no longer feels like a hidden subsection of Community
- Perennial Mandalism and Mystery School have clearly separated entry paths
- Existing Mystery School functionality remains intact after the route migration
- Mystery School uses only the dedicated `/mystery-school` route model going forward
