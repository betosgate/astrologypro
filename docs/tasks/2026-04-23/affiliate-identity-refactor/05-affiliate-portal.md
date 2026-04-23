# Task 05 — Affiliate Portal

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: 01, 03, 06
- Blocks: —

## Goal

Rehabilitate the broken `/affiliate/*` portal so affiliates can log in and see every diviner they partner with, their consolidated earnings, per-diviner commissions and payouts, referral links, and a canonical profile editor. Add the `affiliate` role to `getUserPortals()` so multi-role users reach the portal from the switch page.

## Current State — important

**The portal partially exists already as dead scaffolding.** It's not a greenfield build.

| File | Current state | Action |
|---|---|---|
| [src/app/affiliate/layout.tsx](../../../../src/app/affiliate/layout.tsx) | Exists — nav with Dashboard, Campaigns, Links, Commissions. Client-only (auth check deferred to pages). | Update nav; add SSR auth + role resolution. |
| [src/app/affiliate/dashboard/page.tsx](../../../../src/app/affiliate/dashboard/page.tsx) | Exists. Broken — queries `diviner_affiliates.user_id` which is 0/14 populated. Always shows "Not registered as an affiliate." | **Fix:** query `affiliate_accounts` by `user_id`, then join junctions. |
| [src/app/affiliate/campaigns/page.tsx](../../../../src/app/affiliate/campaigns/page.tsx) | Exists. May read stale identity fields. | Audit; join canonical. |
| [src/app/affiliate/commissions/page.tsx](../../../../src/app/affiliate/commissions/page.tsx) | Exists. | Audit; join canonical. |
| [src/app/affiliate/earnings/page.tsx](../../../../src/app/affiliate/earnings/page.tsx) | Exists. **Reads DEAD schema** — queries `affiliates`, `commission_ledger_entries`, `affiliate_payout_records` (all either wrong-table or empty). | Rewrite to read the live schema: `affiliate_commissions` + `affiliate_payouts` via canonical join. |
| [src/app/affiliate/links/page.tsx](../../../../src/app/affiliate/links/page.tsx) | Exists. | Audit; join canonical. |
| [src/app/affiliate/[code]/page.tsx](../../../../src/app/affiliate/[code]/page.tsx) | Exists. Legacy per-referral-code public landing. | **Untouched** — out of scope; reads legacy `affiliates` table. |

No `/affiliate/login`, no `/affiliate/profile`, no `/affiliate/partnerships`, no `/affiliate/payouts`, no `/affiliate/notifications`, no `/affiliate/settings` exist. Add them in this task.

Other plumbing:

- Role resolver: [src/lib/user-roles.ts](../../../../src/lib/user-roles.ts) `getUserPortals()`. Currently checks `diviners`, `clients`, `social_advocates`, `community_members`, `mystery_school_students`, `trainees`. **Does NOT include affiliate accounts.** Add.
- Middleware: [src/proxy.ts](../../../../src/proxy.ts). No `/affiliate/*` guards today.
- Switch page: [src/app/switch/page.tsx](../../../../src/app/switch/page.tsx) reads `getUserPortals()`, renders tiles per portal. ICONS map in the file needs an `affiliate` entry.

## Target Behavior

### Routes

Public:

- `/login` — **reuse the generic app login** (matches existing pattern — `/dashboard`, `/advocate`, `/portal` all do this). Do NOT create a separate `/affiliate/login` page. Login handler redirects based on role: if the signed-in user has an active `affiliate_accounts` row and no other portals, redirect to `/affiliate`; if multiple, redirect to `/switch`. This keeps the auth surface small and matches convention.
- `/affiliate/accept/[token]` — **built in Task 03.**
- `/affiliate/[code]` — existing, untouched.

Authed (affiliate role required):

- `/affiliate` — dashboard (rehab).
- `/affiliate/dashboard` — existing file; alias to `/affiliate` or keep, decide based on existing nav.
- `/affiliate/partnerships` — full list of diviner partnerships with status, commission, joined date.
- `/affiliate/partnerships/[junctionId]` — per-partnership detail.
- `/affiliate/earnings` — rewrite to live schema.
- `/affiliate/links` — all referral links across all diviners.
- `/affiliate/commissions` — commissions ledger.
- `/affiliate/campaigns` — existing affiliate-owned campaigns view; identity read fixed.
- `/affiliate/payouts` — payout history grouped by diviner (D1 — per-diviner).
- `/affiliate/profile` — edit canonical profile (name, phone, avatar, timezone, payout method, tax form).
- `/affiliate/notifications` — notification preferences (`affiliate_accounts.notification_prefs`).
- `/affiliate/settings/security` — change password; sessions list.

### Auth / role resolution

After login:

- Server resolves `affiliate_accounts` where `user_id = session.user.id`.
- If not found or `status='unclaimed'` → `/affiliate/login?e=no_account` with explanatory copy + link to help.
- If `status='suspended'` or `status='blocked'` → error page, no portal access, link to support.
- If `status='active'` → portal.

### Middleware (in `src/proxy.ts`)

Protect `/affiliate/*` (except `/login` and `/accept/*`):

```ts
// Pseudocode — match repo's existing middleware pattern
if (path.startsWith('/affiliate')
    && !path.startsWith('/affiliate/login')
    && !path.startsWith('/affiliate/accept/')
    && !path.match(/^\/affiliate\/[^/]+$/) /* /affiliate/[code] public */) {
  const { user } = await getSession(req);
  if (!user) return redirect('/affiliate/login');
  const { data: account } = await admin
    .from('affiliate_accounts').select('status').eq('user_id', user.id).maybeSingle();
  if (!account || account.status !== 'active') return redirect('/affiliate/login?e=no_access');
}
```

Use the existing `updateSession` helper from [src/lib/supabase/middleware.ts](../../../../src/lib/supabase/middleware.ts); do not invent a new session helper.

### `getUserPortals()` update

Add an affiliate check. Parallel to the existing queries:

```ts
const affiliate = await supabase
  .from('affiliate_accounts')
  .select('id, status')
  .eq('user_id', userId)
  .maybeSingle();

// inside the role-to-portal loop
if (affiliate.data && affiliate.data.status === 'active') {
  portals.push({ role: 'affiliate', label: 'Affiliate Portal', href: '/affiliate' });
}
```

Add `affiliate: Handshake` (or similar lucide icon) to the ICONS map on [src/app/switch/page.tsx](../../../../src/app/switch/page.tsx).

### Layout update

[src/app/affiliate/layout.tsx](../../../../src/app/affiliate/layout.tsx) today is client-only. Convert to server component that:

1. Fetches the session + canonical account.
2. Passes to a client sidebar/header.
3. Includes the `PortalSwitcher` (existing shared component) so multi-role users can jump portals.

Final nav (client component):

- Dashboard
- Partnerships
- Earnings
- Commissions
- Links
- Campaigns
- Payouts
- Profile
- Settings (dropdown: Security, Notifications)

### Dashboard (`/affiliate`)

Sections:

1. **Hero KPIs** (4 cards):
   - Lifetime commissions (approved + paid, total cents).
   - Pending commissions (approved, not yet paid).
   - Partnership count (total / active split).
   - Last-30-days conversions.
2. **Active Partnerships** — compact list (max 6), see-all link.
3. **Recent Commissions** — last 10 rows across diviners.
4. **Action needed** banner:
   - Tax form not collected.
   - Payout method missing when pending balance > 0.
   - Suspended partnerships.

### Earnings (`/affiliate/earnings`) — full rewrite

The current file reads `affiliates`, `commission_ledger_entries`, `affiliate_payout_records` (all wrong). Replace with:

- Source: `affiliate_commissions` (joined on `diviner_affiliates` → `affiliate_accounts` for ownership) + `affiliate_payouts`.
- Rolling monthly totals by diviner.
- Filters: date range, diviner, commission status.
- CSV export scoped to `affiliate_account_id = caller`.

### Partnerships (`/affiliate/partnerships`)

- List all `diviner_affiliates` rows where `affiliate_account_id = caller's account id`.
- Columns: diviner name + avatar, joined date, commission (with type), status, earnings-to-date.
- Row click → `/affiliate/partnerships/[junctionId]`.

Per-partnership detail shows: commissions ledger, referral links (from `affiliate_referral_links`), clicks / conversions, per-diviner payout history.

### Links (`/affiliate/links`)

- All `affiliate_referral_links` for junctions where `affiliate_account_id = caller`.
- Grouped by diviner.
- Columns: slug, product type, clicks, conversions, CVR, created date.
- Copy-to-clipboard.
- No create/edit — links are generated by diviner invite / assignment flows. Self-serve link creation is out of scope.

### Payouts (`/affiliate/payouts`)

- Read-only, grouped by diviner.
- Each row: amount, method, reference, proof_url, paid_at.
- Link to the per-partnership view.

### Profile (`/affiliate/profile`)

- Editable fields (on `affiliate_accounts`): name, phone, avatar_url, timezone, payout_method, payout_details (JSONB), tax_form_status, tax_form_url.
- Email is read-only (tied to auth; separate flow if it ever needs to change).
- PATCH to `/api/affiliate/profile`. RLS allows self-update.
- Validation: phone format, avatar ≤ 2MB, allowlist image types.

### Notifications (`/affiliate/notifications`)

- Email preferences (per category: invite accepted, commission approved, payout sent, monthly summary).
- Writes to `affiliate_accounts.notification_prefs` (JSONB).

## APIs (all under `/api/affiliate/*`)

Auth enforced on every endpoint:

- Resolve canonical account from `session.user.id`.
- 403 if no active account.
- Object-level authorization — every query WHERE-clauses on `affiliate_account_id = caller's id`. Never trust path-param IDs.
- RFC 9457 Problem+JSON on error.

Endpoints:

| Method/Path | Purpose |
|---|---|
| `GET /api/affiliate/me` | Current canonical account + summary. |
| `GET /api/affiliate/partnerships` | Paginated list of junctions for caller. |
| `GET /api/affiliate/partnerships/[id]` | Per-partnership detail (verify junction belongs to caller). |
| `GET /api/affiliate/commissions` | Paginated commissions across partnerships. |
| `GET /api/affiliate/earnings` | Aggregate for earnings page. |
| `GET /api/affiliate/earnings/export` | CSV stream. |
| `GET /api/affiliate/links` | Caller's referral links. |
| `GET /api/affiliate/payouts` | Per-diviner grouped. |
| `PATCH /api/affiliate/profile` | Update name, phone, avatar_url, timezone, payout_*. |
| `POST /api/affiliate/profile/avatar` | Signed-URL upload. |
| `POST /api/affiliate/profile/tax-form` | Signed-URL upload — allowlist PDF; size cap. |
| `PATCH /api/affiliate/notifications` | Update `notification_prefs` JSONB. |

**Note:** These routes overlap conceptually with the existing `/api/affiliate/dashboard`, `/api/affiliate/campaigns`, `/api/affiliate/commissions`, `/api/affiliate/links` (already in repo — all broken, reading dead schema). Task 06 audits these in detail; this task either rewrites them in place or adds new ones. Prefer rewriting in place where the route name matches.

## Implementation Steps

### 1. Small additive migration (if not already in Task 01)

Task 01 ships `affiliate_accounts.notification_prefs` already. No further migration needed here.

### 2. Role registration

- Update `getUserPortals()` in [src/lib/user-roles.ts](../../../../src/lib/user-roles.ts).
- Update ICONS map + metadata in [src/app/switch/page.tsx](../../../../src/app/switch/page.tsx).

### 3. Middleware

Add `/affiliate/*` guard block in [src/proxy.ts](../../../../src/proxy.ts). Match repo's existing `updateSession` usage.

### 4. Layout rework

Rewrite [src/app/affiliate/layout.tsx](../../../../src/app/affiliate/layout.tsx) as a server component; pass account to a client header.

### 5. Fix broken pages

- `dashboard/page.tsx` — query `affiliate_accounts` by `user_id`, fetch junctions with the `DIVINER_AFFILIATE_WITH_ACCOUNT_SELECT` constant from Task 01.
- `earnings/page.tsx` — full rewrite against live schema.
- `campaigns/page.tsx`, `commissions/page.tsx`, `links/page.tsx` — identity-read swap.
- `[code]/page.tsx` — untouched.

### 6. Add new pages

- `partnerships/page.tsx` + `[id]/page.tsx`
- `payouts/page.tsx`
- `profile/page.tsx`
- `notifications/page.tsx`
- `settings/security/page.tsx`

(No `login/page.tsx` — see § 8 below; reuse generic `/login`.)

### 7. Add new APIs

Under `/api/affiliate/*`. See table above.

### 8. Login — reuse generic `/login` (replaces earlier draft that proposed a dedicated affiliate login)

See the Routes § Public block above for the canonical decision: reuse `/login`; update the post-auth redirect handler to route to `/affiliate` (or `/switch` if multi-portal) based on `getUserPortals()`. Do NOT create `src/app/affiliate/login/page.tsx`.

### 9. Feature flag

See § 9 under Implementation Steps above — `isAffiliateIdentityV2Enabled()` registered in `src/lib/feature-flags.ts`.

### 10. Emails (reuse existing senders)

Add:

- `sendAffiliateWelcome` — first login after accept.
- `sendAffiliateCommissionApproved` — on commission `pending → approved`.
- `sendAffiliatePayoutPaid` — on payout insert touching one of caller's junctions.

All respect `notification_prefs`.

### 11. Observability

OpenTelemetry traces:

- `affiliate.dashboard.load`
- `affiliate.commissions.query`
- `affiliate.profile.update`

## Verification Plan

### A. Happy-path E2E

Seeded `affiliate-multi@test.astrologypro.com` (from Task 07) partners with 3 diviners.

1. Log in at `/affiliate/login`. Expect `/affiliate` dashboard.
2. 4 KPI cards render with seed numbers.
3. `/affiliate/partnerships` shows 3 rows.
4. Click into one → partnership detail page loads.
5. `/affiliate/earnings` renders consolidated table.
6. `/affiliate/payouts` renders grouped payouts.
7. `/affiliate/profile` — edit name → save → toast → refresh persists.
8. Sign out → sign back in → state preserved.

### B. Auth + authorization

1. Affiliate A hits `/api/affiliate/partnerships/<affiliate B's junction id>` → 404 (don't leak existence with 403).
2. Affiliate hits `/api/affiliate/commissions?affiliate_account_id=<other>` → param ignored; caller sees only own.
3. Diviner hits `/api/affiliate/*` → 403.
4. Client hits `/api/affiliate/*` → 403.
5. Unauthenticated on `/affiliate/*` (except login + accept + [code]) → redirect to `/affiliate/login`.

### C. Accessibility

Lighthouse ≥ 95 on `/affiliate`, `/affiliate/partnerships`, `/affiliate/profile`. axe-playwright 0 critical/serious.

### D. Performance

- LCP < 2.5s on `/affiliate` with 3 partnerships + ~50 commissions.
- INP < 200ms on nav.
- `GET /api/affiliate/earnings` p95 < 500ms on seed data.
- `EXPLAIN ANALYZE` the earnings aggregation; add indexes if needed.

### E. File upload

- 2MB JPG → accepted, avatar renders.
- 3MB ZIP → 415.
- 10MB JPG → 413.
- PDF tax form → accepted; run existing virus-scan stub if present.

### F. Portal switch

Multi-role user (`diviner + affiliate`, seeded in Task 07) lands on `/switch` with an Affiliate tile. Clicking takes them to `/affiliate`.

## Edge Cases

1. **Affiliate with zero partnerships.** Empty state — instructions to request an invite.
2. **One suspended partnership** — dashboard banner; earnings still include historical.
3. **All partnerships suspended** — portal still accessible (account `active`); banner explains.
4. **Affiliate deletes avatar** — allowed; fallback to initials.
5. **Invalid phone format** → 422.
6. **Affiliate tries to change email** — field disabled with copy: "Email changes require support."
7. **Session expires mid-edit** — 401; client redirects to login preserving draft in sessionStorage.
8. **Rate-limit on CSV export** — 3 / 10 min per affiliate; 429 with `Retry-After`.
9. **Multi-role user is both diviner and affiliate** — `getUserPortals` returns both tiles. No UI conflict because each portal is independent. Covered in the portal-switch E2E.

## Out of Scope

- Mobile app.
- Affiliate-to-affiliate chat.
- In-portal payout initiation (D1 — per-diviner, diviner-initiated).
- OAuth / magic-link sign-in.
- 2FA (separate hardening story).
- i18n.
- Admin impersonation.
- Changes to `/advocate/*` or `social_advocates` (different identity).
- Changing `/affiliate/[code]` public landing.

## Rollback Plan

- Remove new routes (or hide behind `AFFILIATE_IDENTITY_V2=OFF`).
- Revert middleware guard.
- Revert `getUserPortals()` change.
- Revert switch-page tile.
- Broken scaffolding returns to its pre-sprint state (already broken; no user-visible regression).
- Drop `notification_prefs` column in a follow-up if it proves unused.
