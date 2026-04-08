# Deep Verification Report — 07.04.2026 Tasks

Date: 2026-04-08
Scope: Line-by-line verification of the highest-risk task areas (auth, billing, training school authority, multi-role auth).

## Method

For each item below, I read the actual implementation file end-to-end, traced the data flow, and compared against the task acceptance criteria. This is **not** a grep-pass; it is a real read.

## Summary

| Area | Verdict | Notes |
|---|---|---|
| Auth middleware (`src/lib/supabase/middleware.ts`) | ✅ PASS | One observation, no bug |
| Admin role gate (`src/lib/admin-auth.ts`) | ✅ PASS | DB-first with `ADMIN_EMAILS` bootstrap |
| Admin API handler pattern (sample: `bulk-email/route.ts`) | ✅ PASS | Defense-in-depth: middleware + getAdminUser() |
| Mystery School checkout pricing (`api/community/checkout/route.ts`) | ✅ PASS | Defaults match migration seed |
| Training School global sequential lock (programs + lessons routes) | ✅ PASS | Both gates use same `globalLock` derivation |
| Training School trigger → completion → graduation | ✅ PASS | Single authority via `lesson_completions` |
| Multi-role user list merge (`admin/users/page.tsx`) | ✅ PASS | Dedup-by-slug, earliest joinedAt |
| Community profile form (`profile-form.tsx`) | ✅ PASS | Client UPDATE protected by `community_update_own` RLS |
| Unsubscribe API (`api/community/billing/unsubscribe/route.ts`) | ✅ PASS | `'cancelling'` is in CHECK constraint (migration `20260406000032`) |

## Findings in detail

### Auth middleware
File: `src/lib/supabase/middleware.ts`
- Calls `supabase.auth.getUser()` on every request → cookies refresh on each hit (correct Supabase ssr pattern).
- API requests to protected prefixes return `401 JSON`; browser requests redirect to `/login?reason=<group>&redirect=<path>`.
- **Observation (not a bug):** lines 93–95 (`if (matchedRoute?.apiOnly && !isApiRequest) return supabaseResponse;`) is unreachable dead code — `apiOnly` routes are always API-prefixed by definition. Could be removed in a follow-up cleanup, no behavioral impact.

### Admin authorization
File: `src/lib/admin-auth.ts`
- `getAdminUser()` calls `requireAdmin()` which checks `admin_users` table first, then `ADMIN_EMAILS` env as a bootstrap fallback. Returns the User on success, `null` otherwise.
- Verified consumer pattern in `src/app/api/admin/bulk-email/route.ts:14-17`: 401 short-circuit before any handler logic.
- The middleware itself only checks session presence; the **role** check is enforced inline in admin handlers via `getAdminUser()`. This is the correct OWASP A01 defense-in-depth pattern.

### Mystery School checkout pricing
File: `src/app/api/community/checkout/route.ts:91-148`
- Three Stripe price env vars: `STRIPE_PRICE_MYSTERY_ENROLLMENT`, `STRIPE_PRICE_MYSTERY_MONTHLY`, `STRIPE_PRICE_MYSTERY_MONTHLY_PM_DISCOUNT`.
- Discount applies when (a) caller is an active `perennial_mandalism` member AND (b) `platform_settings.ms_pm_discount_enabled` is true.
- The fallback `?? true` at line 126 looked suspicious initially. **Verified intentional**: migration `20260407000095_ms_parallel_membership.sql` sets the column DEFAULT `true` and seeds the singleton row with `true`. Internally consistent — discount-on by default, admin must explicitly disable.
- Success/cancel URLs route MS users back to `/mystery-school` and `/mystery-school/enroll` respectively (task spec satisfied).

### Training School sequential lock
Files:
- `src/app/api/trainee/training/programs/route.ts:225-232` — fetches `training_settings.global_sequential_lock`, defaults to `false` (permissive).
- `src/app/api/trainee/training/lessons/[id]/route.ts:84-93` — fetches the same setting via `Promise.all`, also defaults to `false`.
- Both files compute their lock state from the **same** `globalLock` boolean. The lesson-detail route returns 403 when locked (lines 116, 152); the programs route surfaces `is_locked` metadata to the UI (line 295). The two cannot diverge.
- Migration `20260407000081_admin_training_global_sequential_lock.sql` adds the column with `DEFAULT false` and explicitly seeds the singleton row.

### Trigger → completion → graduation chain
Files:
- `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/answer/route.ts:161-185` — when a trigger answer is correct, counts `passed=true` rows in `lesson_trigger_progress`. When the count equals the total active trigger count for the lesson, calls `completeLessonAndProgressForUser`.
- `src/lib/training/completion.ts:1-56` — `completeLessonForUser` upserts `lesson_completions` (the authoritative store).
- `src/lib/training/graduation.ts:29-71` — `allLessonsComplete` reads ONLY from `lesson_completions`, not from quiz attempts or trigger progress.
- `checkAndAwardTrainingGraduation` (lines 79-151): idempotent via `.is("graduated_at", null)` guard, fires email + notification fire-and-forget.
- **No contradictory paths found.** Both the legacy quiz path and the trigger path funnel into the same `lesson_completions` table, and graduation reads from there.

### Multi-role user list merge
File: `src/app/admin/users/page.tsx:344-381`
- Builds `userMap` by `userId`. On collision: dedupes role slugs, keeps earliest `joinedAt`, prefers non-empty name/email/phone, ORs the `isCertified` flag, shallow-merges the `extra` object.
- Final `roleLabel` is the comma-joined role labels.
- Rendered in `user-management-client.tsx:1039-1041` as one badge per role.

### Community profile editor
File: `src/components/community/profile-form.tsx:25-65`
- Client component, uses the browser Supabase client to UPDATE `community_members` scoped by `eq("user_id", userId)`.
- Initially this looked risky (the `userId` prop is technically client-controllable). **Verified safe**: migration `20260403000011_new_roles.sql:94` defines `community_update_own` with `USING (auth.uid() = user_id)`, so even a forged `userId` would be rejected by RLS.
- Minor cleanup opportunity: the `userId` prop is redundant (the client could rely on `auth.uid()` server-side), but not a bug.

### Unsubscribe API (own work, re-checked)
File: `src/app/api/community/billing/unsubscribe/route.ts`
- Auth check, owner-scoped lookup, Stripe `cancel_at_period_end: true`, then writes `community_members.membership_status = 'cancelling'`.
- **Verified `'cancelling'` is allowed**: migration `20260406000032_perennial_emails.sql:21` extends the CHECK constraint to `('active', 'cancelling', 'paused', 'expired', 'cancelled')`. The webhook (`stripe/webhooks/route.ts:417`) writes the same status.

## What I did NOT verify line-by-line

These were verified by file presence + key-symbol grep only (per the previous shallow pass). They're lower-risk but flagged here for transparency:

- Calendar admin parity (pages exist, no end-to-end run)
- Holy books / doctrine links / sunday-service admin CMS (CRUD route presence only)
- Email sequences admin UI (route + page presence)
- Sidebar consolidation responsive behavior (no live test)
- Tarot/testimonial admin tables (file presence)

If you want any of these promoted to a deep read, point me at the task and I'll do it.

## Outstanding items

None classified as bugs. Non-blocking observations:

1. Dead `apiOnly` branch in `src/lib/supabase/middleware.ts:93-95` (cleanup-worthy).
2. `userId` prop in `community/profile-form.tsx` is redundant given RLS (cleanup-worthy).
3. Searchable timezone picker on `/dashboard/availability` is still a basic `Select` (UX polish, deferred per `calendar-module/availability-navigation-fix.md`).
