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
  diviner_id                  → diviners.id (NULL for general campaigns; the diviner whose product this promos)
  owner_type                  'diviner' | 'affiliate'
  owner_affiliate_id          junction id (diviner_affiliates.id) when owner_affiliate_type IN ('diviner_affiliate','social_advocate'); NULL for 'general'
  owner_affiliate_type        'diviner_affiliate' | 'social_advocate' | 'general'
  owner_affiliate_account_id  → affiliate_accounts.id — Phase 1.5: account-direct ownership for general campaigns; NULL for per-diviner campaigns
  source_assignment_id        → diviner_service_affiliates.id (set when owner_affiliate_type='diviner_affiliate'); NULL for general
  destination_type / destination_service_template_id
  campaign_code               UNIQUE short code (6-8 chars)
  status                      'active' | 'paused' | 'archived' | 'expired'
  channel, utm_source, utm_medium, utm_campaign
  created_at / updated_at
```

**Rules:**
- Commission rate is **NOT stored on the campaign.** The old
  `commission_value_snapshot` / `commission_type_snapshot` columns are
  dropped (Phase 1 migration).
- At conversion, the rate is resolved live from
  `diviner_service_affiliates` (per-diviner) or `service_templates`
  (general) via the appropriate stamp source on the booking row.
- Diviner-owned campaigns (`owner_type='diviner'`) never credit commission.
  They exist only for the diviner's own analytics.
- Per-diviner affiliate-owned campaigns require a valid
  `source_assignment_id`. General affiliate-owned campaigns require a
  valid `owner_affiliate_account_id` and `destination_service_template_id`,
  and have NULL `source_assignment_id`/`owner_affiliate_id`. Both shapes
  are enforced by CHECK constraint `affiliate_campaigns_owner_consistency`
  (three branches: diviner-owned, per-diviner-affiliate, general).

### 3.5 Click & conversion layer

```
campaign_clicks                       campaign_conversions
  id                                    id
  campaign_id                           campaign_id           → affiliate_campaigns.id
  tracking_link_id                      affiliate_id          → diviner_affiliates.id (NULL for general)
  campaign_code                         affiliate_type        'diviner_affiliate' | 'social_advocate' | 'general'
  diviner_id (NULL for general)         affiliate_account_id  → affiliate_accounts.id  Phase 1.5: always populated
  destination_type / destination_id     booking_id            → bookings.id (UNIQUE — idempotency)
  resolved_url                          ref_code_snapshot
  affiliate_id / affiliate_type         order_amount_cents
  (NULL on both when general — see §10) commission_amount_cents   (computed from live rate)
  ref_code                              rate_type_used / rate_value_used  (audit)
  ip_hash, user_agent, country_code     converted_at
  referrer_url, session_cookie          reversed_at / reversed_by / reversal_reason
  is_bot, is_unique_click               paid_at / stripe_transfer_id    (Phase 2 only)
  created_at, clicked_at
```

Click logging is fire-and-forget. Conversion writes are transactional with
a UNIQUE(booking_id) constraint to make webhook retries safe.

`affiliate_account_id` on `campaign_conversions` is the cross-cutting
identity field — populated for both per-diviner credits (resolved via
junction → account) and general credits (set directly from the campaign's
`owner_affiliate_account_id`). All account-level rollups should filter
on this column rather than `affiliate_id IN junction_ids`, which would
miss every general credit (those have `affiliate_id=NULL`).

**Column-name pitfalls** (caught and fixed during the 2026-04-30 sprint):
- The time column on `campaign_conversions` is `converted_at`, **not**
  `created_at`. The reversal column is `reversal_reason`, **not**
  `reversed_reason`.
- On `campaign_clicks` the column names are `ip_hash`, `country_code`,
  `referrer_url` — **not** `ip`, `country`, `referrer`. Several v2
  reporting endpoints had the wrong names baked in and were silently
  returning DB errors before the Phase 1.5 sprint corrected them.

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
  diviner_id                NULLable post-Phase-1.5 (general campaigns have no diviner)
  campaign_id               → affiliate_campaigns.id
  destination_url
  destination_type / destination_entity_id
  clicks / unique_clicks
  is_active
```

`GET /r/<campaign_code>` looks up the tracking link, logs the click, and
307-redirects to the destination with `?ref=<campaign_code>` appended.
On the happy path it also sets a first-party `aff_ref` cookie (value =
`<campaign_code>`, `Max-Age=2592000` / 30 days, `SameSite=Lax`,
`Secure` in production, **not** `HttpOnly` so the booking client can
read it). The cookie is **not** set on the 410 / `/link-not-active`
paths so revoked or inactive attribution can't leak past the gate.

The handler enforces three pre-click gates, in order. Any one of them
short-circuits to `/link-not-active` (307) and **no click is logged**:
1. Campaign not active (`status != 'active'`).
2. Per-diviner: `source_assignment_id` points at a revoked assignment
   (`is_active=false`).
3. Phase 1.5 general: `destination_service_template_id` points at a
   template with `affiliate_program_enabled=false`. (Default-rate path —
   `affiliate_program_enabled=true` with `commission_value=NULL` — passes
   the gate; the 10% default is applied later at booking-stamp time.)

**Click-row affiliate_type for general campaigns:** the existing
`campaign_clicks.affiliate_type` CHECK only allows `'diviner_affiliate'`
and `'social_advocate'`. To preserve compatibility, the click logger
coerces general campaigns to `affiliate_id=NULL, affiliate_type=NULL`
on the row. The campaign_id link is enough to attribute the click to
the affiliate later via `affiliate_campaigns.owner_affiliate_account_id`.

### 3.8 Booking rate stamp (authoritative commission rate for a booking)

The commission rate that pays out on a conversion is captured onto the
`bookings` row at **booking creation time**, not at webhook time. This
ensures a diviner's rate edit only affects NEW bookings — in-flight
payments keep the rate the customer started their checkout under.

Columns on `bookings`:

```
commission_source_assignment_id   UUID REFERENCES diviner_service_affiliates(id) ON DELETE SET NULL
commission_source_template_id     UUID REFERENCES service_templates(id) ON DELETE SET NULL  -- Phase 1.5
commission_rate_type_stamp        TEXT    ('percent' | 'flat')
commission_rate_value_stamp       NUMERIC(10,4)
```

All four are nullable. Exactly one of `commission_source_assignment_id`
(per-diviner path) or `commission_source_template_id` (Phase 1.5 general
path) is set on a stamped booking; the other is NULL. The webhook
disambiguates by checking `commission_source_assignment_id IS NULL` and
falling through to the template branch. The schema doesn't enforce
mutual exclusion via CHECK — the resolver returns one or the other.

The stamp is set only when:
1. The booking carries a valid `ref_code`. The booking client reads it
   from the URL `?ref=` query param first, falling back to the
   `aff_ref` cookie set at `/r/<code>` (see §3.7). URL wins when both
   are present so a fresh affiliate click always overrides a stale
   cookie. The 30-day cookie window is the attribution span.
2. The resolved campaign has `status='active'` and `owner_type='affiliate'`.
3. **Per-diviner path** (`owner_affiliate_type='diviner_affiliate'`): the
   campaign's `source_assignment_id` points at a `diviner_service_affiliates`
   row with `is_active=true`, and the campaign's destination matches the
   booking's service/profile. Stamp source =
   `commission_source_assignment_id`; rate copied from the assignment.
   **Phase 1.5 general path** (`owner_affiliate_type='general'`): the
   campaign's `destination_service_template_id` resolves to a
   `service_templates` row with `is_general=true` AND
   `affiliate_program_enabled=true`. Stamp source =
   `commission_source_template_id`; rate copied from the template, with
   `commission_type ?? 'percent'` and `commission_value ?? 10` defaults
   applied when admin enabled the program but didn't set explicit values
   (decision #3 of §10).
4. The affiliate's `affiliate_accounts.status` is `active` (not `blocked`
   or `unclaimed`).

If any check fails, all four stamp columns stay NULL and no commission
will be credited when the webhook fires — the booking proceeds normally
and the
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
3. **Per-diviner gate.** If the linked campaign's source assignment is
   revoked (`diviner_service_affiliates.is_active=false`), respond with
   a "This link is no longer active" page (static, branded, 307→
   `/link-not-active`). No click is logged.
   **Phase 1.5 — general gate (step 3b).** When the campaign's
   `owner_affiliate_type='general'` and the destination
   `service_templates.affiliate_program_enabled=false`, the same
   `/link-not-active` 307 fires. Default-rate path (program enabled +
   NULL `commission_value`) passes the gate; the 10% default is applied
   later at booking-stamp time.
4. Otherwise: resolve the destination URL via
   `resolveCampaignDestination` (general → `/services/<slug>`,
   per-diviner SERVICE → `/<username>/services/<slug>`, per-diviner
   PROFILE → `/<username>`), log to `campaign_clicks` (fire-and-forget,
   full analytics payload — for general campaigns the click row's
   `affiliate_id` and `affiliate_type` are coerced to NULL because the
   pre-Phase-1.5 CHECK on `campaign_clicks.affiliate_type` only allows
   `diviner_affiliate`/`social_advocate`), 307-redirect to destination
   with `?ref=<campaign_code>` appended **and** set the `aff_ref` cookie
   (30-day attribution window — see §3.7 for the full attribute set).
   The cookie is the durable carrier when in-site navigation drops the
   URL param; URL still wins when both are present at booking time.

### Flow E — Customer books (rate stamped onto the booking)

**Actor:** customer (via booking API).
**Endpoint:** booking creation (e.g. `POST /api/bookings`, or whichever
route creates a `bookings` row).

Steps:
1. Booking row is inserted with the usual fields plus `ref_code`. The
   client reads the URL `?ref=` query param first, falling back to the
   `aff_ref` cookie set at `/r/<code>` (see §3.7). URL wins on
   conflict (last-touch via fresh click); cookie covers organic
   navigation that drops the URL param. Field is POSTed as `refCode`
   on the booking-payment endpoint.
2. If `ref_code` is present, resolve the campaign and fork:
   - Campaign with matching `campaign_code`, `status='active'`,
     `owner_type='affiliate'`.
   - **Per-diviner branch** (`owner_affiliate_type='diviner_affiliate'`):
     check `campaign.source_assignment_id` resolves to an
     `diviner_service_affiliates` row with `is_active=true`; destination
     match between campaign and the booked service/profile; affiliate's
     `affiliate_accounts.status = 'active'`.
   - **Phase 1.5 general branch** (`owner_affiliate_type='general'`):
     check `campaign.destination_service_template_id` resolves to a
     `service_templates` row with `affiliate_program_enabled=true`;
     account `affiliate_accounts.status = 'active'`. Rate read from
     the template (`commission_type ?? 'percent'`,
     `commission_value ?? 10`).
3. If ALL per-diviner checks pass, stamp the booking:
   - `commission_source_assignment_id = assignment.id`
   - `commission_source_template_id   = NULL`
   - `commission_rate_type_stamp      = assignment.commission_type`
   - `commission_rate_value_stamp     = assignment.commission_value`
   If ALL general-branch checks pass:
   - `commission_source_assignment_id = NULL`
   - `commission_source_template_id   = template.id`
   - `commission_rate_type_stamp      = template.commission_type ?? 'percent'`
   - `commission_rate_value_stamp     = template.commission_value ?? 10`
4. If any check fails, leave the stamp columns NULL. The booking
   proceeds; no commission will be credited when it's paid.

### Flow F — Customer pays (conversion written from stamped rate)

**Three independent trigger paths**, all calling the same idempotent
`creditAffiliateConversion` library function. Race-safe via the
`UNIQUE(booking_id)` index on `campaign_conversions`: first write wins,
subsequent attempts surface PG `23505` and short-circuit as a no-op.
Each callsite wraps the credit call in a `try/catch` that logs and
continues — credit failures DO NOT propagate to Stripe (so no 5xx
auto-retry) and DO NOT fail the customer-visible checkout flow.

| Path | Trigger | Handler | Wins when |
|---|---|---|---|
| **A. Frontend fallback** | `BookingWizard` calls this fire-and-forget right after `stripe.confirmPayment()` succeeds client-side, before the browser navigates to `/booking/success` | [src/app/api/stripe/confirm-payment/route.ts](../../src/app/api/stripe/confirm-payment/route.ts) | Normal happy path — typically beats the webhook by hundreds of ms |
| **B. Webhook** | Stripe delivers `payment_intent.succeeded` server-to-server | [src/app/api/stripe/webhooks/route.ts](../../src/app/api/stripe/webhooks/route.ts) (event dispatch at the `case "payment_intent.succeeded"` branch) | Customer's browser closed/crashed before reaching `/booking/success`, OR the fire-and-forget POST in BookingWizard didn't complete |
| **C. Manual recovery** | Diviner clicks **"Sync payment"** on the booking detail sheet for a stuck `pending` booking | [src/app/api/stripe/sync-booking/route.ts](../../src/app/api/stripe/sync-booking/route.ts) | Both A and B failed silently |

**Localhost note:** Stripe doesn't deliver webhooks to localhost, so dev
bookings rely entirely on Path A. Stuck conversions on dev bookings
(visible via `bookings.metadata.referrer LIKE 'http://localhost%'`) are
typically Path A failures — usually a DB error swallowed by the try/catch
because local code references columns/types the dev DB hasn't migrated yet.

Steps each path runs (identical):
1. Verify the `payment_intent` succeeded with Stripe (Path A and C
   re-fetch via `stripe.paymentIntents.retrieve`; Path B trusts the
   event payload).
2. Update `bookings.status='confirmed'` and matching `orders.status='paid'` /
   `paid_at`. Subsequent paths see `confirmed`/`completed` and short-
   circuit.
3. If BOTH `booking.commission_source_assignment_id` AND
   `booking.commission_source_template_id` are NULL → no conversion
   row. Return. (Diviner keeps the full payment — see §1.)
4. **Re-check affiliate account status at credit time.** Resolve the
   affiliate account differently per stamp source:
   - Per-diviner: assignment → junction → account.
   - Phase 1.5 general: `campaign.owner_affiliate_account_id` directly.

   Check `affiliate_accounts.status`. If it is not `'active'` (i.e.
   `blocked` or `unclaimed`) → no conversion row written. Log reason
   `account_not_active_at_credit`, return. The diviner keeps the full
   payment.

   Rationale: account blocking is an enforcement action (fraud, TOS
   violation). Unlike rate edits, which are commercial and respect
   in-flight bookings, blocking must freeze payouts even for bookings
   already stamped. This is the only check that re-reads state at
   credit time — everything else comes from the stamp. **Notably the
   general path does NOT re-check `service_templates.affiliate_program_enabled`:**
   admin disabling the program after a booking is stamped does not
   retroactively invalidate the stamp (rate-stamping invariant).
5. Otherwise, call `creditAffiliateConversion`:
   - Compute `commission_amount_cents` from `commission_rate_type_stamp` +
     `commission_rate_value_stamp` + the order amount.
   - INSERT into `campaign_conversions`:
     - `affiliate_id` = junction id (per-diviner) OR NULL (general)
     - `affiliate_type` = `'diviner_affiliate'` OR `'general'`
     - `affiliate_account_id` = the resolved account.id (always populated)
     - `campaign_id` = resolved from booking's `ref_code`
     - `rate_type_used` = `booking.commission_rate_type_stamp`
     - `rate_value_used` = `booking.commission_rate_value_stamp`
     - `booking_id` = booking.id (UNIQUE — guards multi-path races and
       webhook retries)
   - The stamped RATE is authoritative. Only `affiliate_accounts.status`
     is re-read at credit time.
6. Commission row is IMMEDIATELY part of the affiliate's ledger. No
   admin approval step.
7. Affiliate notifications: in-app immediately, email digested daily.

**Diagnostic log prefixes** when credit fails:
- Path A: `[confirm-payment] Affiliate conversion credit failed`
- Path B: `[affiliate_conversion] credit failed`
- Path C: `[sync-booking] Affiliate conversion credit failed`

Plus the inner `creditAffiliateConversion` always emits a structured
`{event:"affiliate_conversion", matched:bool, reason:string, ...}` log
line covering: `no_stamp` / `assignment_gone` / `junction_gone` /
`account_not_active_at_credit` / `campaign_missing_at_credit` /
`campaign_missing_account_id` / `insert_error` / `already_credited`.

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

### Phase 1.5 — General-product affiliate commissions (designed 2026-04-28, not yet implemented)

**Why it exists:** Phase 1 only models per-diviner-assignment commissions
(`diviner_service_affiliates`). The platform also has a parallel general-
product catalog (`service_templates` rows cloned with `general-` slug
prefix per migration `20260421000002_add_general_service_templates.sql`)
where customers book without pre-selecting a diviner — the slot picker
assigns one at booking time. Affiliates should be able to share these
general landing pages and earn commission on the resulting bookings.

**Locked design decisions** (from 2026-04-28 discussion — do not
relitigate without explicit approval):

1. **Eligibility** — every `affiliate_accounts.status='active'` row is
   auto-eligible. No opt-in table, no enrollment UI, no membership
   state. Webhook fraud gate (Flow F step 3, account-status='active')
   is the sole eligibility check at credit time.
2. **Rate setting** — admin only. A single global rate per general
   `service_templates` row, no per-affiliate override. Visible to
   affiliates on `/affiliate/products` (general section).
3. **Default + disabled-program semantics** — when an admin hasn't
   set a rate (`commission_value IS NULL` AND `affiliate_program_enabled=true`),
   the system defaults to **10%**. When the admin has explicitly disabled
   the program for a template (`affiliate_program_enabled=false`), the
   `/r/<code>` handler returns **410** for any affiliate share URL
   pointing at it (parallel to revoked-assignment behavior in Flow D
   step 3) and `resolveStampForBooking` does NOT stamp the booking.
4. **Rate-edit notifications + history** — **no notification fires** to
   affiliates when admin changes a general template's rate (potentially
   thousands of recipients). **No `service_template_commission_history`
   table** is added — admin-managed rate changes are not commercial
   negotiations and don't need an audit trail in this system.
   Affiliates see the *current* rate on `/affiliate/products`. The
   rate-stamping invariant (§3.8) means in-flight bookings keep their
   stamped rate regardless of admin edits.
5. **Campaign anchoring** — campaigns gain a new column
   `affiliate_campaigns.owner_affiliate_account_id` (UUID, nullable)
   pointing directly at `affiliate_accounts.id`. General-product
   campaigns use this column; per-diviner campaigns continue to use
   `owner_affiliate_id` (junction). The `owner_affiliate_type` enum
   adds the value `'general'`. This avoids the misleading admin/
   diviner views that arise from anchoring general campaigns on an
   arbitrarily-picked junction.
6. **Affiliate type scope** — Phase 1.5 applies to **diviner-affiliates
   only**. `social_advocates` are a separate identity (per project
   memory `project_affiliate_vs_advocate_identity.md`) and are not in
   scope.

Carried-over invariants from Phase 1 (no change):
- Rate-stamping at booking creation (§3.8)
- Webhook account-status fraud gate (Flow F step 3)
- Webhook idempotency via `campaign_conversions.booking_id` UNIQUE
- Reversal flow (Flow J) — admin reverses general conversions the same way
- Admin emergency overrides (Flow K) — same endpoints work; archive logic
  needs to handle scope lookup via `owner_affiliate_account_id` too
- RLS isolation (§8) — affiliate-side policies extend with one
  `OR owner_affiliate_account_id = current_affiliate_account_id()` clause

**Schema additions (single migration):**

```sql
-- 1. Per-template commission config + program flag
-- IMPORTANT: enum is ('percent','flat') not ('percentage','flat').
-- 'percentage' is a System A leftover; the v2 stamp pipeline rejects
-- anything outside ('percent','flat') via the existing CHECK on
-- bookings.commission_rate_type_stamp. Original Phase 1.5 design wrote
-- 'percentage' which would break every general-product booking insert;
-- corrected at implementation time (2026-04-30).
ALTER TABLE service_templates
  ADD COLUMN commission_type TEXT
    CHECK (commission_type IS NULL OR commission_type IN ('percent','flat')),
  ADD COLUMN commission_value NUMERIC(10,4),
  ADD COLUMN affiliate_program_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_general BOOLEAN NOT NULL DEFAULT FALSE;
-- is_general was added at implementation time (not in the original
-- Phase 1.5 design) and backfilled from `slug LIKE 'general-%'` so
-- the discriminator doesn't depend on slug parsing.
-- Only meaningful on general templates. Diviner-specific rows leave
-- these NULL/FALSE.

-- 2. Campaign anchoring for non-junction owners
ALTER TABLE affiliate_campaigns
  ADD COLUMN owner_affiliate_account_id UUID
    REFERENCES affiliate_accounts(id) ON DELETE RESTRICT;

-- Allow 'general' as a third value of owner_affiliate_type
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_affiliate_type_check;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_affiliate_type_check
  CHECK (owner_affiliate_type IS NULL
      OR owner_affiliate_type IN ('diviner_affiliate','social_advocate','general'));

-- Tighten owner_consistency to require account_id when type='general'
ALTER TABLE affiliate_campaigns
  DROP CONSTRAINT IF EXISTS affiliate_campaigns_owner_consistency;
ALTER TABLE affiliate_campaigns
  ADD CONSTRAINT affiliate_campaigns_owner_consistency CHECK (
    (owner_type = 'diviner'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NULL
      AND owner_affiliate_type IS NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type IN ('diviner_affiliate','social_advocate')
      AND owner_affiliate_id IS NOT NULL
      AND owner_affiliate_account_id IS NULL
      AND source_assignment_id IS NOT NULL)
    OR (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_id IS NULL
      AND owner_affiliate_account_id IS NOT NULL
      AND source_assignment_id IS NULL
      AND destination_service_template_id IS NOT NULL)
  );

-- 3. Booking stamp source for general program
ALTER TABLE bookings
  ADD COLUMN commission_source_template_id UUID
    REFERENCES service_templates(id) ON DELETE SET NULL;
-- Parallel to commission_source_assignment_id; populated when the
-- booking was stamped via the general-program path.

-- 4. Conversion account-direct attribution
ALTER TABLE campaign_conversions
  ADD COLUMN affiliate_account_id UUID REFERENCES affiliate_accounts(id);
-- Always populated by creditAffiliateConversion (resolved from junction
-- for per-diviner credits, set directly for general credits). Lets
-- account-level rollups skip the junction join.

-- 5. RLS extension on the campaign affiliate-side policy
DROP POLICY IF EXISTS affiliate_sees_own_campaigns ON affiliate_campaigns;
CREATE POLICY affiliate_sees_own_campaigns ON affiliate_campaigns
  FOR SELECT USING (
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'diviner_affiliate'
      AND owner_affiliate_id IN (SELECT public.current_affiliate_junction_ids()))
    OR
    (owner_type = 'affiliate'
      AND owner_affiliate_type = 'general'
      AND owner_affiliate_account_id = public.current_affiliate_account_id())
  );
-- Mirror the INSERT + UPDATE policies in the same shape.

-- 6. Implementation-time follow-ups (not in original Phase 1.5 design;
-- discovered + folded into the same migration on 2026-04-30):
--   (a) tracking_links.diviner_id was NOT NULL — broken for general
--       campaigns which have no specific diviner. Drop NOT NULL; FK to
--       diviners(id) ON DELETE CASCADE preserved.
ALTER TABLE tracking_links
  ALTER COLUMN diviner_id DROP NOT NULL;

--   (b) admin_action_log extensions for the new bulk-rate endpoint at
--       /api/admin/service-templates/bulk-set-commission. Bulk actions
--       affect many rows so single-target audit doesn't fit; payload
--       JSONB carries structured action data (commission_type,
--       commission_value, updated_count); CHECK on action_kind extended
--       with the new value.
ALTER TABLE admin_action_log
  ALTER COLUMN target_resource_id DROP NOT NULL;

ALTER TABLE admin_action_log
  ADD COLUMN payload JSONB;

ALTER TABLE admin_action_log
  DROP CONSTRAINT admin_action_log_action_kind_check;
ALTER TABLE admin_action_log
  ADD CONSTRAINT admin_action_log_action_kind_check
  CHECK (action_kind IN (
    'affiliate_assignment_revoked',
    'affiliate_campaign_archived',
    'affiliate_conversion_reversed',
    'service_templates_bulk_commission_update'
  ));
```

`service_templates` RLS: admin (service_role) FOR ALL; everyone else
SELECT-only (these rows are public landing-page content). Already the
de-facto state — the new columns inherit the existing posture and don't
need new policies.

**Stamp logic (new branch in `src/lib/affiliate-stamp.ts`):**
- After resolving the campaign by `ref_code`:
  - If `campaign.owner_affiliate_type = 'general'`:
    - Look up `service_templates` by `campaign.destination_service_template_id`.
    - If `affiliate_program_enabled = false` → `reason: 'program_disabled'`,
      no stamp. (`/r/<code>` handler returns 410 BEFORE reaching this point;
      this is the secondary check.)
    - Re-check `affiliate_accounts.status='active'` for
      `campaign.owner_affiliate_account_id`.
    - Stamp `bookings.commission_source_template_id` +
      `commission_rate_type_stamp` (from `service_templates.commission_type`,
      defaulting to `'percent'` if NULL — see deviation note in the
      schema block above) +
      `commission_rate_value_stamp` (from `service_templates.commission_value`,
      **defaulting to 10 when NULL**).
  - If `campaign.owner_affiliate_type = 'diviner_affiliate'`: existing
    Phase 1 branch unchanged.

**Conversion write logic (`creditAffiliateConversion`):**
- Always sets `campaign_conversions.affiliate_account_id`. For per-
  diviner credits, resolves it via the junction → account chain. For
  general credits, sets it directly from
  `campaign.owner_affiliate_account_id`.
- `campaign_conversions.affiliate_id` stays nullable: populated for
  per-diviner credits (junction id), NULL for general credits.

**`/r/<code>` handler (new gate):**
- Existing Flow D step 3: if linked campaign's source assignment is
  revoked → 410.
- New Flow D step 3b (general): if linked campaign's
  `owner_affiliate_type = 'general'` AND its destination template has
  `affiliate_program_enabled = false` → 410. No click logged.

**Campaign creation:**
- New POST endpoint: `POST /api/affiliate/general-campaigns` body
  `{ service_template_id, name, ... }`. Verifies the template has
  `is_general = true AND affiliate_program_enabled = true`. Writes a
  campaign row with `owner_type='affiliate'`,
  `owner_affiliate_type='general'`,
  `owner_affiliate_account_id=ctx.account.id`, `owner_affiliate_id=NULL`,
  `source_assignment_id=NULL`, `destination_service_template_id=<id>`.
  Auto-generates `campaign_code` + `tracking_links` row.
- UI: `/affiliate/campaigns/new` extends to a two-mode picker
  (per-diviner via assignment, OR general via template).

**Affiliate Marketing Kit rewrite:**
- `src/components/affiliate/marketing-kit.tsx` queries
  `service_templates WHERE is_general = true AND
   affiliate_program_enabled = true` (server side).
- For each general template: lazily ensure the affiliate has a campaign
  for it. If none exists for `(affiliate_account_id, template_id)`,
  create one on first share or on Marketing Kit page-load.
- "Copy Link" button copies `?ref=<campaign_code>` (real campaign code,
  not the legacy `?ref=<junctionId>` UUID).

**Affiliate `/affiliate/products`:**
- New section "General products" sourced from
  `service_templates WHERE is_general = true AND
   affiliate_program_enabled = true`. Each card shows the current
  commission rate (`commission_value`% or default 10%) and a
  "Create campaign" CTA → `/affiliate/campaigns/new?template=<id>`.

**Admin UI:**
- `/admin/service-templates/[id]` adds three fields: `commission_type`,
  `commission_value`, `affiliate_program_enabled` toggle. Only meaningful
  when `is_general = true`. Bulk-edit helper at `/admin/service-templates`
  for setting one rate across all enabled general templates.

**Reporting touches:**
- `/admin/reports/affiliates/by-affiliate` already groups by account —
  general credits flow in seamlessly via `affiliate_account_id`.
- `/admin/reports/affiliates/by-diviner` — general conversions have
  `diviner_id IS NULL` and are excluded from this report. Correct: they
  aren't attributable to a diviner.
- `/admin/reports/affiliates/conversions` — display label: when
  `owner_affiliate_type='general'`, show `"General: <template name>"`
  instead of `"Diviner: <name>"`.
- `/affiliate/earnings` row-level display: same source-label change.

**Test coverage (Task 08-equivalent):**
- New integration test: stamp via general path with happy + program-
  disabled + account-blocked + missing rate (default-10%) cases.
- New RLS case: general campaign visible to its owner, invisible to
  another affiliate, invisible to the diviner.
- Smoke test: end-to-end click → book → pay → conversion via the
  general-program path.

**What stays out of Phase 1.5 (still Phase 2):**
- Stripe auto-split for affiliate payouts. General-program credits hit
  `campaign_conversions` the same way per-diviner credits do and surface
  on `/affiliate/earnings` as "earned, pending payout".

**Status:** Designed, not implemented. Marketing Kit at
`src/components/affiliate/marketing-kit.tsx` is currently misleading
(promises commission credit but doesn't deliver — generates
`?ref=<junctionId>` UUIDs that never match a campaign code) — **DO NOT
fix the Marketing Kit in isolation**; the underlying schema + stamp +
endpoints must land first or the fix would just hide the absence of the
feature.

#### Phase 1.5 follow-up decisions (2026-05-05)

- **`channel='marketing_kit'` is the canonical channel value for
  Marketing-Kit-spawned general campaigns.** The lazy-create in
  `fetchMarketingKitItems` (src/lib/affiliate-marketing-kit.ts) tags
  every general campaign it creates with this channel so analytics can
  attribute conversions to the Marketing Kit surface separately from
  generic 'direct'/'other'. The original
  `affiliate_campaigns_channel_check` allowlist (migration
  20260417000010) predated Phase 1.5 and rejected this value, causing
  silent insert failures and an empty Marketing Kit. Migration
  20260505000001_affiliate_campaigns_channel_marketing_kit extends the
  allowlist; deploy + run via /admin/db/migrations.

- **Inline admin editor on `/admin/service-templates`.** General-template
  rows have a new "Affiliate program" item in the row dropdown that
  opens a dialog with the same Switch + commission type/value fields as
  the per-template detail-page card. Backed by the existing
  `PATCH /api/admin/service-templates/[id]` — no new endpoint, no audit
  drift. Lets admins enable/disable affiliate programs across the
  general catalog without leaving the list.

---

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

- **2026-04-30 (Flow F clarification — three credit paths)** — Spec §5 Flow F was incomplete. It described only the Stripe webhook path (`/api/stripe/webhooks`) but production has had **three independent credit-trigger paths** since the v2 sprint: (A) frontend fallback at `/api/stripe/confirm-payment` (the BookingWizard fires this fire-and-forget right after `stripe.confirmPayment()` succeeds — typically beats the webhook); (B) the Stripe webhook itself; (C) manual recovery via `/api/stripe/sync-booking` (diviner-triggered "Sync payment" button on a stuck booking). All three call the same idempotent `creditAffiliateConversion`; the `UNIQUE(booking_id)` index on `campaign_conversions` makes them race-safe (first write wins; subsequent attempts log as `already_credited` and short-circuit). Each callsite wraps the credit call in a `try/catch` that logs+continues, so credit failures don't 5xx Stripe (no auto-retry) or break the customer's checkout. **Operational implication:** localhost dev bookings rely entirely on Path A because Stripe doesn't deliver webhooks to localhost — stuck dev conversions are typically Path-A failures (e.g., a column-mismatch swallowed by the try/catch). Path-specific log prefixes: `[confirm-payment]`, `[affiliate_conversion]`, `[sync-booking]`. Flow F now documents all three paths + the diagnostic reason codes emitted by the inner credit function.

- **2026-04-30 (Phase 1.5 implementation, Tasks 01–07)** — General-product affiliate commissions implemented end-to-end across 7 commits (`ab47cb76`, `1c938875`, `87b4db7d`, `8927c670`, `e008fdf3`, `7ce83a45`, `7c7652b2`, `b67bd0a1`). Single migration `20260430000002_affiliate_phase_1_5_general` lands all schema additions; awaits admin-runner application. **Spec deviations recorded in the migration header and folded into §10 above:** (1) `service_templates.commission_type` CHECK uses `('percent','flat')` — original Phase 1.5 design wrote `'percentage'` which would have rejected every booking insert (the v2 stamp pipeline only accepts `('percent','flat')`); (2) `tracking_links.diviner_id` made NULLable — original Phase 1.5 design didn't anticipate that general campaigns have no specific diviner; (3) `admin_action_log` extended with `payload JSONB`, NULLable `target_resource_id`, and new `action_kind='service_templates_bulk_commission_update'` so the bulk-rate endpoint can audit multi-row actions without a single target; (4) `service_templates.is_general` added as the authoritative discriminator (backfilled from `slug LIKE 'general-%'`) — original design relied on slug parsing only. **Stamp + credit (`affiliate-stamp.ts`, `affiliate-attribution.ts`)** branched on `owner_affiliate_type='general'`: stamp resolves account directly from campaign, gates on `affiliate_program_enabled`, defaults to `(percent, 10)` when admin enabled the program but didn't set values; credit writes `affiliate_id=NULL`, `affiliate_type='general'`, `affiliate_account_id` from campaign. Per-diviner credits now also always populate `affiliate_account_id` (resolved via junction) so account-level rollups can skip the junction join. **`/r/[code]` handler** gained the disabled-template 410 gate (Flow D step 3b) and the campaign-destination resolver gained a general branch routing to `/services/<slug>` instead of the `/readings/<slug>` SEO-marketing tree (a Task 03 hotfix correcting an initial wrong path). **New endpoint** `POST /api/affiliate/general-campaigns` parallel to the per-diviner endpoint; archive PATCH at `/api/affiliate/campaigns/[id]` extended to accept general campaigns. **Affiliate UI**: `/affiliate/dashboard` + `/affiliate/products` + `/affiliate/campaigns` (list + detail) + `/affiliate/campaigns/new` (two-mode picker) + Marketing Kit fully rewritten — kit now sources templates from DB and lazy-creates one general campaign per `(account, template)` pair so every share URL is `/r/<real_code>` instead of the broken `?ref=<junctionUUID>` of the v2 era. **Admin UI**: `/admin/service-templates/[id]` AffiliateProgramCard for per-template config; bulk-rate card on the list with confirmation dialog; new "Affiliate program" + "Rate" columns. **Reporting display labels** added to admin conversions/clicks reports + affiliate earnings (`General: <template>` vs `Diviner: <name>`), and the existing reports were switched from junction-id filters to account-id filters so general credits roll up correctly. **Pre-existing v2 reporting bugs caught and fixed during the audit:** (a) `campaign_conversions.created_at`/`reversed_reason` referenced across five endpoints + two pages — real columns are `converted_at`/`reversal_reason`; (b) `campaign_clicks.ip`/`country`/`referrer` on the admin clicks endpoint — real columns are `ip_hash`/`country_code`/`referrer_url`; (c) `fmtRate` helper widened to accept both legacy `'percentage'/'fixed'` and v2 `'percent'/'flat'`. All five surfaces had been silently returning DB errors in production. **Tests (Task 08):** new `tests/integration/affiliate-phase-1-5-general-smoke.test.ts` (8 cases: schema sanity + 5 stamp-resolver paths + general credit insert + rate-stamp invariant + per-diviner `affiliate_account_id` backfill); `tests/integration/affiliate-rls.test.ts` extended with 6 cases for general-path isolation (own/foreign general campaign visibility + diviner anti-leakage + INSERT WITH-CHECK enforcement + own/foreign general conversion visibility); `package.json` aggregator `test:affiliate-commission` chains the new smoke alongside the v2 smoke + RLS + math suites; `scripts/cleanup-affiliate-test-data.ts` extended with the `phase15-` namespace prefix. Manual E2E walkthrough on preview pending. Implementation notes in `docs/tasks/2026-04-28/affiliate-phase-1-5-general-products/IMPLEMENTATION-NOTES.md`.

- **2026-04-30** — Cookie-capture ref persistence shipped (commit `dd1b43c0`). `/r/[code]` now sets a first-party `aff_ref` cookie (30-day `Max-Age`, `SameSite=Lax`, `Secure` in prod, not `HttpOnly`) on the 307 happy campaign-link path; never on the 410 / `/link-not-active` paths so revoked attribution can't leak. `BookingWizard` reads `aff_ref` as a fallback when the URL has no `?ref=` and POSTs the value as `refCode` (renamed from the silent-bug field name `affiliateCode`, which the booking API was destructuring but never feeding into `resolveStampForBooking`). Three independent breaks closed in two file edits: (1) ref-loss when reading-page → diviner-card navigation drops the URL param; (2) ref-loss on organic returns within the 30-day window; (3) field-name mismatch that meant even direct `/r/<code>` → book flows never stamped. Spec §3.7, §3.8 condition 1, §5 Flow D step 4, §5 Flow E step 1 updated. Forward-compatible with Phase 1.5: cookie name and value are owner-type-agnostic, `resolveStampForBooking` remains the single decision point. Sprint plan: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/`.
- **2026-04-28 (Phase 1.5 design)** — General-product affiliate commissions designed. New §10 Phase 1.5 section with locked decisions: (1) all active affiliate accounts auto-eligible (no opt-in); (2) admin-only writes on `service_templates.commission_*` (single global rate per template); (3) `commission_value IS NULL AND affiliate_program_enabled=true` defaults to 10%; (4) `affiliate_program_enabled=false` returns 410 from `/r/<code>`; (5) skip rate-edit notification + no `service_template_commission_history` table — affiliates see current rate on `/affiliate/products`; (6) new column `affiliate_campaigns.owner_affiliate_account_id` to anchor general-program campaigns directly on the account (avoids the misleading admin views from anchoring on an arbitrarily-picked junction); (7) scope is `diviner_affiliates` only — `social_advocates` are out per their distinct identity model. Schema migration adds `service_templates.{commission_type, commission_value, affiliate_program_enabled}`, `affiliate_campaigns.owner_affiliate_account_id`, extends `owner_affiliate_type` enum with `'general'`, tightens `owner_consistency` CHECK, adds `bookings.commission_source_template_id`, and `campaign_conversions.affiliate_account_id` (always populated). Stamp logic gets a general-path branch in `resolveStampForBooking`. New `POST /api/affiliate/general-campaigns` endpoint. Marketing Kit rewrites to use real campaign codes. Spec is the contract — implementation sprint to follow.
- **2026-04-28** — Audit-driven follow-up cleanup. Two findings from a route-by-route v2-alignment audit: (1) `/admin/campaigns` still carried pre-v2 commission/budget/status surfaces — symmetric to yesterday's `dashboard/campaigns` cleanup. Removed `draft` + `completed` from STATUS_BADGE map / status filter / edit-modal options (CHECK rejects them post-01b); removed Commission Type / Commission % / Budget Cap from create + edit forms (state + setters + POST/PATCH bodies + UI blocks); removed `formTargetProduct` (no UI but still POSTed); dropped the "Commission" sortable column + cell from the table. (2) `/admin/reports/payouts` had a real lookup bug: the API joined `campaign_conversions.affiliate_id` (a `diviner_affiliates.id` in v2) against the legacy `affiliates` table (different ID namespace from System A), so every row's `affiliateName` rendered as "Unknown" and `referralCode` was always null. Fixed `src/app/api/admin/reports/payouts/route.ts` to query `diviner_affiliates` joined to `affiliate_accounts` (correct namespace, canonical v2 name) and dropped `referralCode` from the response interface (System A concept; v2 stores codes on `affiliate_campaigns`, not per-junction). Page-side dropped the matching column. `pendingAmount` preserved unchanged — explicit Phase 2 placeholder ("everything not reversed is pending payout until Stripe auto-split ships"), source comment in `route.ts:225`.
- **2026-04-27** — Task 08 partial landing + post-sprint dead-UI sweep. Tests: Part A RLS suite (`tests/integration/affiliate-rls.test.ts`, 12 cases, anon-key + JWT, proves DB-layer isolation) and Part C unit suite (`tests/unit/affiliate-commission-math.test.ts`, 23 cases for `computeCommissionCents`) shipped. Part B (8 separate flow files) and Part D (Playwright E2E) deferred — smoke + RLS already cover the core invariants. **RLS migrations (3 ran sequentially):** `20260427000002_affiliate_rls_v2_alignment.sql` rewrote 4 affiliate-side SELECT policies for the v2 junction model (pre-v2 they assumed `*.affiliate_id = auth.uid()`; v2 makes affiliate_id a `diviner_affiliates.id`); `20260427000003_affiliate_junction_select_policy.sql` added the missing `affiliate_sees_own_junctions` policy on `diviner_affiliates` (without it, the IN-subquery in every child policy returned empty under RLS); `20260427000004_affiliate_rls_security_definer.sql` broke the resulting policy cycle (`affiliate_accounts.diviner_sees_linked_accounts` ↔ `diviner_affiliates.affiliate_sees_own_junctions`) by introducing two SECURITY DEFINER helpers — `current_affiliate_junction_ids()` SETOF UUID + `current_affiliate_account_id()` UUID — and rewriting all affiliate-side policies to call them. Spec §8 promises now match what the DB actually enforces. API was always service-role (RLS bypass) so no production regression. **Dead-UI cleanup (5 commits):** deleted broken admin/affiliates/[id] page + 3 dead routes (1014 lines — page was 404'ing post-01b on `/api/admin/affiliates/[id]/commissions` + `/api/admin/commissions/[commId]`); deleted redundant `/affiliate/commissions` + `/affiliate/links` pages + endpoints + nav entries (589 lines — both duplicated `/affiliate/earnings` + `/affiliate/campaigns`); removed pre-v2 `commission_type` / `commission_value` / `budget_cap_cents` / `target_product_type` form fields from the diviner Create Campaign modal, the Edit modal, and the detail page (Commission KPI tile + Budget Progress card removed since diviner-owned campaigns never credit commission per Flow B); trimmed `draft` + `completed` from every `/dashboard/campaigns` status enum surface (CHECK rejects them post-01b); removed dead approval-state branches (pending / on_hold / approved / paid / rejected) from affiliate earnings `statusBadge` and tightened its signature to `'earned' | 'reversed'`; removed dead `Delete` button + `handleDelete` handler from campaign detail (gated on impossible `status === 'draft'`). **Test cleanup tooling:** `scripts/cleanup-affiliate-test-data.ts` (npm run `cleanup:affiliate-test-data`, dry-run default, `--apply` to delete) targets `v2-smoke` / `rls` / `probe` email patterns and cascades through the FK chain.
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
