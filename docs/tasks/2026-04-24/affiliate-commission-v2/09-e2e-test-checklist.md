# Affiliate Commission v2 — End-to-End Test Checklist

**Use this checklist before the v2 affiliate sprint can be signed off.**
Each section maps to a deliverable that shipped in Deliveries 1-4 +
cleanup passes. Tick every box; treat any failure as a sprint blocker.

References:
- Spec: [docs/specs/affiliate-commission-system.md](../../../specs/affiliate-commission-system.md)
- Sprint master: [00-master-task.md](./00-master-task.md)

---

## 0 — Pre-test setup

### 0.1 Test accounts

- [ ] **Admin** — user with row in `admin_users`. Verify
      `getAdminUser()` returns non-null.
- [ ] **Diviner A** — diviner with `display_name`, `username`,
      `affiliate_partnership_terms_accepted_at` SET (so invites are
      enabled). Has at least 2 active services.
- [ ] **Diviner B** — second diviner used for cross-diviner isolation
      checks. At least 1 active service.
- [ ] **Affiliate 1 (multi-junction)** — `affiliate_accounts.status='active'`,
      partnered with both Diviner A and Diviner B. Used to verify caller's-
      slice scoping in reports.
- [ ] **Affiliate 2** — partnered only with Diviner A.
- [ ] **Unclaimed affiliate** — invited but not yet accepted
      (`status='unclaimed'`).
- [ ] **Blocked affiliate** — `status='blocked'`. Used to verify the
      portal account-gate and webhook fraud gate (Flow F step 3).
- [ ] **Customer** — auth user with payment method, used to make
      bookings.

### 0.2 Test data fixtures

- [ ] At least 1 active assignment per affiliate per diviner
      (mix of PROFILE + SERVICE scope).
- [ ] At least 1 affiliate-owned campaign per assignment for Affiliate 1
      and Affiliate 2.
- [ ] At least 1 diviner-owned promo campaign for Diviner A.
- [ ] At least 5 historical `campaign_conversions` rows spread across
      campaigns + affiliates, with mix of `reversed_at` set/null.
- [ ] At least 2 historical `diviner_service_affiliate_rate_history`
      rows so the audit timelines have content.

### 0.3 Environment

- [ ] Migrations `20260424000010_affiliate_commission_v2_additive.sql`
      and `20260424009001_affiliate_commission_v2_destructive.sql` are
      both applied. Verify dropped tables are gone:
      `SELECT to_regclass('affiliate_commissions')` returns NULL, same
      for `affiliate_referral_links`, `affiliate_clicks`,
      `affiliate_payouts`, `affiliate_payout_items`,
      `affiliate_commission_history`.
- [ ] `affiliate_accounts.status` CHECK enforces (`unclaimed`, `active`,
      `blocked`) only.
- [ ] `affiliate_campaigns.status` CHECK enforces (`active`, `paused`,
      `archived`, `expired`) only.
- [ ] Cron entry for daily digest is present in `vercel.json`:
      `{ "path": "/api/cron/affiliate-conversion-digest", "schedule": "0 0 * * *" }`.

---

## 1 — Authentication & authorization (per-role gating)

### 1.1 Admin surfaces

- [ ] Logged out → `/admin/reports/affiliates` redirects to login.
- [ ] Diviner-only user → `/admin/reports/affiliates*` returns 403 (or
      whatever the admin-shell's redirect is). Repeat for every sub-tab.
- [ ] Direct API hits without admin context return 403:
      - `GET /api/admin/reports/affiliates/overview`
      - `GET /api/admin/reports/affiliates/by-diviner`
      - `GET /api/admin/reports/affiliates/by-affiliate`
      - `GET /api/admin/reports/affiliates/clicks`
      - `GET /api/admin/reports/affiliates/conversions`
      - `GET /api/admin/reports/affiliates/rate-history`
      - `POST /api/admin/conversions/<id>/reverse`
      - `POST /api/admin/affiliate-assignments/<id>/revoke`
      - `POST /api/admin/affiliate-campaigns/<id>/archive`

### 1.2 Diviner surfaces

- [ ] Logged out → `/dashboard/affiliates` redirects to login.
- [ ] Customer (non-diviner) → `/dashboard/*` returns 403/redirect.
- [ ] Diviner A cannot see Diviner B's data on any
      `/api/dashboard/affiliate-reports/*` endpoint (verify with
      Diviner-B–scoped fixture IDs in the response).

### 1.3 Affiliate surfaces

- [ ] Logged out → `/affiliate` redirects to `/login?next=/affiliate`.
- [ ] Diviner-only user (no affiliate account) → portal shows
      "no_affiliate_account" gate (redirected via
      `/login?e=no_affiliate_account`).
- [ ] **Blocked affiliate** logs in → portal shows the read-only
      AccountGateShell with "Your affiliate account is currently blocked."
      Nav links don't render.
- [ ] **Unclaimed affiliate** logs in → portal shows the gate with the
      "open invite link" message.
- [ ] Affiliate 2 cannot see Affiliate 1's data on any
      `/api/affiliate/reports/*` endpoint.

---

## 2 — Diviner flow: landing pages & services

### 2.1 Public diviner landing

- [ ] `/<diviner_username>` renders Diviner A's profile (server-rendered,
      LCP visible without JS).
- [ ] Service cards link to `/<username>/services/<slug>`.
- [ ] Page renders correctly when accessed via `?ref=<campaign_code>`
      (no UI break; `ref_code` carries through to checkout).
- [ ] Page renders for a paused campaign code → same content (the
      campaign gate happens at `/r/<code>`, not on the landing page).

### 2.2 Service landing

- [ ] `/<username>/services/<slug>` renders correct service.
- [ ] Booking CTA carries `?ref=<campaign_code>` through to the booking
      form.

---

## 3 — Diviner flow: affiliate management (Flow A, G, H)

### 3.1 Invitation lifecycle

- [ ] Diviner A → `/dashboard/affiliates` → "Invite Affiliate" dialog
      opens. With agreement signed, button is enabled.
- [ ] Submit invite for new email → toast confirms send. Row appears
      with status="pending", "Invited" timestamp visible.
- [ ] Email lands in test inbox (verify SES delivery + accept link).
- [ ] Click "Resend" on a pending row → fresh token, `resent_count`
      increments.
- [ ] Click "Revoke" on a pending row with no commission history →
      junction deleted, row disappears.
- [ ] Click "Revoke" on a junction WITH prior commission history →
      junction `status='suspended'`, row stays visible with the new
      status. (Toast says "Partnership moved to Suspended (had
      commission history).")
- [ ] **Without agreement signed** → "Invite Affiliate" button shows
      disabled with the agreement-gate banner. Banner has a working
      link to `/dashboard/account/affiliate-agreement`.

### 3.2 Assign affiliate (Flow A)

- [ ] Diviner → `/dashboard/affiliates/new` → form lists ONLY active
      partnerships in the affiliate dropdown. Pending/blocked
      partnerships are filtered out.
- [ ] Empty-state copy renders when there are no active partnerships
      ("Invite an affiliate" CTA visible).
- [ ] Pick PROFILE scope → no service dropdown shown. Submit succeeds
      with `destination_id=null`.
- [ ] Pick SERVICE scope → service dropdown enabled, picking one is
      required. Submitting without a service errors.
- [ ] Submit `commission_type=percent`, value=10 → row created in
      `diviner_service_affiliates` with `is_active=true`,
      `assigned_by=auth.uid()`.
- [ ] Submit `commission_type=flat`, value=500 (cents) → success.
- [ ] Submit `percent` with value=150 → 422 validation error.
- [ ] Submit with negative value → 422.
- [ ] After success → redirected to
      `/dashboard/affiliates/<junctionId>` and the new assignment
      appears in the Assignments card.
- [ ] Affiliate receives `affiliate.assigned` notification (in-app +
      email).

### 3.3 Per-affiliate detail page

- [ ] Diviner → `/dashboard/affiliates/<id>` shows:
  - [ ] Identity card (name, email, avatar, "Claimed/Unclaimed" badge,
        partnership_count if multi-junction).
  - [ ] KPI tiles: clicks, conversions, earned, reversed — bound to the
        period selector.
  - [ ] Assignments card with rows showing destination, current rate,
        assigned_at, active/revoked badge.
  - [ ] Rate history card (reverse chronological).
  - [ ] Recent conversions card scoped to caller's slice.
- [ ] Period selector toggles between 30d / 90d / 1y / all → values
      update on each change.
- [ ] **Multi-junction affiliate** → page shows ONLY conversions tied to
      Diviner A's campaigns (Affiliate 1's slice with Diviner B is
      hidden).
- [ ] Pending invitation card renders with Resend / Revoke buttons.
- [ ] No "Record Payout" button visible (deleted).
- [ ] No "Generate Link" / "Referral Links" UI (deleted — affiliates
      generate their own campaigns).

### 3.4 Edit assignment rate (Flow G)

- [ ] Diviner → `/dashboard/affiliates/assignments/<id>` (or detail
      panel) → edit rate from 10% → 15%.
- [ ] After save:
  - [ ] `diviner_service_affiliates.commission_value` = 15.
  - [ ] New row in `diviner_service_affiliate_rate_history`
        (old=10, new=15, changed_by=auth.uid()).
  - [ ] Affiliate receives `affiliate.rate_changed` notification
        (in-app + email, immediate, NOT digested).
- [ ] **Flow G semantics — critical:**
  - [ ] Existing booking made BEFORE the edit, not yet paid → when its
        webhook fires, `commission_amount_cents` is computed from the
        STAMPED rate (10%), not the new rate (15%).
  - [ ] New booking made AFTER the edit gets stamp `commission_rate_value_stamp=15`.
  - [ ] Existing `campaign_conversions` rows are untouched.

### 3.5 Revoke assignment (Flow H)

- [ ] Diviner revokes assignment → `is_active=false`, `revoked_at` set.
- [ ] Auto-pause trigger fires: every `affiliate_campaigns` row with
      `source_assignment_id` = this assignment gets `status='paused'`.
- [ ] `/r/<code>` for an affected campaign now returns the "link no
      longer active" page (HTTP 410, branded, static).
- [ ] No click is logged for the now-dead campaign.
- [ ] New booking via dead campaign → no rate stamp on booking.
- [ ] Booking already stamped pre-revoke → still pays out at the
      stamped rate (revocation does not claw back).
- [ ] Affiliate receives `affiliate.revoked` notification.

---

## 4 — Diviner flow: own campaigns (Flow B)

- [ ] Diviner → `/dashboard/campaigns` → list shows their own promo
      campaigns (`owner_type='diviner'`, `diviner_id=me`).
- [ ] Other diviners' campaigns are NOT visible.
- [ ] Click "New campaign" → form. Select destination (profile or
      service), name, optional UTMs.
- [ ] Submit → row in `affiliate_campaigns` with `owner_type='diviner'`,
      auto-generated `campaign_code`, matching `tracking_links` row.
- [ ] **No commission credited on conversions through this campaign** —
      verify by booking + paying through the diviner-owned campaign and
      confirming no `campaign_conversions` row is written.
- [ ] Status transitions: active → paused → active → archived. Verify
      `/r/<code>` resolves only when status='active'; returns 410 for
      paused/archived.
- [ ] Try `status='draft'` or `status='completed'` via direct API call
      → 422 (those values were trimmed in 01b destructive).
- [ ] Per-campaign analytics page (`/dashboard/campaigns/[id]/analytics`)
      shows daily clicks, by-device, by-country, etc.

---

## 5 — Diviner flow: notifications

- [ ] `/dashboard/notifications` shows the diviner's inbox via
      `notifications WHERE user_id = me` (RLS-enforced via auth client).
- [ ] Unread rows have the "New" badge + primary border accent.
- [ ] On mount, `MarkReadOnMount` POSTs to
      `/api/dashboard/notifications/mark-read`. After response,
      `router.refresh()` re-fetches and badges disappear.
- [ ] Empty inbox → empty-state card.
- [ ] Notifications with `action_url` are clickable; without are not.
- [ ] Sidebar nav has "Notifications" entry; mobile-nav has it too.
- [ ] Diviner receives `admin.override.assignment_revoked` when admin
      force-revokes one of their assignments (verify via Section 8.1).
- [ ] Diviner receives `admin.override.campaign_archived` when admin
      force-archives a campaign tied to one of their assignments
      (verify via Section 8.2).

---

## 6 — Affiliate flow: accept invitation, navigate portal

### 6.1 Accept invitation

- [ ] **New user**: open invite link → signup page pre-fills email →
      after signup, accept-flow RPC links `affiliate_accounts.user_id` to
      the new auth user. `status` flips to `active`.
- [ ] **Existing user**: open invite link while logged in → accept-flow
      RPC links the existing auth user to the existing
      affiliate_accounts row.
- [ ] After accept → portal landing at `/affiliate` works.
- [ ] Junction `status='pending'` → `'active'`, `accepted_at` set.

### 6.2 Portal navigation

- [ ] `/affiliate` (Dashboard): KPI tiles (clicks, conversions, earned).
- [ ] `/affiliate/partnerships`: card per partnership with status,
      commission, period earnings.
- [ ] `/affiliate/products`: grid of active assignments. Each card has
      "Create campaign" CTA.
- [ ] `/affiliate/campaigns`: list of OWNED campaigns
      (`owner_affiliate_id IN junction_ids` AND
      `owner_affiliate_type='diviner_affiliate'`). KPI tiles + per-row
      clicks/conversions/earned.
- [ ] `/affiliate/campaigns/new`: form. Auto-prefills the assignment if
      arrived from `/affiliate/products`.
- [ ] `/affiliate/campaigns/<id>`: detail with KPIs, share URL with
      copy button, recent conversions, Archive button.
- [ ] `/affiliate/earnings`: total earned, conversions list. No "Total
      Paid" / "Pending Balance" rows (System A removed).
- [ ] `/affiliate/rate-history`: read-only list grouped by assignment.
- [ ] `/affiliate/notifications`: inbox + Preferences link.
- [ ] `/affiliate/notifications/preferences`: 7 cards with in-app +
      email switches per kind.
- [ ] `/affiliate/profile`: name, email, payout details fields.
- [ ] **Removed nav entries verified absent**: NO "Commissions" link,
      NO "Links" link in the header.
- [ ] Active-tab highlighting (`aria-current="page"`) works on every
      route.

### 6.3 Create affiliate campaign (Flow C)

- [ ] From `/affiliate/products` → "Create campaign" on a card →
      `/affiliate/campaigns/new` with the assignment pre-selected.
- [ ] Submit name only → success. Server creates campaign with:
  - [ ] `owner_type='affiliate'`
  - [ ] `owner_affiliate_id` = junction id (NOT account id)
  - [ ] `owner_affiliate_type='diviner_affiliate'`
  - [ ] `source_assignment_id` = the assignment id
  - [ ] `diviner_id` = assignment's diviner_id
  - [ ] `destination_*` copied from assignment
  - [ ] `status='active'`
  - [ ] `campaign_code` auto-generated, unique, ≤12 chars
- [ ] After success → redirected to `/affiliate/campaigns/<id>`.
- [ ] Tracking link row exists at `tracking_links` for this campaign.
- [ ] Try to create a campaign for an assignment NOT owned by caller
      (forge `assignment_id` in body) → 403/404.
- [ ] Try to create campaign on a revoked assignment → server rejects
      with assignment-inactive reason.

### 6.4 Archive campaign (Flow I)

- [ ] On `/affiliate/campaigns/<id>` → click "Archive" → confirm
      dialog warns share link will stop working.
- [ ] After archive → `status='archived'`, share URL returns 410 page.
- [ ] Conversion history stays visible on the campaign detail page
      (`ON DELETE RESTRICT` preserves history).
- [ ] No "delete" / "destroy" UI surface exists.

### 6.5 Notification preferences

- [ ] `/affiliate/notifications/preferences` shows 7 kinds, each with
      `in-app` + `email` switch. Defaults: both ON.
- [ ] Toggle one off, click "Save preferences" → persists in
      `affiliate_accounts.notification_prefs`.
- [ ] Re-load page → toggles match what was saved.
- [ ] After saving with `affiliate.conversion` email=OFF → trigger a
      new conversion via E2E flow → verify in-app fires but email is
      NOT enqueued.
- [ ] After saving with `affiliate.rate_changed` in-app=OFF → trigger
      a rate edit → verify email fires but no inbox row created.

### 6.6 Inbox auto-mark-read

- [ ] Trigger 3 unread notifications.
- [ ] Open `/affiliate/notifications` → on mount, POST to
      `/api/affiliate/notifications/mark-read` fires (check Network).
- [ ] After response: `router.refresh()` re-renders, "New" badges
      disappear.
- [ ] Reload page → no POST fires (unreadCount=0 short-circuits the
      effect).

---

## 7 — Public click + booking + payment (Flow D, E, F)

### 7.1 Click resolution (Flow D)

- [ ] `/r/<active_campaign_code>` → 307 redirect to destination with
      `?ref=<code>` appended.
- [ ] `campaign_clicks` row inserted with full payload (ip, country,
      user_agent, referrer, is_unique_click).
- [ ] Bot User-Agent → `is_bot=true`, click logged but flagged.
- [ ] `/r/<archived_code>` → 410 "link no longer active" branded page.
      No click logged.
- [ ] `/r/<paused_code>` (campaign auto-paused via revoked assignment)
      → 410. No click logged.
- [ ] `/r/<unknown>` → 404.
- [ ] **Rate-limited**: 100 requests/minute per IP — verify 101st gets
      429 with `Retry-After`.
- [ ] Repeat clicks from same IP within session → first is unique
      (`is_unique_click=true`), subsequent are not.

### 7.2 Booking with rate stamp (Flow E)

- [ ] Customer visits `/<diviner>/services/<slug>?ref=<active_code>`,
      books.
- [ ] Booking row has:
  - [ ] `commission_source_assignment_id` = the assignment
  - [ ] `commission_rate_type_stamp` = assignment's commission_type
  - [ ] `commission_rate_value_stamp` = assignment's commission_value
- [ ] Booking via diviner-owned campaign → stamp columns NULL (no
      affiliate to credit).
- [ ] Booking via revoked assignment's campaign → stamp NULL.
- [ ] Booking via campaign whose destination ≠ booked product → stamp
      NULL.
- [ ] Booking via campaign owned by a BLOCKED affiliate account →
      stamp NULL.
- [ ] Booking with no `ref` → stamp NULL.

### 7.3 Webhook credit (Flow F)

- [ ] Customer pays → Stripe webhook fires → `bookings.status='confirmed'`.
- [ ] If stamp NULL → no `campaign_conversions` row.
- [ ] If stamp present AND `affiliate_accounts.status='active'` → row
      written to `campaign_conversions`:
  - [ ] `affiliate_id` = junction id from booking.commission_source_assignment_id
  - [ ] `campaign_id` = resolved from booking.ref_code
  - [ ] `rate_type_used` = booking.commission_rate_type_stamp
  - [ ] `rate_value_used` = booking.commission_rate_value_stamp
  - [ ] `commission_amount_cents` = stamped rate × order amount
  - [ ] `booking_id` = booking.id (UNIQUE — webhook retry idempotency)
- [ ] Affiliate's `affiliate_accounts.status='blocked'` at credit time
      → no row written. Logged reason `account_not_active_at_credit`.
      Diviner keeps full payment.
- [ ] Webhook retry of same booking → second attempt is idempotent
      (UNIQUE on booking_id). No duplicate row.
- [ ] In-app `affiliate.conversion` notification fires immediately.
- [ ] Email is NOT sent immediately (deferred to digest).

### 7.4 Daily digest cron

- [ ] `GET /api/cron/affiliate-conversion-digest` (manually trigger):
  - [ ] Pulls today's conversions per affiliate.
  - [ ] Sends a single grouped email per affiliate.
  - [ ] Skips affiliates who toggled `affiliate.conversion` email OFF.
- [ ] Cron entry in `vercel.json`: scheduled `0 0 * * *`. (Manual run
      OK to verify; daily real run gets observed once in prod.)

---

## 8 — Reversal & emergency overrides (Flow J, K)

### 8.1 Refund-driven reversal (Flow J)

- [ ] Stripe `charge.refunded` webhook → reversal handler fires.
- [ ] `campaign_conversions.reversed_at` set, `reversed_by='stripe'`,
      `reversed_reason` populated.
- [ ] Affiliate's `earned_cents` total now excludes this row.
- [ ] Affiliate receives `affiliate.reversal` notification (in-app +
      email, immediate).

### 8.2 Admin reverse conversion

- [ ] Admin → `/admin/reports/affiliates/conversions` → click "Reverse"
      on a non-reversed row → modal opens.
- [ ] Reason input:
  - [ ] Empty → confirm button disabled.
  - [ ] 4 chars → disabled.
  - [ ] 5 chars → enabled.
  - [ ] 501 chars → input maxLength=500 prevents typing past 500.
- [ ] Submit → POST to `/api/admin/conversions/<id>/reverse`. After
      success, route refreshes; row now shows "reversed" badge.
- [ ] `admin_action_log` row written with action_kind=
      `affiliate_conversion_reversed`, reason text, target_resource_id.
- [ ] Affiliate receives `affiliate.reversal` notification.
- [ ] Re-click "Reverse" on already-reversed row → button is hidden in
      UI; direct API call returns 409 "Conversion already reversed".

### 8.3 Admin force-revoke assignment

- [ ] Admin → `/admin/reports/affiliates` → Emergency Overrides panel
      → paste assignment UUID → "Revoke assignment" button enables.
- [ ] Paste invalid UUID → button stays disabled, "Not a valid UUID"
      message shows.
- [ ] Submit with reason → modal shows. Same 5-500 char rules.
- [ ] After success: `is_active=false`, `revoked_at`, `revoked_by`=admin
      user_id.
- [ ] Auto-pause trigger fires on dependent campaigns.
- [ ] **Both** affiliate AND diviner notified via
      `admin.override.assignment_revoked`.
- [ ] `admin_action_log` row with action_kind=
      `affiliate_assignment_admin_revoked`, reason, target_resource_id.

### 8.4 Admin force-archive campaign

- [ ] Same panel → paste campaign UUID → "Archive campaign" button.
- [ ] Submit with reason → after success: `status='archived'`,
      `archived_by`=admin user_id.
- [ ] Share URL returns 410.
- [ ] **Both** affiliate (campaign owner) AND diviner notified via
      `admin.override.campaign_archived`.
- [ ] `admin_action_log` row with action_kind=
      `affiliate_campaign_admin_archived`.

---

## 9 — Admin reports surfaces

### 9.1 Tab navigation

- [ ] Tab nav appears on every `/admin/reports/affiliates*` page.
- [ ] Active tab has `aria-current="page"` + bottom border.
- [ ] All 6 tabs reachable: Overview, By diviner, By affiliate, Clicks,
      Conversions, Rate history.

### 9.2 Overview (legacy combined view)

- [ ] Shows combined advocate + affiliate metrics.
- [ ] Period selector buttons (30 / 90 / 1y / all).
- [ ] Emergency Overrides panel renders below the chart.
- [ ] No regressions vs pre-tab-nav version (the legacy combined data
      should look identical).

### 9.3 By-diviner

- [ ] Each row shows diviner name + username + clicks/conversions/
      earned/reversed.
- [ ] Sorted by `earned_cents` DESC.
- [ ] Period selector updates the data.
- [ ] Empty period → empty-state copy.

### 9.4 By-affiliate

- [ ] Each row is one affiliate ACCOUNT (not junction). Multi-junction
      affiliates appear once with `partnerships` count.
- [ ] Status badge color: active=default, blocked=destructive,
      else=outline.

### 9.5 Clicks log

- [ ] Filters render: country, diviner ID, affiliate ID, bot/human,
      date_from, date_to.
- [ ] Apply filters → URL builder includes only set params.
- [ ] First page loads with cursor pagination (`limit=25`).
- [ ] "Load more" appends next page; cursor advances; eventually
      hides when `hasMore=false`.
- [ ] Filter by `is_bot=true` → only bot rows.
- [ ] Filter by `country=US` → only US rows.
- [ ] Filter by valid `affiliate_id` → only that junction's clicks.

### 9.6 Conversions log

- [ ] Same filter set + status (earned / reversed / all).
- [ ] Each row: when, campaign name + id snippet, order amount, rate
      used, commission, status badge, Reverse button (only when not
      reversed).
- [ ] **Critical**: filter by `diviner_id` resolves campaigns FIRST,
      then queries `campaign_conversions` with
      `.in("campaign_id", scopedIds)` — verify pagination doesn't drop
      data when scoped.

### 9.7 Rate-history audit

- [ ] Each row: when, assignment scope, from-rate, to-rate, reason.
- [ ] Filter by diviner OR affiliate works (assignment scope resolved
      at SQL level, same pre-LIMIT pattern as conversions).
- [ ] Reverse-chronological order (`changed_at DESC, id DESC`).

---

## 10 — Notifications matrix verification

For each kind, verify both channels honor user preferences. Run with
Affiliate 1 (multi-junction, used to verify per-account prefs apply
across both diviners):

| Kind | Trigger | In-app default | Email default | Email timing |
|---|---|---|---|---|
| `affiliate.assigned` | Diviner POSTs assignment | ✓ on | ✓ on | immediate |
| `affiliate.rate_changed` | Diviner PATCHes rate | ✓ on | ✓ on | immediate (NOT digested) |
| `affiliate.revoked` | Diviner revokes assignment | ✓ on | ✓ on | immediate |
| `affiliate.conversion` | Webhook writes `campaign_conversions` | ✓ on | ✓ on | **daily digest** |
| `affiliate.reversal` | `reversed_at` set | ✓ on | ✓ on | immediate |
| `admin.override.assignment_revoked` | Admin revokes → diviner + affiliate | ✓ on | ✓ on | immediate (BOTH parties) |
| `admin.override.campaign_archived` | Admin archives → affiliate + diviner | ✓ on | ✓ on | immediate (BOTH parties) |

For each row:
- [ ] All-on default fires correctly on first trigger.
- [ ] Toggle in-app off → no `notifications` row.
- [ ] Toggle email off → no email enqueued (verify SES log).
- [ ] Toggle both off → trigger logs "skipped, prefs off" but doesn't
      raise.

Diviners receive notifications via the legacy `createNotification` call
(see comment in `/api/admin/affiliate-assignments/[id]/revoke/route.ts`).
Per-kind diviner prefs are deferred to a later "unified notifications"
overhaul — verify diviner inbox renders, but do NOT expect a diviner
preferences page in this sprint.

---

## 11 — Status enum verification

- [ ] `affiliate_accounts.status` accepts only (`unclaimed`, `active`,
      `blocked`). Try `'suspended'` via direct DB write → CHECK fails.
- [ ] `affiliate_campaigns.status` accepts only (`active`, `paused`,
      `archived`, `expired`). Try `'draft'` or `'completed'` → CHECK fails.
- [ ] `diviner_affiliates.status` STILL accepts `'suspended'` — used
      when revoking an invite that has prior commission history (this
      enum was NOT trimmed by 01b destructive).

---

## 12 — Cross-diviner data isolation

Critical for fraud / privacy:

- [ ] Affiliate 1 (multi-junction). Diviner A views
      `/dashboard/affiliates/<junction-with-A>` → ONLY conversions,
      campaigns, rate-history tied to Diviner A's assignments visible.
      Diviner B's slice is invisible.
- [ ] Diviner A → `/api/dashboard/affiliate-reports/conversions` → ONLY
      conversions on campaigns where `diviner_id = A`.
- [ ] Affiliate 1 → `/affiliate/campaigns/<id>` for a campaign tied to
      Diviner A → only sees their own campaign's conversions; cannot
      see Diviner B's campaigns even though they're partnered with B.
- [ ] Direct API call as Affiliate 2 with Affiliate 1's junction id in
      a body → 403/404.

---

## 13 — Pagination & deterministic ordering

For every cursor-paginated endpoint:

- [ ] First page: `limit=25` items + `nextCursor` set + `hasMore=true`.
- [ ] Subsequent pages use `cursor` query param.
- [ ] Last page: `nextCursor=null`, `hasMore=false`.
- [ ] Order ends with `.order("id", { ascending: false })` tie-breaker
      (CLAUDE.md §16).
- [ ] Re-running an identical query returns the same rows in the same
      order (no flapping).

Verify on:
- [ ] `/api/admin/reports/affiliates/clicks`
- [ ] `/api/admin/reports/affiliates/conversions`
- [ ] `/api/admin/reports/affiliates/rate-history`
- [ ] `/api/dashboard/affiliate-reports/clicks`
- [ ] `/api/dashboard/affiliate-reports/conversions`
- [ ] `/api/affiliate/reports/conversions` (if exposed)

---

## 14 — Hard-laws gating (CLAUDE.md §1-32)

### 14.1 Accessibility (WCAG 2.2)

- [ ] All form fields have associated `<Label htmlFor=...>`.
- [ ] All buttons have either visible text or `aria-label`.
- [ ] Tab navigation through every form is logical (no traps).
- [ ] Period selector + status filters are keyboard-operable.
- [ ] Modals trap focus and return focus on close.
- [ ] Color contrast on status badges meets WCAG AA.
- [ ] Skeleton loaders announce a polite live-region (`aria-busy`).

### 14.2 Performance budgets

- [ ] LCP for `/<diviner>` landing < 2.5s (real network).
- [ ] LCP for `/admin/reports/affiliates` < 2.5s.
- [ ] INP < 200ms on filter-apply on conversions log.
- [ ] CLS = 0 on every paginated page (skeleton dimensions match real
      content).

### 14.3 Security & object-level authz

- [ ] Every mutating endpoint checks `getAdminUser` / `getDiviner` /
      `resolveAffiliateForCaller` before reading body.
- [ ] Override endpoints reject if reason ≤ 4 chars (422) or > 500 (422).
- [ ] All POST/PATCH bodies are JSON; non-JSON returns 422.
- [ ] Direct UUID-shaped tampering: caller forges another tenant's
      junction id → 403/404 (verified in §12).
- [ ] No `Set-Cookie` for sensitive tokens lacks `Secure`, `HttpOnly`,
      `SameSite=Lax` (or stricter).

### 14.4 Error contract

- [ ] All API errors follow RFC 9457: `{ type, title, status, detail? }`.
- [ ] 401 on logged-out, 403 on wrong role, 404 on missing resource,
      422 on validation, 429 on rate-limit, 500 only on unexpected.

---

## 15 — Negative & edge cases

### 15.1 Account state edges

- [ ] Affiliate account flips from `active` to `blocked` mid-flight
      (after booking, before payment) → webhook re-checks `status`,
      finds `blocked`, no conversion written.
- [ ] Affiliate account flips back to `active` → no retroactive
      backfill (correct: blocking is enforcement, not pause).
- [ ] Unclaimed affiliate → all portal pages gated, but admin can still
      see their account in `/admin/reports/affiliates/by-affiliate`.

### 15.2 Stale data after cleanup

- [ ] Direct hit `/admin/affiliates/<existing-id>` → 404 (page deleted).
- [ ] Direct hit `/api/admin/affiliates/<id>/disputes` → 404 (route deleted).
- [ ] Direct hit `/api/admin/affiliates/<id>/payouts` → 404 (route deleted).
- [ ] Direct hit `/affiliate/commissions` → 404 (page deleted).
- [ ] Direct hit `/affiliate/links` → 404 (page deleted).
- [ ] Direct hit `/api/affiliate/commissions` → 404.
- [ ] Direct hit `/api/affiliate/links` → 404.
- [ ] No dropped table is referenced anywhere in `src/` (run
      `git grep -E "\\.from\\(['\"](affiliate_commissions|affiliate_referral_links|affiliate_clicks|affiliate_payouts|affiliate_payout_items|affiliate_commission_history)" -- 'src/**'`
      → returns zero hits).

### 15.3 Concurrency

- [ ] Two simultaneous "Reverse" clicks on the same conversion → first
      succeeds, second returns 409 (UNIQUE on `reversed_at` non-null
      transition guarded by `reverseConversion` helper).
- [ ] Webhook fires twice for same booking (Stripe retry) → second
      conversion insert hits UNIQUE on `booking_id`, no duplicate.

### 15.4 Empty / missing data

- [ ] Brand-new affiliate (no junctions) → portal pages show
      empty-state cards, no errors.
- [ ] Diviner with no affiliates → `/dashboard/affiliates` shows
      empty state.
- [ ] No conversions yet → all KPI tiles render with $0.00 / 0.

### 15.5 Rate-edit edge cases (Flow G)

- [ ] PATCH the assignment with the SAME values → no rate-history row
      written, no notification fired.
- [ ] PATCH with rate change AND non-rate fields (notes) in same call
      → rate-history row + notification fire only once.

### 15.6 Click edge cases

- [ ] `/r/<code>` with extra query params → preserves existing query
      and appends `?ref=<code>` correctly (no `??` or duplicate keys).
- [ ] `/r/<code>` to a campaign with `expired` status → 410.

---

## 16 — Cleanup & spec sync verification

- [ ] `MEMORY.md` is up to date — no stale claims about deleted surfaces.
- [ ] `docs/specs/affiliate-commission-system.md` Changelog has an
      entry for v1.2 (the booking-stamp model).
- [ ] No file under `src/` references `recordAffiliateCommission`,
      `recordSignupAffiliateCommission`,
      `getAffiliateCommissionTotalForOrderRef`, or any removed helper.
- [ ] No file references `commission_value_snapshot` /
      `commission_type_snapshot` columns on `affiliate_campaigns`
      (except advocate-service back-compat readers, which are out of
      scope).
- [ ] All 6 sprint task docs (01a, 01b, 02, 03, 04, 05, 06, 07, 08)
      have status updated in their headers to match shipped state.
- [ ] Vercel preview deployment of the latest master commit passes
      build, lint, and typecheck (sole pre-existing exception:
      `.next/dev/types/validator.ts` stale Next-generated file).

---

## 17 — Sign-off

This sprint can ship to production when:
- [ ] Every box above is ticked.
- [ ] No P0/P1 bugs filed against any of the surfaces in §3-9.
- [ ] DORA snapshot recorded: change-failure rate, MTTR, deployment
      frequency, lead time. Logged for the sprint retro.
- [ ] Living spec linked from `CLAUDE.md` Living Specs table is up to
      date. Any deferred behavior is captured under §11 "Open
      questions / parking lot" of the spec.

Signed off by: ____________________  Date: __________
