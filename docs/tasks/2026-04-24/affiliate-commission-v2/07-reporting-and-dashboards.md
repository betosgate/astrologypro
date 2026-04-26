# Task 07 — Reporting + Dashboards + Admin Overrides

- Status: Phase A done (2026-04-24). Phase B (report APIs) + Phase C (UI) deferred to follow-up sprint.
- Priority: P1
- Depends on: 01, 02, 04
- Blocks: —
- Spec: v1.2 (§4, §5 Flow K, §6, §7)

## Goal

Build the three role-scoped reporting surfaces defined in spec §6. APIs
first, then pages. Every query enforces scope in the WHERE clause AND is
backed by RLS (task 01 / task 08).

## Part A — Admin reporting APIs

File root: `src/app/api/admin/reports/affiliates/`

| Route | Returns |
|---|---|
| `overview/route.ts` | Platform totals: clicks, conversions, commission this period |
| `by-diviner/route.ts` | Grouped by `affiliate_campaigns.diviner_id` |
| `by-affiliate/route.ts` | Grouped by `owner_affiliate_id` for affiliate-owned campaigns |
| `clicks/route.ts` | Paginated click log (filters: date, country, diviner, affiliate, bot/human) |
| `conversions/route.ts` | Paginated conversion log (filters + drill) |
| `rate-history/route.ts` | `diviner_service_affiliate_rate_history` list |

All gated by `getAdminUser`.

## Part B — Diviner reporting APIs

File root: `src/app/api/dashboard/affiliate-reports/`

| Route | Scope filter |
|---|---|
| `overview/route.ts` | `affiliate_campaigns.diviner_id = me` |
| `by-affiliate/route.ts` | Grouped by `affiliate_id` within caller's assignments |
| `by-affiliate/[id]/route.ts` | Single affiliate detail — clicks, conversions, rate history, campaigns — but ONLY the slice tied to caller's own assignments |
| `clicks/route.ts` | `campaign_clicks` where campaign's `diviner_id = me` |
| `conversions/route.ts` | `campaign_conversions` where campaign's `diviner_id = me` |

Gated by presence of a `diviners` row for the caller.

## Part C — Affiliate reporting APIs

File root: `src/app/api/affiliate/reports/`

| Route | Scope filter |
|---|---|
| `overview/route.ts` | Sum of `campaign_conversions WHERE affiliate_id IN me.junction_ids AND reversed_at IS NULL` |
| `my-products/route.ts` | `diviner_service_affiliates WHERE affiliate_id IN me.junction_ids AND is_active = true` |
| `rate-history/route.ts` | Rate history rows for caller's assignments |
| `by-campaign/route.ts` | Grouped by `campaign_id` for campaigns caller owns |
| `by-campaign/[id]/route.ts` | Single-campaign drill |

Gated via resolving caller through `affiliate_accounts`.

### Pagination rules (all list endpoints)

- Deterministic `ORDER BY <primary timestamp> DESC, id DESC` with a
  unique tie-breaker (CLAUDE.md §16).
- Cursor-based pagination, not offset.
- Default page size 25, max 100.
- Response shape: `{ data, nextCursor, hasMore }`.

## Part D — UI: admin dashboard

Add under `src/app/admin/affiliates/reports/`:

- `page.tsx` — overview
- `by-diviner/page.tsx`
- `by-affiliate/page.tsx`
- `clicks/page.tsx`
- `conversions/page.tsx` (with row-level "Reverse" button → opens modal
  calling `/api/admin/conversions/[id]/reverse`)
- `rate-history/page.tsx`

Reuse existing admin layout + chart components.

## Part E — UI: diviner dashboard

Reporting + assignment management live under `src/app/dashboard/affiliates/`:

- `page.tsx` — list of affiliates working with me, with KPIs (clicks,
  conversions, commission this period).
- `[id]/page.tsx` — per-affiliate detail (caller's slice only). Includes
  rate-history timeline for that assignment.
- `new/page.tsx` — "Assign affiliate" form (POST `/api/dashboard/affiliate-assignments`).
  **Verify first** whether this already exists in today's code; the POST
  endpoint exists at [route.ts:206](../../../src/app/api/dashboard/affiliate-assignments/route.ts#L206)
  but the form may not. If present, extend to match the updated body
  (`destination_type` / `commission_type` / `commission_value`).
- `assignments/[id]/edit/page.tsx` — rate edit form calling
  `PATCH /api/dashboard/affiliate-assignments/[id]`. Includes a
  "Revoke assignment" button that calls the same endpoint with
  `is_active=false` and confirms via modal before submission.

Diviner's own promo campaigns (not affiliate-owned) live under
`src/app/dashboard/campaigns/`:

- `page.tsx` — **verify / build** the list of the diviner's own
  campaigns (`owner_type='diviner'`, `diviner_id = me`). The POST endpoint
  exists today at [route.ts:162](../../../src/app/api/dashboard/campaigns/route.ts#L162);
  confirm the list page exists and shows `status` accurately after the
  enum trim in task 01b.
- `[id]/page.tsx` — per-campaign detail with KPIs + lifecycle actions
  (pause / resume / archive). PATCH endpoint likely exists; verify it
  supports the trimmed status enum (`active|paused|archived|expired`)
  after task 01b.

Diviner notifications (they receive `admin.override.*` kinds per spec §7):

- `notifications/page.tsx` — inbox reading `notifications WHERE user_id = me`.
- `notifications/preferences/page.tsx` — per-kind per-channel toggles
  stored in `notification_preferences`. Same component as the affiliate's
  preference page — reuse.

## Part F — UI: affiliate dashboard

Extend existing `src/app/affiliate/(portal)/`:

- `assignments/page.tsx` (new) — list active assignments with current
  rate per diviner per product
- `campaigns/page.tsx` — **verify / build** the list of the affiliate's
  own campaigns (across all assignments), with per-campaign KPIs. Today's
  `src/app/affiliate/(portal)/campaigns/page.tsx` may already exist; if
  so, extend it to use the new `/api/affiliate/reports/by-campaign`
  endpoint and include an archive action
- `campaigns/new/page.tsx` (new) — form calling
  `POST /api/affiliate/assignments/[id]/campaigns`. Must be reached via
  the assignments list (pick an assignment → create campaign for it)
  AND the campaigns list (top-level "New campaign" button that prompts
  for assignment choice)
- `campaigns/[id]/page.tsx` (new) — per-campaign detail with
  clicks/conversions drilldown + archive button
- `rate-history/page.tsx` (new) — per spec §6.3, list of rate-history
  rows for the caller's assignments. Read-only, reverse chronological,
  grouped by assignment
- `notifications/page.tsx` (new) — inbox reading `notifications` table
- `notifications/preferences/page.tsx` (new) — per-kind per-channel
  toggles stored in `notification_preferences` (spec §3.6 + §7). All
  7 kinds listed
- Earnings page (`earnings/page.tsx` already exists) — verify it still
  works after System A removal; refactor if it was reading
  `affiliate_commissions`. After task 02 this should be reading
  `campaign_conversions`. Confirm it's displaying `rate_value_used`
  correctly (post-task 04)

### Additional admin-side endpoints that MUST be handled before Task 01b

Discovered during Task 02 grep sweep; not caught by the initial survey.
Each still reads System A tables. Leaving these alive would crash admin
pages the moment Task 01b drops the legacy tables.

| File | Current reads | Required action |
|---|---|---|
| `src/app/api/admin/reports/affiliates/route.ts` | `affiliate_commissions` | Rewrite to read `campaign_conversions` + `campaign_clicks` scoped via `affiliate_campaigns.diviner_id`. Rebuild as part of Task 07 Part A. |
| `src/app/api/admin/reports/payouts/route.ts` | `affiliate_commissions` | Phase 2 scope. Return empty for now, or delete — payouts don't exist until Stripe auto-split lands. |
| `src/app/api/admin/reports/operations/route.ts` | `affiliate_commissions` | Rewrite against `campaign_conversions` for operations metrics. |
| `src/app/api/admin/affiliates/[id]/payouts/route.ts` | `affiliate_payouts` + `affiliate_commissions` | Phase 2 scope. Delete or stub. |
| `src/app/api/admin/refunds/route.ts` | `affiliate_commissions` | Rewrite the `affiliate_commissions` read path to `campaign_conversions` (reads the commission linked to a refundable booking). Admin-initiated refunds flow through the reversal endpoint (Task 05 Part B). |

**Gate:** Task 01b cannot run until `git grep -wE
"affiliate_commissions|affiliate_referral_links|affiliate_clicks|
affiliate_payouts|affiliate_commission_history" -- 'src/**'` returns zero
non-comment hits. Task 07 must close these five files before that grep
can pass.

### Existing portal pages that MUST be refactored (discovered 2026-04-24)

Task 02 now includes these as part of the System A retirement, but
call them out here too since they're affiliate-visible:

- `src/app/affiliate/(portal)/dashboard/page.tsx` — **the landing page
  after login.** Currently reads `affiliate_commissions` (line 91) +
  `affiliate_referral_links` (line 95). Rewire to `campaign_conversions`
  (KPI sums) + `affiliate_campaigns WHERE owner_affiliate_id IN
  junction_ids` (share link list).
- `src/app/affiliate/(portal)/partnerships/page.tsx` — currently reads
  `affiliate_commissions` (line 80). Rewire to `campaign_conversions
  GROUP BY affiliate_id` joined to `diviner_affiliates`.
- `src/app/api/affiliate/dashboard/route.ts` — currently reads
  `affiliate_referral_links`. Rewire to `affiliate_campaigns`. This is
  probably what powers the dashboard page above.
- `src/app/api/affiliate/links/route.ts` — currently reads
  `affiliate_referral_links`. Rewire to `affiliate_campaigns`.

If these aren't refactored BEFORE task 01b, every affiliate hits HTTP
500 on login. That's a deploy blocker.

## Part G — Admin emergency overrides (Flow K)

Spec §5 Flow K requires three admin actions, each backed by:
- An endpoint that writes the effect + an `admin_action_log` row +
  dual notifications (diviner + affiliate).
- A UI button on the admin dashboard with a confirmation modal that
  requires a reason (min 5 chars).

### Endpoints (backend)

| Endpoint | File | Effect |
|---|---|---|
| `POST /api/admin/affiliate-assignments/[id]/revoke` | `src/app/api/admin/affiliate-assignments/[id]/revoke/route.ts` (new) | Flips `is_active=false` on `diviner_service_affiliates`, sets `revoked_at=NOW()`, `revoked_by=admin_user_id`. Auto-pause trigger handles dependent campaigns. |
| `POST /api/admin/affiliate-campaigns/[id]/archive` | `src/app/api/admin/affiliate-campaigns/[id]/archive/route.ts` (new) | Sets `affiliate_campaigns.status='archived'`. |
| `PATCH /api/admin/conversions/[id]/reverse` | Already specified in task 05 Part B | No change — task 05 builds this. Just make sure the admin_action_log write lands here too. |

Common handler pattern for all three:
1. `getAdminUser()` — 403 if not admin.
2. Validate body `{ reason: string }` — required, min 5 chars, max 500.
3. Perform the mutation in a transaction.
4. INSERT `admin_action_log` row (action_kind, target_resource_type,
   target_resource_id, reason, admin_user_id).
5. Resolve affected parties (affiliate's user_id + diviner's user_id).
6. Fire `notifyAffiliate({ kind: 'admin.override.<kind>', ... })` and
   a matching notification to the diviner. Both in-app + email.

### UI (frontend)

On each admin report page under `src/app/admin/affiliates/reports/`,
add row-level "Force revoke" / "Force archive" / "Reverse" buttons
that open a confirmation modal with a required reason textarea.

The modal:
- Title: action + target summary (e.g. "Force-revoke assignment
  <diviner-name> → <affiliate-name>").
- Body: explains what the action does (pulled from spec §5 Flow K).
- Required field: reason textarea, min 5 chars.
- Submit: calls the endpoint; on 2xx, refresh the table; on 4xx/5xx,
  surface the Problem+JSON detail.

### Admin action log view

Add `src/app/admin/affiliates/reports/actions/page.tsx` — reverse-
chronological list of all admin overrides from `admin_action_log`,
with filters (action_kind, admin_user_id, date range). Gives ops a
paper trail for incident reviews.

## Part H — Cross-cutting UI work

### H.1 Navigation updates

Every new page needs a menu entry. Verify each role's sidebar / top-nav
and add links:

- `src/app/admin/layout.tsx` — add "Affiliate Reports", "Click Log",
  "Conversion Log", "Rate Audit", "Admin Actions" entries under an
  "Affiliates" parent
- `src/app/dashboard/layout.tsx` — add "Affiliates" parent with
  "My Affiliates", "Campaigns", "Notifications" entries
- `src/app/affiliate/(portal)/layout.tsx` — add "Campaigns", "Rate
  history", "Notifications" entries. "Campaigns" and "Earnings" may
  already exist; extend rather than duplicate

### H.2 Empty states (WCAG 2.2 + CLAUDE.md §2)

Design and implement empty-state components for:
- "No affiliates yet" (diviner overview)
- "No assignments yet" (affiliate my-products)
- "No campaigns yet" (affiliate campaigns list)
- "No conversions yet" (all earnings / conversion views)
- "No notifications" (both inboxes)
- "No rate changes" (rate history view)
- "No admin actions yet" (admin action log)

Each should have a short helpful sentence + a next-step CTA where
appropriate (e.g. "Invite your first affiliate" on the diviner view).

### H.3 Loading + Suspense (CLAUDE.md §17)

For every new server-rendered page, add a sibling `loading.tsx` so the
route shell appears immediately while slower sections stream. Wrap
expensive subtrees (KPI card row, chart, tables) in `<Suspense>` with
skeleton fallbacks.

### H.4 Existing-UI verification checklist

Before building a new page, grep the codebase to check if a near-
equivalent exists. If yes, extend it. If no, build fresh. Pages that
*probably* exist today but need verification against the new schema:

- [ ] `src/app/dashboard/affiliates/page.tsx` — may already show
      affiliates; ensure it queries new scope columns
- [ ] `src/app/dashboard/affiliates/new/page.tsx` — form probably exists;
      ensure it includes `destination_type` + `destination_id` fields
- [ ] `src/app/dashboard/campaigns/page.tsx` — likely exists; verify
      status enum after task 01b
- [ ] `src/app/affiliate/(portal)/campaigns/page.tsx` — may already exist
- [ ] `src/app/affiliate/(portal)/earnings/page.tsx` — confirmed exists
      (pre-sprint); refactor to post-System-A state

For each, the verifier writes one line in the sprint-signoff checklist
(task 08) confirming the page is wired to v1.2 behavior.

## Acceptance

- Admin report page loads with real aggregates from
  `campaign_clicks` / `campaign_conversions`.
- Diviner report page: another diviner's affiliate cannot appear in the
  caller's view (verify with two test users).
- Affiliate dashboard: caller sees only their own campaigns / earnings /
  rate history.
- Affiliate notification preferences page persists toggles to
  `notification_preferences`; toggling off the `affiliate.conversion`
  email disables the daily digest for that user.
- All list endpoints paginate deterministically — scroll-to-end works.
- Admin force-revoke writes `admin_action_log` row, sends notifications
  to both diviner and affiliate; confirmation modal rejects empty reason.
- Admin action log page renders reverse-chron with filters.
- Diviner dashboard has: affiliates list, per-affiliate detail, assign
  form, edit/revoke form, my-campaigns list, per-campaign detail,
  notifications inbox, notifications preferences — all reachable from
  updated nav.
- Affiliate dashboard has: my-products, my-campaigns list, campaign
  create, campaign detail, rate-history, earnings, notifications inbox,
  notifications preferences — all reachable from updated nav.
- Every new page has a `loading.tsx` and shows a non-empty empty-state
  when no data.
- Every new page passes WCAG 2.2 keyboard + screen-reader checks.
- Web Vitals (LCP < 2.5s, CLS < 0.1) pass on each new page (CLAUDE.md §2).

## Suggested files

(see Parts A–F above for exact paths)

- Spec: update §6 with any page-level deviations; Changelog
