# Task 04: Dedicated Route Migration

- Status: Completed (2026-04-08, verified)
- Completion Notes: Mystery School lives at src/app/mystery-school/{layout,page}.tsx + decans/, training/. APIs at src/app/api/mystery-school/{decan,decans,foundation,post-grad,ritual-builder}.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Largely implemented
- Dedicated `/mystery-school` routes already exist
- Legacy Community Mystery School routes are already being redirected
- Audit remaining gaps before editing
- Do not rebuild route trees that are already in place

## Objective
Move all Mystery School frontend routes from `/community/...` to `/mystery-school/...`.

## Required Route Model

- `/mystery-school` → current decans landing page
- `/mystery-school/decans/[id]`
- `/mystery-school/decans/[id]/ritual`
- `/mystery-school/training`
- `/mystery-school/training/[categoryId]`
- `/mystery-school/training/[categoryId]/[lessonId]`
- `/mystery-school/training/graduation`
- `/mystery-school/training/ritual-builder`

## Requirements

- Mystery School users should land on `/mystery-school`
- PM users should continue using `/community`
- Internal links and portal switching must use the new route base
- Trusted redirect / saved portal logic must include `/mystery-school`
- Community layout should no longer own Mystery School navigation
- Dual-entitlement users must see separate switcher destinations for Community and Mystery School
- Mystery School checkout success should resolve into the Mystery School portal path
- Mystery School checkout cancel path should return to the Mystery School enrollment flow or equivalent Mystery School-specific screen

## Files Likely Affected

- `src/types/user.ts`
- `src/lib/user-roles.ts`
- `src/app/login/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/app/api/auth/post-login-redirect/route.ts`
- `src/app/api/auth/save-last-portal/route.ts`
- Mystery School pages currently under `src/app/community/decans/*`
- Mystery School pages currently under `src/app/community/training/*`

## Success Criteria

- Mystery School is fully separated from Community routing
- `/mystery-school` is the canonical Mystery School frontend base
- PM and Mystery School have clearly separated entry paths
- Portal switching clearly exposes both product areas for dual-entitlement users
