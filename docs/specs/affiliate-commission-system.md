# Affiliate Commission System — Living Spec

> **Status:** Authoritative requirements doc. Read this first before touching
> any affiliate / commission / campaign code.
>
> **Last updated:** 2026-04-24 (v1.2 — blocked-account enforcement at webhook, status enum trim to 3 values)
>
> **Owner:** product + engineering (update together on every scope change)

---

## How this doc stays current

**Every PR that touches affiliate / commission / campaign behavior MUST
update the relevant section of this file in the same commit.** Schema
changes, new endpoints, UI flows, notification triggers, RLS policies,
phase rollouts — all of it lands here.

The changelog section at the bottom is append-only. Add a dated entry on
every change, one line per concrete thing that moved.

If a future task re-reads this file and finds it contradicts the code, the
code is the source of truth for *what exists*; this doc is the source of
truth for *what the product should be*. Resolve the conflict by updating
the doc and/or the code — never leave the conflict open.

---

## 1 — Purpose & scope

The affiliate commission system lets a **diviner** (service provider) share
revenue with an **affiliate** (referrer) on bookings the affiliate
generates. The diviner configures the share per product, the affiliate
creates tracking campaigns, and commissions auto-record when conversions
happen.

**If a booking has no `ref_code`, no conversion is recorded — the diviner
keeps the full payment.** The system never auto-attributes bookings to
affiliates from cookies, email addresses, or any other proxy.

**In scope for Phase 1 (this spec):**
- Diviner assigns an affiliate to one of their profiles or services at a
  specific rate.
- Affiliate creates tracking campaigns for products they've been assigned.
- Click / conversion tracking.
- Commission auto-recorded in the DB at conversion time, using the
  diviner's current assignment rate.
- Notifications (email + in-app) to affiliates when the rate changes.
- Full rate-change audit trail.
- Admin / diviner / affiliate dashboards with role-scoped views.

**Deferred to Phase 2:**
- Stripe Connect automatic commission split at charge time.
- A payouts ledger (`affiliate_payouts` or equivalent) with `paid_at` and
  `stripe_transfer_id` on conversions.

**Explicitly out of scope (non-goals):**
- Any relationship with the `social_advocates` system. This is a separate
  service with no shared tables, endpoints, or UI beyond incidental reuse
  of generic helpers.
- Admin approval state machine (no pending → approved → paid human gate).
- Commission snapshot on the campaign as authoritative payout source. The
  live assignment rate is always authoritative.
- Legacy System A (slug-based referral links + separate commission ledger).
  Hard-deleted; see §9.
- **Subscription / signup affiliate commissions.** Pre-Task-02, six
  Stripe webhook handlers wrote `affiliate_commissions` rows on
  non-booking events: community signup, combo bundle signup, perennial
  community signup, diviner signup, weekly subscription create, weekly
  subscription invoice. After Task 02 retired the legacy writers, those
  flows credit no commission. **This is intentional.** The booking-
  attribution model defined in §3.8 / §5 Flow E is the only commission
  surface in scope. If subscription/signup attribution is wanted later,
  it ships as a separate sprint with its own stamp model on the
  subscription tables.

---

## 2 — Glossary

| Term | Meaning |
|---|---|
| **Diviner** | Service provider. Row in `diviners`, linked to `auth.users`. |
| **Affiliate** | Referrer. Canonical identity in `affiliate_accounts`. |
| **Diviner-affiliate partnership** | One [diviner, affiliate] pair. Row in `diviner_affiliates` (the junction). An affiliate can partner with multiple diviners — one junction row per diviner. |
| **Assignment** | A product-scoped permission for an affiliate to earn commission on a specific profile-wide or service-specific scope, at a specific rate. Row in `diviner_service_affiliates`. |
| **Campaign** | A tracking/analytics unit owned by an affiliate (or diviner). Row in `affiliate_campaigns`. An affiliate creates one or more campaigns per assignment to track different channels / creatives / referrers. |
| **Click** | A visitor hitting a campaign's short link. Row in `campaign_clicks`. |
| **Conversion** | A paid booking attributed to a campaign via `ref_code`. Row in `campaign_conversions`. This row IS the commission ledger entry — no separate approval table. |
| **Ref code** | The short alphanumeric code appended to a booking URL as `?ref=<code>` that ties a conversion back to its campaign. |
| **Rate** | `commission_type` (`percent` \| `flat`) + `commission_value` on an assignment. Editable by the diviner at any time. |

---

## 3 — Data model

### 3.1 Identity layer

```
auth.users
   ↑  (user_id)
affiliate_accounts              diviners
   ↑  (affiliate_account_id)     ↑ (diviner_id)
diviner_affiliates ─────────────┘
   (junction: one row per [affiliate, diviner] pair)
```

- `affiliate_accounts` — one row per human affiliate. Holds email, payout
  info, status (`unclaimed | active | blocked`). `blocked` is a hard stop:
  no commission credited even on in-flight bookings (see §3.8 step 5 and
  §5 Flow F step 2).
- `diviner_affiliates` — junction row per [affiliate, diviner] partnership.
  Used as the `affiliate_id` FK in every downstream table.

### 3.2 Assignment layer (source of truth for rates)

```
diviner_service_affiliates
  id
  diviner_id           → diviners.id
  affiliate_id         → diviner_affiliates.id
  affiliate_type       = 'diviner_affiliate'  (always — no social_advocate)
  destination_type     'PROFILE' | 'SERVICE'
  destination_id       NULL for PROFILE, service_template_id for SERVICE
  commission_type      'percent' | 'flat'
  commission_value     NUMERIC
  is_active            BOOLEAN
  assigned_at / assigned_by
  revoked_at / revoked_by
  notes
```

**Rules:**
- Only the owning diviner can insert or edit rate on rows where they are
  the `diviner_id`. Admins can force-revoke (not edit rate) under Flow K.
- Partial unique index on `(diviner_id, destination_type, destination_id,
  affiliate_id, affiliate_type) WHERE is_active=true` prevents double-
  assignment.
- Every rate change writes a `diviner_service_affiliate_rate_history` row.

### 3.3 Rate history (audit + notifications)

```
diviner_service_affiliate_rate_history
  id
  assignment_id        → diviner_service_affiliates.id
  old_commission_type / old_commission_value
  new_commission_type / new_commission_value
  changed_at / changed_by
  reason               TEXT (optional; diviner-supplied note)
```

Inserted by `PATCH /api/dashboard/affiliate-assignments/[id]` whenever rate
fields actually change.

### 3.4 Campaign layer

```
affiliate_campaigns
  id
  diviner_id                → diviners.id (the diviner whose product this promos)
  owner_type                'diviner' | 'affiliate'
  owner_affiliate_id        NULL if owner_type='diviner', else diviner_affiliates.id
  owner_affiliate_type      always 'diviner_affiliate' in Phase 1
  source_assignment_id      → diviner_service_affiliates.id (set when owner_type='affiliate')
  destination_type / destination_service_template_id
  campaign_code             UNIQUE short code (6-8 chars)
  status                    'active' | 'paused' | 'archived' | 'expired'
  channel, utm_source, utm_medium, utm_campaign
  created_at / updated_at
```

**Rules:**
- Commission rate is **NOT stored on the campaign.** The old
  `commission_value_snapshot` / `commission_type_snapshot` columns are
  dropped (Phase 1 migration).
- At conversion, the rate is resolved live from
  `diviner_service_affiliates` via `source_assignment_id`.
- Diviner-owned campaigns (`owner_type='diviner'`) never credit commission.
  They exist only for the diviner's own analytics.
- Affiliate-owned campaigns require a valid `source_assignment_id`;
  enforced by CHECK constraint `affiliate_campaigns_owner_consistency`.

### 3.5 Click & conversion layer

```
campaign_clicks                   campaign_conversions
  id                                id
  campaign_id                       campaign_id        → affiliate_campaigns.id
  tracking_link_id                  affiliate_id       → diviner_affiliates.id
  campaign_code                     affiliate_type     = 'diviner_affiliate'
  diviner_id                        booking_id         → bookings.id (UNIQUE — idempotency)
  destination_type / destination_id ref_code_snapshot
  resolved_url                      order_amount_cents
  affiliate_id / affiliate_type     commission_amount_cents   (computed from live rate)
  ref_code                          rate_type_used / rate_value_used  (for audit)
  ip, user_agent, country           created_at
  referrer, session_cookie          reversed_at / reversed_by / reversed_reason
  is_bot, is_unique_click           paid_at / stripe_transfer_id    (Phase 2 only)
  created_at
```

Click logging is fire-and-forget. Conversion writes are transactional with
a UNIQUE(booking_id) constraint to make webhook retries safe.

**Reversal:** refunds or disputes set `reversed_at` on the conversion row.
This subtracts the commission from the affiliate's totals. No separate
"reversed commission" row.

### 3.6 Notifications

```
notifications                       notification_preferences
  id                                 user_id (PK)
  user_id                            email_enabled
  kind          e.g. 'affiliate.rate_changed'    in_app_enabled
  title                              ...per-kind toggles
  body
  metadata      JSONB
  read_at
  created_at
```

In-app inbox + email delivery. See §7 for triggers.

### 3.7 Redirect / tracking links

```
tracking_links
  id
  diviner_id
  campaign_id               → affiliate_campaigns.id
  destination_url
  destination_type / destination_entity_id
  clicks / unique_clicks
  is_active
```

`GET /r/<campaign_code>` looks up the tracking link, logs the click, and
307-redirects to the destination with `?ref=<campaign_code>` appended.

### 3.8 Booking rate stamp (authoritative commission rate for a booking)

The commission rate that pays out on a conversion is captured onto the
`bookings` row at **booking creation time**, not at webhook time. This
ensures a diviner's rate edit only affects NEW bookings — in-flight
payments keep the rate the customer started their checkout under.

Columns added to `bookings`:

```
commission_source_assignment_id   UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL
commission_rate_type_stamp        TEXT    ('percent' | 'flat')
commission_rate_value_stamp       NUMERIC(10,4)
```

All three are nullable. They are set only when:
1. The booking carries a valid `ref_code`.
2. The resolved campaign has `status='active'` and `owner_type='affiliate'`.
3. The campaign's `source_assignment_id` points at an assignment with
   `is_active=true`.
4. The campaign's destination matches the booking's service/profile.
5. The affiliate's `affiliate_accounts.status` is `active` (not `blocked`
   or `unclaimed`).

If any check fails, all three columns stay NULL and no commission will be
credited when the webhook fires — the booking proceeds normally and the
diviner keeps the full payment.

The webhook uses these stamped values to write `campaign_conversions`.
`diviner_service_affiliates` is NOT re-read at webhook time.

---

## 4 — Roles

| Role | Who | Can |
|---|---|---|
| **Admin** | Staff account in `admin_users` | Global read on everything. Cannot edit commission rates (only the owning diviner can). Can reverse a conversion. Emergency override: force-revoke an assignment, force-archive a campaign. Every admin override writes an audit row and notifies the affected parties. |
| **Diviner** | User with a `diviners` row | Create / edit / revoke assignments for their own products. Create diviner-owned campaigns. Read all data scoped to their own `diviner_id`. |
| **Affiliate** | User linked to `affiliate_accounts` via `user_id`, with at least one active junction in `diviner_affiliates` | Create / archive their own campaigns on assignments given to them. Read all data scoped to `affiliate_id IN their junction_ids`. Cannot edit rates. |
| **Visitor / customer** | Anyone clicking a campaign link | Reach the destination URL; triggers click + (on purchase) conversion. Never sees affiliate/commission data. |

---

## 5 — End-to-end flows

### Flow A — Diviner assigns an affiliate to a product

**Actor:** diviner.
**UI:** Diviner dashboard → Affiliates → "Assign affiliate".
**Endpoint:** `POST /api/dashboard/affiliate-assignments`

Steps:
1. Diviner picks an existing affiliate partner (from `diviner_affiliates`
   rows where they are the diviner) — or invites one if none exists.
2. Picks scope: entire profile (`PROFILE`, destination_id=NULL) or a
   specific service template (`SERVICE`, destination_id=template_id).
3. Sets rate: `percent` with 0-100, or `flat` with a dollar amount.
4. Optional notes.
5. Server validates, writes row to `diviner_service_affiliates` with
   `is_active=true`, `assigned_by=auth.uid()`.
6. Affiliate gets in-app + email notification: "You've been assigned to X
   product at Y% / $Y flat."

### Flow B — Diviner creates a promo campaign (their own)

**Actor:** diviner.
**UI:** Diviner dashboard → Campaigns → "New campaign".
**Endpoint:** `POST /api/dashboard/campaigns`

Steps:
1. Diviner picks a destination (profile or service).
2. Names the campaign, optional UTMs / channel.
3. Server writes `affiliate_campaigns` row with `owner_type='diviner'`,
   auto-generates `campaign_code`, creates matching `tracking_links` row.
4. **No commission credited on conversions through this campaign** — it's
   purely for the diviner's own funnel analytics.

### Flow C — Affiliate creates a tracking campaign for an assignment

**Actor:** affiliate.
**UI:** Affiliate dashboard → My Products → Pick an assignment → "New
tracking campaign".
**Endpoint:** `POST /api/affiliate/assignments/[id]/campaigns`

Steps:
1. Affiliate lists their active assignments
   (`diviner_service_affiliates WHERE affiliate_id IN junction_ids AND
   is_active=true`).
2. Picks one. Fills in campaign name, optional channel/UTMs.
3. Server verifies the caller owns this assignment (affiliate_id matches
   their junction and `is_active=true`).
4. Server writes `affiliate_campaigns` row with:
   - `owner_type = 'affiliate'`
   - `owner_affiliate_id = <junction.id>`
   - `owner_affiliate_type = 'diviner_affiliate'`
   - `source_assignment_id = <assignment.id>`
   - `diviner_id = <assignment.diviner_id>`
   - `destination_*` copied from assignment
   - `status = 'active'`
5. Auto-generates `campaign_code` and `tracking_links` row.
6. Returns share URL.

### Flow D — Customer clicks a campaign link

**Actor:** any visitor.
**URL:** `/r/<campaign_code>`.
**Handler:** [src/app/r/[code]/route.ts](../../src/app/r/[code]/route.ts)

Steps:
1. Rate-limit (100/min per IP).
2. Look up `tracking_links` by code. 404 if missing.
3. **If the linked campaign's source assignment is revoked
   (`diviner_service_affiliates.is_active=false`), respond with a "This
   link is no longer active" page (static, branded, HTTP 410).** No click
   is logged.
4. Otherwise: resolve the destination URL, log to `campaign_clicks` (fire-
   and-forget, full analytics payload), 307-redirect to destination with
   `?ref=<campaign_code>` appended.

### Flow E — Customer books (rate stamped onto the booking)

**Actor:** customer (via booking API).
**Endpoint:** booking creation (e.g. `POST /api/bookings`, or whichever
route creates a `bookings` row).

Steps:
1. Booking row is inserted with the usual fields plus `ref_code` (read
   from the session / URL query param preserved through the checkout
   flow).
2. If `ref_code` is present, resolve:
   - Campaign with matching `campaign_code`, `status='active'`,
     `owner_type='affiliate'`.
   - Assignment via `campaign.source_assignment_id` with `is_active=true`.
   - Destination match between campaign and the booked service/profile.
   - Affiliate's `affiliate_accounts.status = 'active'`.
3. If ALL checks pass, stamp the booking:
   - `commission_source_assignment_id = assignment.id`
   - `commission_rate_type_stamp = assignment.commission_type`
   - `commission_rate_value_stamp = assignment.commission_value`
4. If any check fails, leave the stamp columns NULL. The booking
   proceeds; no commission will be credited when it's paid.

### Flow F — Customer pays (conversion written from stamped rate)

**Actor:** Stripe webhook, invoked after successful payment.
**Handler:** [src/app/api/stripe/webhooks/route.ts](../../src/app/api/stripe/webhooks/route.ts)

Steps:
1. Booking row is marked `status='confirmed'`.
2. If `booking.commission_source_assignment_id` is NULL → no conversion
   row. Return. (Diviner keeps the full payment — see §1.)
3. **Re-check affiliate account status at credit time.** Look up the
   assignment's junction, resolve the affiliate account, check
   `affiliate_accounts.status`. If it is not `'active'` (i.e. `blocked`
   or `unclaimed`) → no conversion row written. Log reason
   `account_not_active_at_credit`, return. The diviner keeps the full
   payment.

   Rationale: account blocking is an enforcement action (fraud, TOS
   violation). Unlike rate edits, which are commercial and respect
   in-flight bookings, blocking must freeze payouts even for bookings
   already stamped. This is the only check that re-reads state at
   webhook time — everything else comes from the stamp.
4. Otherwise, call `creditAffiliateConversion`:
   - Compute `commission_amount_cents` from `commission_rate_type_stamp` +
     `commission_rate_value_stamp` + the order amount.
   - INSERT into `campaign_conversions`:
     - `affiliate_id` = junction id from the assignment
     - `campaign_id` = resolved from booking's `ref_code`
     - `rate_type_used` = `booking.commission_rate_type_stamp`
     - `rate_value_used` = `booking.commission_rate_value_stamp`
     - `booking_id` = booking.id (UNIQUE — guards webhook retries)
   - The stamped RATE is authoritative. Only `affiliate_accounts.status`
     is re-read at webhook time.
5. Commission row is IMMEDIATELY part of the affiliate's ledger. No
   admin approval step.
6. Affiliate notifications: in-app immediately, email digested daily.

### Flow G — Diviner edits an affiliate's commission rate

**Actor:** diviner.
**UI:** Diviner dashboard → Affiliate detail → Edit assignment.
**Endpoint:** `PATCH /api/dashboard/affiliate-assignments/[id]`

Steps:
1. Diviner updates `commission_type` and/or `commission_value`, optional
   `reason`.
2. Server verifies caller is `diviner_id` on the assignment.
3. If rate fields actually changed:
   - UPDATE `diviner_service_affiliates` with new values.
   - INSERT `diviner_service_affiliate_rate_history` row with old/new pair.
   - Send affiliate a notification (in-app + email, immediate): "Your
     rate on <product> changed from X to Y."
4. **Effect on commissions:**
   - The new rate is used when stamping **future bookings** (Flow E).
   - Bookings already created before this edit keep their stamped rate —
     even if not yet paid. When their webhook fires, they pay out at the
     old rate. This is intentional: the customer started checkout under
     the old terms; the affiliate has a claim on that transaction.
   - Existing `campaign_conversions` rows are untouched.

### Flow H — Diviner revokes an assignment

**Actor:** diviner.
**Endpoint:** `PATCH /api/dashboard/affiliate-assignments/[id]` with
`is_active=false` (or `DELETE` as a semantic wrapper).

Steps:
1. Server flips `is_active=false`, sets `revoked_at` / `revoked_by`.
2. All `affiliate_campaigns` rows with this `source_assignment_id` are
   auto-paused (existing trigger: `auto_pause_affiliate_campaigns_on_revoke`).
3. `/r/<code>` handler now shows "link no longer active" page for any
   campaign tied to this assignment (via the `is_active` check in Flow D
   step 3).
4. New bookings through those campaigns won't get the rate stamp (Flow E
   step 2 fails the assignment-active check) → no commission credited at
   webhook time.
5. Bookings already stamped before revocation keep their stamp and pay
   out normally. Revoking an assignment does not claw back an in-flight
   commission.
6. Affiliate is notified (in-app + email): "Your assignment on <product>
   was revoked by <diviner>."

### Flow I — Affiliate archives a campaign

**Actor:** affiliate.
**Endpoint:** `PATCH /api/affiliate/campaigns/[id]` with `status='archived'`.

Steps:
1. Server verifies affiliate owns the campaign.
2. Flips `status='archived'`. Campaign links return the "no longer active"
   page (same as revoked — the `/r/<code>` handler treats any non-`active`
   status as dead).
3. **Conversion history is preserved.** `campaign_conversions.campaign_id`
   FK is `ON DELETE RESTRICT` (not CASCADE) so even hard DB-level deletes
   can't orphan history.
4. No hard delete endpoint is exposed. There is no way for an affiliate to
   wipe their conversion history.

### Flow J — Refund or dispute (conversion reversal)

**Actor:** Stripe webhook (charge.refunded or charge.dispute.created) or
admin manual action.
**Endpoint (admin):** `PATCH /api/admin/conversions/[id]/reverse`

Steps:
1. Look up `campaign_conversions` row by `booking_id`.
2. Set `reversed_at = NOW()`, `reversed_by = auth.uid() or 'stripe'`,
   `reversed_reason` (required for admin action).
3. Affiliate's ledger totals now exclude this row.
4. Affiliate notified (in-app + email): "Commission reversed: $X on
   <product> — reason."

### Flow K — Admin emergency override

**Actor:** admin (row in `admin_users`).
**UI:** Admin dashboard → Affiliates → action menu on the target resource.

Admins cannot edit rates (only the owning diviner can). But they have
emergency override capability for incident response:

| Override | Endpoint | Effect |
|---|---|---|
| Force-revoke an assignment | `POST /api/admin/affiliate-assignments/[id]/revoke` | Same effect as Flow H, but `revoked_by` = admin's user_id. Diviner and affiliate both notified. |
| Force-archive a campaign | `POST /api/admin/affiliate-campaigns/[id]/archive` | Same effect as Flow I, but `archived_by` = admin's user_id. Affiliate (owner) notified. |
| Reverse a conversion | Flow J (`PATCH /api/admin/conversions/[id]/reverse`) | See Flow J — admin is the standard caller. |

Every admin override:
- Requires a `reason` in the request body (min 5 chars). Stored on the
  action log.
- Writes an `admin_action_log` row capturing: admin user_id, action kind,
  target resource id, reason, timestamp.
- Notifies the affected diviner AND affiliate via in-app + email.

### Flow L — Payout (Phase 2, placeholder)

**Deferred.** In Phase 2:
- Stripe Connect wires per-conversion transfers at charge time using
  `transfer_data[destination]` on the PaymentIntent, or `application_fees`
  with the diviner as the connected account.
- `campaign_conversions.paid_at` and `stripe_transfer_id` get populated on
  success.
- A thin `affiliate_payouts` table groups transfers for reporting.
- No admin approval — Stripe is the source of truth for what's been paid.

This spec gets updated when Phase 2 lands.

---

## 6 — Dashboards

All three dashboards query the same underlying tables (`campaign_clicks`,
`campaign_conversions`, `diviner_service_affiliates`, `affiliate_campaigns`,
`diviner_service_affiliate_rate_history`) with role-specific scope
filters.

### 6.1 Admin dashboard

**Endpoints under `/api/admin/reports/`.**
No tenant filter — full cross-platform visibility.

| Page | Queries |
|---|---|
| Overview | Total clicks, conversions, commission paid this week / month across all diviners and affiliates. |
| Diviner-level report | `GROUP BY affiliate_campaigns.diviner_id`. Per-diviner: volume, commission owed, top affiliates. |
| Affiliate-level report | `GROUP BY owner_affiliate_id`. Per-affiliate: earnings, active campaigns, top diviners. |
| Click log | Paginated `campaign_clicks` with filters (date, country, diviner, affiliate, bot/human). |
| Conversion log | Paginated `campaign_conversions` with filters + drill to booking. |
| Rate-change audit | `diviner_service_affiliate_rate_history` list. |
| Reversal tool | Form → `PATCH /api/admin/conversions/[id]/reverse`. |

### 6.2 Diviner dashboard

**Endpoints under `/api/dashboard/affiliate-reports/`.**
Always filtered: `diviner_service_affiliates.diviner_id = me` (or joined
through `affiliate_campaigns.diviner_id = me`).

| Page | Queries |
|---|---|
| Affiliates overview | List of `diviner_service_affiliates WHERE diviner_id = me` grouped by affiliate. Per-affiliate: clicks, conversions, commission earned (this period), commission owed. |
| Per-affiliate detail | Drill into one affiliate — all assignments, all their campaigns, clicks/conversions over time, rate history. **Only the slice tied to this diviner's assignments is visible.** |
| Per-campaign detail | For campaigns where `diviner_id = me` (both their own promo campaigns and affiliate-owned ones on their products). |
| My promo campaigns | `affiliate_campaigns WHERE owner_type='diviner' AND diviner_id = me`. |
| Edit assignment | Form → `PATCH /api/dashboard/affiliate-assignments/[id]`. |

### 6.3 Affiliate dashboard

**Endpoints under `/api/affiliate/reports/`.**
Always filtered: `affiliate_id IN me.junction_ids`.

| Page | Queries |
|---|---|
| Earnings overview | Sum `commission_amount_cents` from `campaign_conversions` where `affiliate_id IN me.junction_ids AND reversed_at IS NULL`. Breakdown: this week / month / all. |
| My products (assignments) | `diviner_service_affiliates WHERE affiliate_id IN junction_ids AND is_active=true`. Current rate per product. |
| My campaigns | `affiliate_campaigns WHERE owner_affiliate_id IN junction_ids`. With per-campaign clicks + conversions + earnings. |
| Campaign detail | Drill into one campaign — clicks over time, conversions, earnings. |
| Rate change history | `diviner_service_affiliate_rate_history` for my assignments. |
| Notifications inbox | `notifications WHERE user_id = me`. |

---

## 7 — Notifications

All notifications have two delivery channels: **in-app** (writes to
`notifications` table) and **email** (queued sender). User can toggle per-
channel in `notification_preferences`.

| Kind | Trigger | Channels | Recipient |
|---|---|---|---|
| `affiliate.assigned` | Diviner creates an assignment for this affiliate | in-app + email | Affiliate |
| `affiliate.rate_changed` | Diviner updates rate on an assignment | in-app + email (immediate, not digested) | Affiliate |
| `affiliate.revoked` | Diviner revokes an assignment | in-app + email | Affiliate |
| `affiliate.conversion` | New `campaign_conversions` row written for this affiliate | in-app (immediate) + email (daily digest) | Affiliate |
| `affiliate.reversal` | `reversed_at` set on a conversion | in-app + email | Affiliate |
| `admin.override.assignment_revoked` | Admin force-revokes an assignment | in-app + email | Diviner + Affiliate (both notified) |
| `admin.override.campaign_archived` | Admin force-archives a campaign | in-app + email | Affiliate (owner) + diviner (of the underlying assignment) |

All email sends go through the project's existing mail sender (AWS SES).
Digests use a cron at `GET /api/cron/affiliate-conversion-digest`,
scheduled in `vercel.json` to run daily at 00:00 UTC (`0 0 * * *`).

Users can toggle each kind per-channel via `notification_preferences`
(see §3.6). Defaults: every kind enabled on both channels.

---

## 8 — RLS and authorization

All tables below enable RLS. Policies:

| Table | Admin (service_role) | Diviner | Affiliate |
|---|---|---|---|
| `diviner_service_affiliates` | ALL | ALL where `diviner_id = my_diviner_id` | SELECT where `affiliate_id IN my_junctions` |
| `diviner_service_affiliate_rate_history` | ALL | SELECT where assignment's `diviner_id = me` | SELECT where assignment's `affiliate_id IN my_junctions` |
| `affiliate_campaigns` | ALL | SELECT where `diviner_id = me`. INSERT/UPDATE only on `owner_type='diviner'` rows where `diviner_id = me`. | SELECT where `owner_affiliate_id IN my_junctions`. INSERT/UPDATE only on `owner_type='affiliate'` rows where `owner_affiliate_id IN my_junctions`. |
| `campaign_clicks` | ALL | SELECT where campaign's `diviner_id = me` | SELECT where `affiliate_id IN my_junctions` |
| `campaign_conversions` | ALL | SELECT where campaign's `diviner_id = me`. No direct UPDATE (reversal goes through admin endpoint). | SELECT where `affiliate_id IN my_junctions`. No UPDATE. |
| `notifications` | ALL | SELECT/UPDATE where `user_id = me` | SELECT/UPDATE where `user_id = me` |

The API layer MUST also enforce these filters in query where clauses (per
CLAUDE.md §13 — UI hiding is not security, and service_role bypasses RLS).
RLS is defense-in-depth, not the only gate.

---

## 9 — Deleted / decommissioned (System A)

The following were hard-deleted in Phase 1 rollout:

**Tables:**
- `affiliate_commissions` (commission ledger — replaced by `campaign_conversions`)
- `affiliate_referral_links` (per-junction share slug — replaced by campaign + tracking_links)
- `affiliate_clicks` (click log — replaced by `campaign_clicks`)
- `affiliate_payouts` (payout records — deferred to Phase 2 with new schema)
- `affiliate_commission_history` (state-transition audit — no state machine in new model)

**Endpoints:**
- `POST /api/dashboard/affiliates/.../...` legacy commission write paths
- `PATCH /api/admin/commissions/[commissionId]` (state machine)
- `POST /api/admin/commissions/[commissionId]/adjust`
- `POST /api/admin/commissions/[commissionId]/refund`
- Anything under `/api/dashboard/affiliate-commission/`

**Public pages:**
- `/affiliate/[code]` (legacy public referral page) — replaced by `/r/<campaign_code>`

**Library functions:**
- `recordAffiliateCommission()` and all its callers in the Stripe webhook
- `recordSignupAffiliateCommission()`
- `getAffiliateCommissionTotalForOrderRef()`

**Columns dropped from `affiliate_campaigns`:**
- `commission_value_snapshot`
- `commission_type_snapshot`

Anything referencing these after Phase 1 is dead code — remove on sight.

---

## 10 — Phase split

### Phase 1 — this spec (target: 2026-04 sprint)
- Schema migrations (add rate history, drop snapshots, add booking rate-stamp columns, retire System A)
- Booking creation stamps the rate onto the booking row (Flow E)
- `POST /api/affiliate/assignments/[id]/campaigns` (affiliate self-serve)
- `PATCH /api/dashboard/affiliate-assignments/[id]` with rate-history write
  and affiliate notification
- `creditAffiliateConversion` reads the stamped rate from the booking, not from the assignment
- Revoked-assignment click behavior ("link no longer active" page)
- Soft-delete (`archived` status) for campaigns — enum becomes `active | paused | archived | expired`
- Admin emergency overrides: force-revoke assignment, force-archive campaign, reverse conversion (with audit log + dual notification)
- Reporting endpoints for all three dashboards
- UI pages for all three dashboards (including notification preferences page)
- Notifications (both channels) + per-kind per-channel preference toggles
- System A deletion (migrations + code removal)
- RLS policies
- Test matrix covering the flows above

### Phase 2 — Stripe auto-split (future)
- Stripe Connect integration at charge time
- Per-conversion transfer (or application_fee) execution
- `paid_at` / `stripe_transfer_id` on conversions
- New `affiliate_payouts` table with proper schema
- Operational tooling for failed transfers

This spec gets an update when Phase 2 starts scoping.

---

## 11 — Open questions / parking lot

*Empty as of 2026-04-24 (v1.2). Add here as new questions emerge.*

---

## 12 — Changelog

Append-only. One line per concrete change. Newest first.

- **2026-04-27** — Task 08 partial landing. Part A RLS suite shipped (`tests/integration/affiliate-rls.test.ts`, 12 cases) — proves cross-tenant isolation at the DB layer using anon-key + JWT (not service-role). Part C unit suite shipped (`tests/unit/affiliate-commission-math.test.ts`, 23 cases) for `computeCommissionCents`. The RLS suite caught a real gap: 4 affiliate-side SELECT policies were never updated for the v2 junction model — `diviner_service_affiliates.affiliate_id` (now `diviner_affiliates.id`, was `auth.users.id`), and `affiliate_campaigns` / `campaign_clicks` / `campaign_conversions` had no affiliate-side SELECT policy at all. Migration `20260427000001_affiliate_rls_v2_alignment.sql` written to fix; resolves through `diviner_affiliates → affiliate_accounts → user_id`. API was always service-role (RLS bypass) so no production regression. Part B (8 separate flow files) and Part D (Playwright E2E) deferred — bulk of behavior covered by the smoke + RLS suites.
- **2026-04-24** — Task 07 Phase C (affiliate-only subset) landed: 6 new pages under `/affiliate/(portal)/` — `products` (active assignments with "Create campaign" CTAs), `campaigns/new` (create form with assignment picker + UTM fields), `campaigns/[id]` (per-campaign detail with KPIs, share URL, recent conversions, archive button), `rate-history` (read-only audit), `notifications` (inbox), `notifications/preferences` (per-kind per-channel toggles backed by new `PATCH /api/affiliate/notification-preferences` endpoint that merges into `affiliate_accounts.notification_prefs`). Affiliate header nav updated with Products / Rate history / Notifications entries. Quality is honest first-pass — works end-to-end but copy + visual polish need design review. Admin + diviner UI still deferred.
- **2026-04-24** — Task 07 Phase B landed: 16 reporting API endpoints across `/api/admin/reports/affiliates/`, `/api/dashboard/affiliate-reports/`, `/api/affiliate/reports/`. Admin set: overview + by-diviner + by-affiliate (aggregated) + clicks + conversions + rate-history (paginated). Diviner set: overview + by-affiliate + by-affiliate/[id] + clicks + conversions, every query scoped through the caller's diviner_id with no cross-tenant leakage. Affiliate set: overview + my-products + rate-history + by-campaign + by-campaign/[id], scoped through caller's junction_ids. All list endpoints use cursor pagination on `(created_at DESC, id DESC)` per CLAUDE.md §16. Period filter `30d|90d|1y|all` (default 30d) via shared `src/lib/affiliate-report-period.ts`. RFC 9457 Problem+JSON errors. Phase C UI still deferred.
- **2026-04-24** — Post-sprint cleanup: digest cron wired in `vercel.json` (`0 0 * * *` daily UTC). Subscription/signup affiliate commissions explicitly marked out of scope in §1 — pre-Task-02 the Stripe webhook wrote affiliate commissions on 6 non-booking flows (community/combo/perennial/diviner signups, weekly-subscription create + invoice); none of those have a System B equivalent and that's by design. If wanted later, separate sprint.
- **2026-04-24** — Task 01b destructive migration drafted (`supabase/migrations/20260424009001_affiliate_commission_v2_destructive.sql`). Drops 6 System A tables (affiliate_commissions, affiliate_referral_links, affiliate_clicks, affiliate_payouts, affiliate_payout_items, affiliate_commission_history) with CASCADE. Trims `affiliate_accounts.status` to `unclaimed | active | blocked` and `affiliate_campaigns.status` to `active | paused | archived | expired`. Relaxes the `affiliate_campaigns_owner_consistency` CHECK so commission snapshots are no longer required on affiliate-owned rows (rate lives on the booking stamp per §3.8). The snapshot **columns** themselves are NOT dropped — the advocate service still writes them; column drop is deferred to a future cross-service cleanup. Idempotent + sanity-checked. Not yet applied — run via `/admin/db/migrations`.
- **2026-04-24** — Task 07 Phase A landed. Five System-A-reading admin endpoints refactored/stubbed: `admin/reports/operations` + `admin/reports/affiliates` + `admin/refunds` rewired onto `campaign_conversions` (with reversed_at bucketing and diviner resolution via campaigns); `admin/reports/payouts` gracefully degrades `status`-based aggregation to "earned vs reversed" semantics (Phase 1 has no paid state); `admin/affiliates/[id]/payouts` stubbed to an empty-list GET + 410 POST until Phase 2 Stripe auto-split. Two admin emergency override endpoints built: `POST /api/admin/affiliate-assignments/[id]/revoke` and `POST /api/admin/affiliate-campaigns/[id]/archive` — both require 5-500 char reason, write `admin_action_log`, dual-notify diviner + affiliate (affiliate via per-kind pref-respecting helper; diviner via generic in-app notification). **System A is fully gone from live read/write paths — Task 01b destructive migration is now safe to run.** Reporting API buildout + UI pages deferred to follow-up sprint per scope decision.
- **2026-04-24** — Task 06 landed: `/r/[code]` now pre-validates the campaign status + source_assignment.is_active BEFORE logging a click. Archived campaign or revoked assignment → 307 redirect to new `/link-not-active` static page (URL visibly changes; no spurious campaign_clicks row). New affiliate archive endpoint `PATCH /api/affiliate/campaigns/[id]` accepts only `{ status: 'archived' }` with strict owner_affiliate_id scope check. Also dropped the now-stale `commission_*_snapshot` reads from `/r/[code]`'s campaign SELECT in preparation for 01b.
- **2026-04-24** — Task 05 landed: new `src/lib/affiliate-notifications.ts` routes events to in-app + email channels respecting per-kind prefs stored in `affiliate_accounts.notification_prefs`. PATCH `/api/dashboard/affiliate-assignments/[id]` now detects rate changes, inserts `diviner_service_affiliate_rate_history` rows, and fires `affiliate.rate_changed` + `affiliate.revoked` notifications with copy noting "future bookings" per spec §5 Flow G. POST `/api/dashboard/affiliate-assignments` fires `affiliate.assigned`. `creditAffiliateConversion` fires `affiliate.conversion` on successful credit (in-app immediate, email digested daily). New shared helper `src/lib/affiliate-reverse-conversion.ts` powers both `POST /api/admin/conversions/[id]/reverse` (writes `admin_action_log`) and Stripe refund/dispute hooks (TBD in Task 07 scope). New cron `GET /api/cron/affiliate-conversion-digest` sums a day's non-reversed conversions per affiliate and sends one email. `admin.override.*` kinds defined but not yet fired — will hook into Task 07 force-revoke / force-archive endpoints.
- **2026-04-24** — Task 04 landed (the risky one). New helper `src/lib/affiliate-stamp.ts::resolveStampForBooking` implements all 5 §3.8 stamping conditions and is called at booking creation in `src/app/api/stripe/booking-payment/route.ts` — stamp fields spread into the insert payload. `creditAffiliateConversion` rewritten to take stamp inputs instead of campaign/template lookups: at webhook time it re-reads `affiliate_accounts.status` (the sole live fraud-enforcement check per §5 Flow F step 3), computes commission from the stamped rate, and writes `rate_type_used` + `rate_value_used` on the conversion row for permanent audit. Webhook booking SELECT updated to pull the 3 stamp columns + passes them through. Dashboard manual-booking creation path (`/api/dashboard/bookings`) intentionally NOT stamped — manual diviner bookings never credit affiliates.
- **2026-04-24** — Task 03 backend landed: `POST /api/affiliate/assignments/[id]/campaigns` for diviner-affiliate self-serve campaign creation (rate-limited 20/hr per account, writes `affiliate_campaigns` with `owner_type='affiliate'` + `source_assignment_id`, inserts matching `tracking_links` row). `GET /api/affiliate/assignments` lists the caller's active assignments with diviner display + destination name. UI surface deferred to Task 07 Part F.
- **2026-04-24** — Task 02 landed: retired System A writes from the Stripe webhook, deleted `src/lib/affiliate-commissions.ts`, deleted 11 legacy endpoint folders + 2 legacy pages + 1 legacy public route (`/affiliate/[code]`), rewrote `getAffiliateCommissionTotalForOrderRef` to read `campaign_conversions`, and refactored 10 System A readers (affiliate portal dashboard + partnerships + earnings pages; affiliate dashboard + links + commissions + partnerships APIs; diviner affiliates summary + reports APIs; `src/lib/diviner-analytics.ts`). Five admin-side endpoints still read System A and are now Task 07's responsibility before Task 01b can drop the tables.
- **2026-04-24** — Task 01a additive migration drafted (`supabase/migrations/20260424000010_affiliate_commission_v2_additive.sql`). Creates `diviner_service_affiliate_rate_history` and `admin_action_log` tables; adds booking stamp columns (`commission_source_assignment_id`, `commission_rate_type_stamp`, `commission_rate_value_stamp`); adds `campaign_conversions` audit columns (`rate_type_used`, `rate_value_used`); extends `affiliate_campaigns.status` to allow `'archived'`; swaps `campaign_conversions.campaign_id` FK to `ON DELETE RESTRICT`; adds RLS policies. Not yet applied to any Supabase environment — run via `npm run migrate` when ready.
- **2026-04-24 (v1.2)** — `affiliate_accounts.status` enum trimmed from `unclaimed | active | suspended | blocked` to `unclaimed | active | blocked`. Blocking is the only non-stamp state the webhook re-reads at credit time (§5 Flow F step 3): any non-`active` status freezes commission even on stamped in-flight bookings. Intentional asymmetry with rate edits (commercial → honor in-flight) and assignment revocation (business decision → honor in-flight); blocking is enforcement and must be punitive. Resolves the only open question from v1.1.
- **2026-04-24 (v1.1)** — Rate-stamping model. Commission rate is now captured on the booking at creation time, not resolved live at webhook time. Rate edits apply to NEW bookings only; in-flight bookings keep their stamped rate. New §3.8 (booking rate stamp columns); Flow E split into E (booking + stamp) and F (payment + conversion); Flow F now reflects "next booking, not next webhook". Admin emergency overrides added as Flow K with audit log + dual notifications. Campaign status enum reduced to `active | paused | archived | expired`. Explicit "no ref → diviner keeps full" line added to §1. Blocked/suspended affiliate account default added to §3.8 step 5.
- **2026-04-24 (v1)** — Initial spec drafted from design discussion. Scope
  locked for Phase 1: live-rate resolution, affiliate self-serve
  campaigns, rate-change history + notifications, System A deletion, three
  role-scoped dashboards. Phase 2 (Stripe auto-split) deferred.
