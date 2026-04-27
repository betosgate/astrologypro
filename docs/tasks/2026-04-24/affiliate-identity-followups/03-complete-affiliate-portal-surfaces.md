# Task 03 - Complete Affiliate Portal Surfaces - 2026-04-24

- Status: DEFERRED (2026-04-24) — no live demand, nothing broken
- Priority: ~~P1~~ (re-evaluate when a user-facing ask appears)
- Depends On: ~~Task 02~~ (Task 02 is obsolete)
- Blocks: ~~Task 04 sign-off~~

## Deferral Note (2026-04-24)

Audit on 2026-04-24 confirms nothing listed here is currently broken:

- The `/affiliate/earnings` page is a server component reading
  `affiliate_commissions` + `affiliate_payouts` directly from Supabase. It
  does NOT fetch `/api/affiliate/earnings`, so the missing endpoint causes
  no runtime error.
- Every portal page that fetches `/api/affiliate/*` hits an endpoint that
  exists today (`commissions`, `links`, `campaigns`, `partnerships`,
  `profile`, `me`, `accept`). No 404s.
- The 4 missing portal pages (`/payouts`, `/notifications`,
  `/settings/security`, `/partnerships/[junctionId]`) are not linked from
  any current navigation — users cannot reach them.

Building the 11 surfaces on spec would be pure "finish the plan" work. The
0a356268 commit (2026-04-24) already showed the team prefers shipping when
needed over chasing original-sprint completeness.

**Pick this up only when a real ask appears** (CSV export request, new nav
link, payout UI requirement, etc.). Re-audit at that time — the
pre-existing `/api/affiliate/*` surface may already be reusable, and this
task's file list will likely be partially wrong by then.

Original task content preserved below for historical context only.

---

## Problem

Task 05 from the 2026-04-23 sprint is only partially implemented. The portal exists, but several routes and APIs described as in-scope are still missing.

## Missing Surfaces Confirmed In Repo Audit

### Missing API routes

- `GET /api/affiliate/earnings`
- `GET /api/affiliate/earnings/export`
- `GET /api/affiliate/payouts`
- `PATCH /api/affiliate/notifications`
- `GET /api/affiliate/partnerships/[id]`
- `POST /api/affiliate/profile/avatar`
- `POST /api/affiliate/profile/tax-form`

### Missing portal pages

- `/affiliate/payouts`
- `/affiliate/notifications`
- `/affiliate/settings/security`
- `/affiliate/partnerships/[junctionId]`

## Required Outcome

Finish the missing Task 05 surfaces using the canonical affiliate identity model already in the repo.

## Rules

1. Every route must resolve the caller through `affiliate_accounts`.
2. Every per-partnership read must verify ownership by `affiliate_account_id = caller`.
3. Keep responses in RFC 9457 Problem+JSON shape on errors.
4. Do not introduce a second portal data model.

## Verification

- Missing routes exist and load for a valid active affiliate.
- Unauthorized or cross-account access is rejected.
- Multi-diviner affiliate sees partnership-specific detail and grouped payout data.
- Notification preferences persist on `affiliate_accounts.notification_prefs`.

## Suggested Files

- `src/app/api/affiliate/earnings/route.ts`
- `src/app/api/affiliate/earnings/export/route.ts`
- `src/app/api/affiliate/payouts/route.ts`
- `src/app/api/affiliate/notifications/route.ts`
- `src/app/api/affiliate/partnerships/[id]/route.ts`
- `src/app/api/affiliate/profile/avatar/route.ts`
- `src/app/api/affiliate/profile/tax-form/route.ts`
- `src/app/affiliate/(portal)/payouts/page.tsx`
- `src/app/affiliate/(portal)/notifications/page.tsx`
- `src/app/affiliate/(portal)/settings/security/page.tsx`
- `src/app/affiliate/(portal)/partnerships/[junctionId]/page.tsx`
