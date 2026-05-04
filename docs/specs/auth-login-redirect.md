# Auth Login Redirect — Living Spec

> **Status:** Authoritative requirements doc. Read this first before touching
> the post-login redirect resolver, role hierarchy, or any role-specific
> billing-gate destination.
>
> **Last updated:** 2026-05-04 (v1.0 — initial extraction; covers
> mystery-school resubscribe gate and /portal-fallback removal)
>
> **Owner:** product + engineering (update together on every scope change)

---

## How this doc stays current

**Every PR that changes login redirect behavior MUST update the relevant
section of this file in the same commit.** New role gates, hierarchy
re-orderings, fallback changes, billing-state predicates, saved-portal
short-circuit logic — all of it lands here.

The changelog section at the bottom is append-only. Add a dated entry on
every change, one line per concrete thing that moved.

If a future task re-reads this file and finds it contradicts the code, the
code is the source of truth for *what exists*; this doc is the source of
truth for *what the product should be*. Resolve the conflict by updating
the doc and/or the code — never leave the conflict open.

---

## 1 — Purpose & scope

When a user authenticates (magic link callback or password login), the
server resolves a single destination URL and redirects them there. The
resolver is the only place that decides "where does this user go after
login" — every other surface (the `/join` page, layout-level guards,
invite acceptance flows) calls into the same resolver to stay consistent.

**In scope for this spec:**
- Role hierarchy and priority ordering for dual-role users.
- Per-role active-state vs broken-billing destinations.
- Saved `last_portal_url` short-circuit and its known limitations.
- Orphan auth user (no role rows) fallback.
- Pending-contract gate (legal / TOS).

**Out of scope:**
- Authentication mechanics (magic link, password, OAuth) — covered by
  Supabase Auth conventions.
- Layout-level access guards inside each portal — those enforce
  per-page authorization, not redirect resolution.
- Invite acceptance flows — they call `getInvitedRoleDestination()` for
  invited-user redirects, but the predicate logic lives here.

---

## 2 — Authoritative implementation

| Concern | File |
|---|---|
| Resolver core | [src/lib/auth/resolve-login-destination.ts](../../src/lib/auth/resolve-login-destination.ts) |
| Invited-role destinations | [src/lib/invite-destinations.ts](../../src/lib/invite-destinations.ts) |
| MS billing predicate | [src/lib/mystery-school/access.ts](../../src/lib/mystery-school/access.ts) (`hasValidMysterySchoolBilling`) |
| Pending contract check | [src/lib/contract-orchestration.ts](../../src/lib/contract-orchestration.ts) (`getPendingContractDestination`) |
| Magic-link callback | `src/app/auth/callback/route.ts` |
| Password-login redirect | `src/app/api/auth/post-login-redirect/route.ts` |

The resolver is invoked from any of the above entry points and from
[src/app/join/page.tsx](../../src/app/join/page.tsx) (for already-authenticated
users hitting the join landing).

---

## 3 — Resolution order

The resolver runs these checks in order. The first one that returns a
non-null destination wins.

### 3.1 — Pending contract gate

If `getPendingContractDestination(userId)` returns a path, the user is
redirected there regardless of role. Used to force a TOS / contract
signature before any portal access. Admin users are exempt.

### 3.2 — Invited-diviner needs-plan gate (early)

If the user has a `diviners` row with `onboarding_completed=false` AND
`subscription_status !== 'active'`, redirect to `/join/diviner/plan`.
This early-gate fires *before* the saved `last_portal_url` short-circuit
so an invited diviner who already has a saved portal preference is still
forced through plan selection.

### 3.3 — Saved `last_portal_url`

If `user_portal_preferences.last_portal_url` is set and matches a trusted
portal base (the `VALID_PORTAL_BASES` allow-list), the user is redirected
there.

**Known gap:** the short-circuit does not validate that the user is
*still* eligible for the saved portal. A user who previously matched the
`client` hierarchy entry and got `/portal` saved as their preference
will still land on `/portal` even after their role state changes — e.g.,
even if they now have a `mystery_school_students` row with broken
billing that *should* route them to `/join/mystery-school/resubscribe`.
Mitigation: layout-level guards inside each portal re-check access on
every navigation and redirect when the user no longer qualifies. Long-
term fix would be to validate `last_portal_url` against current role
state inside the resolver before honoring it.

### 3.4 — Admin users

If the user is in `admin_users` AND has no saved `last_portal_url`,
redirect to `/admin`.

### 3.5 — Role hierarchy walk

The resolver fetches every role row in parallel and walks
`ROLE_HIERARCHY` in array order. The first entry whose `check()` returns
true provides the destination. Lower index = higher priority.

| # | Entry | Fires when | Destination |
|---|---|---|---|
| 1 | `diviner` | `diviners` row exists | `/dashboard`, or `/join/diviner/plan` when invited+unpaid, or `/onboarding` when not onboarded |
| 2 | `trainee` | `trainees` row exists | `/trainee`, or `/join/trainee/profile` when not onboarded |
| 3 | `social_advo` | `social_advocates` row exists | `/advocate`, or `/join/advocate` when not onboarded |
| 4 | `perennial_mandalism` | `community_members.membership_type='perennial_mandalism'` AND `membership_status='active'` | `/community`, or `/community/onboarding` when not onboarded |
| 5 | `mystery_school` | `mystery_school_students` row passes `hasActiveMysterySchoolAccess()` | `/mystery-school` |
| 6 | `perennial_mandalism_needs_resubscribe` | `community_members.membership_type='perennial_mandalism'` AND `membership_status !== 'active'` | `/join/community/resubscribe` |
| 7 | `mystery_school_needs_resubscribe` | `mystery_school_students` row exists AND does NOT pass `hasActiveMysterySchoolAccess()` | `/join/mystery-school/resubscribe` |
| 8 | `client` | `clients` row exists | `/portal` |

### 3.6 — Orphan-user fallback

If the hierarchy walk produces zero matches, redirect to `/onboarding`.
This is reserved for auth users with no role rows at all (rare, usually
the result of an interrupted signup flow).

**`/portal` must never be reached as a fallback.** It is the canonical
destination for actual clients (entry #8) and for *no other state*.

---

## 4 — Priority rules for dual-role users

The hierarchy is the same shape for both active-state matching and
broken-billing matching. Specifically:

- **Active priority:** PM > MS — a user with both an active PM
  membership and an active MS subscription lands on `/community`.
  They reach MS via the portal switcher.
- **Resubscribe priority:** PM > MS — a user with both a broken PM and
  a broken MS reactivates PM first. After PM resubscribes, on the next
  login, the resolver walks the hierarchy again and the user lands on
  `/community`. They can then resubscribe MS from inside the portal
  switcher / settings.

The resubscribe entries (#6, #7) are placed *between* the active-state
entries (#1–#5) and the `client` entry (#8), so a user with a `clients`
row plus a broken MS or PM subscription is routed to resubscribe rather
than dropped into `/portal`.

---

## 5 — Active-access predicates

### 5.1 — `hasActiveMysterySchoolAccess(student)`

Returns true when:

- `hasValidMysterySchoolBilling(student)` is true (has Stripe sub, paid
  the one-time fee, and the fee amount is recorded as a number), **AND**
- `student.status === 'active'`, **OR**
- `student.status === 'cancelled'` AND `student.access_expires_at` is in
  the future.

Used by both the `mystery_school` (#5) and
`mystery_school_needs_resubscribe` (#7) entries — #7 fires when this
returns false on an existing row.

### 5.2 — `needsInvitedDivinerPlan(diviner)`

Returns true when the diviner row exists, has
`onboarding_completed=false`, and `subscription_status !== 'active'`.
Used by the early-gate (3.2) and inside the diviner hierarchy entry's
destination function.

---

## 6 — Invited-user destinations

`getInvitedRoleDestination(role)` overrides the destination when the
auth user has `invited_by_admin = true` in their JWT metadata. It maps
each role to its invite-acceptance landing page (e.g.
`/join/mystery-school?invited=true`).

The default branch returns `/onboarding`, **never `/portal`**. The
explicit `client` branch returns `/portal` (correct — invited clients
go to the client portal).

---

## 7 — Layout-level guards

After the resolver redirects, each portal layout enforces its own
access check:

- `/mystery-school/layout.tsx` calls `requireMysterySchoolAccess()`. If
  it returns null:
  - If `mystery_school_students.status` is in
    `['cancelled', 'paused', 'expired']` → render the
    `SubscriptionExpiredView` with `resubscribeHref` pointing to
    `/join/mystery-school/resubscribe`.
  - Else if any row exists at all → redirect to
    `/join/mystery-school/resubscribe`.
  - Else (no row) → redirect to `/join/mystery-school` (first-time
    enrollment).

This second-line defence catches the saved-portal short-circuit gap
described in 3.3 — even if the resolver routed the user to
`/mystery-school` via a stale preference, the layout still gates on
real access state.

---

## 8 — Resubscribe finalize behavior

When a user resubscribes, the same `/api/community/checkout` endpoint
creates the Stripe Checkout Session, but with `metadata.resubscribe = "true"`.
After payment, `finalizeMysterySchoolCheckoutSession` branches on this
metadata:

- **First-time path:** upserts the full row including `enrolled_at`,
  `enrollment_date`, `training_status='foundation'`,
  `entry_quarter`/`entry_year`, and the one-time fee derived from
  `session.amount_total`.
- **Resubscribe path:** UPDATEs only `stripe_subscription_id`,
  `status='active'`, `paused_at=null`, `cancelled_at=null`,
  `access_expires_at=null`. Preserves the original enrollment date,
  training progress, original cohort, and the original one-time fee
  amount.

The MS resubscribe page also signals the checkout endpoint to skip the
one-time `$97` enrollment line item — the user pays only the recurring
subscription on reactivation.

PM resubscribe uses a separate endpoint (`/api/community/resubscribe-finalize`)
because PM doesn't have the same row-preservation requirements (no
training-progress field, no entry cohort).

---

## 9 — Discount alignment (price display vs charged)

The MS PM-discount flag (`platform_settings.ms_pm_discount_enabled`) is
read in five places. All five default to `false` when the flag is null
or the row is missing — meaning when an admin has not explicitly enabled
the discount, the standard MS plan is shown and charged.

Read sites:

- `/api/community/settings` (the page-side endpoint)
- `/api/community/checkout` (server-side Stripe line-item picker)
- `/app/community/page.tsx` (server-render direct DB read)
- `/components/mystery-school/enrollment-flow.tsx` (first-time enrollment)
- `/app/join/mystery-school/resubscribe/page.tsx` (resubscribe)

If you add a new read site, default to `false` to preserve the
display-equals-charge invariant.

---

## 10 — Changelog

- **2026-05-04** — Initial extraction. Documents the post-fix-cf53cde2
  hierarchy with the new MS resubscribe gate (entry #7),
  PM-resubscribe moved above `client`, `/portal`-as-fallback removed
  (now `/onboarding`), `invite-destinations` default → `/onboarding`,
  layout-level row-exists branch sending broken-billing users to MS
  resubscribe, MS-discount default aligned across all consumers
  (`?? false`).
