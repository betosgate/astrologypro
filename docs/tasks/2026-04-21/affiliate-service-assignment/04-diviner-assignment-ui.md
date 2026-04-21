# Task 04 — Diviner Assignment UI

- Status: Not Started
- Priority: P0
- Depends On: Tasks 01, 02, 03
- Blocks: Task 05 (affiliates need assignments to exist before they can act on them)

## Goal

Give diviners a clean management UI for assigning affiliates to their profile or to specific enabled services, with a per-assignment commission rate. Remove the "Add Affiliate" dialog from the diviner's campaign detail page since campaigns are no longer the enrollment surface.

## Current State

- `/dashboard/affiliates` exists (generic affiliate list for the diviner).
- `/dashboard/campaigns/[id]` has an "Enrolled Affiliates" panel with Add / Remove affiliate controls — this panel becomes obsolete.

## Implementation Steps

### 1. New Assignments management tab

At `/dashboard/affiliates`, add a new tab **"Assignments"** next to the existing affiliates list.

The tab renders a single list whose grouping is controlled by a **segmented toggle** at the top:

- **"By Affiliate"** (default) — rows grouped by affiliate. One section per unique affiliate, each section lists every scope (Profile or specific Service) the affiliate holds.
- **"By Service"** — rows grouped by destination. One section per (Profile + each enabled Service), each section lists every affiliate assigned at that scope.

Same underlying rows — the view just regroups. Both groupings need their own analytical aggregates:

| Grouping | Top-level row | Nested metric |
|---|---|---|
| By Affiliate | Alice / Bob / Carol | Per-scope stats: clicks, conversions, commission |
| By Service | Profile / Solar Return / Nativity … | Per-affiliate stats on that scope |

Columns per row: Affiliate name + type, Commission (type + value), Clicks (30d), Conversions (30d), Commission earned (30d), Assigned at, Status, Actions (Edit, Revoke).

A row click opens the per-assignment detail page described in step 7.

### 2. Create Assignment dialog

Triggered by a **"+ New Assignment"** button.

Fields:
- **Scope**: segmented toggle `Profile` / `Service` (default Profile).
- **Service** (only if Scope = Service): dropdown of the diviner's enabled services (from `diviner_services` where `is_enabled=true`).
- **Affiliate**: search-as-you-type combobox (NOT a UUID paste input). Behaviour:
  - **Prefetch**: when the dropdown first opens, fetch the 5 most recently active affiliates (by last activity timestamp — latest click, conversion, or account creation). The list displays immediately with no user input.
  - **Autocomplete search**: typing filters by `display_name` (case-insensitive contains) and by `email`. Debounce 250ms. Minimum 1 character before calling the API.
  - **Row rendering**: avatar + display name + `@handle` + role badge (`Advocate` or `Diviner Affiliate`) + last-active date. Clicking selects the row and fills the hidden `affiliate_id` + `affiliate_type` form state.
  - **Empty state**: "No affiliates found. Try a different name." with a hint to platform-admin to onboard new affiliates.
  - **Already-assigned affiliates**: show with a muted "Already assigned to this scope" badge and disable the row — prevents duplicate creation at the UI layer.
- **Commission type**: `Percent` / `Flat` segmented control.
- **Commission value**: numeric input with `%` or `$` prefix based on type. Validate > 0 and ≤ 100 for percent.
- **Notes**: optional textarea (admin-facing, not shown to affiliate).

The combobox reads from a new endpoint:

```
GET /api/dashboard/affiliates/search
  ?q=<query>                         — optional; empty string returns the prefetch list
  &exclude_scope=<PROFILE|SERVICE>   — optional; when combined with exclude_destination_id,
  &exclude_destination_id=<uuid>       lets the server mark affiliates already assigned to this scope
  &limit=20                          — cap result set; default 5 when q is empty, 20 otherwise
```

Response:
```json
{
  "affiliates": [
    {
      "id": "...",
      "affiliate_type": "social_advocate",
      "display_name": "Alice",
      "handle": "alice-moon",
      "avatar_url": "...",
      "email": "alice@…",
      "last_active_at": "2026-04-18T…",
      "already_assigned_to_scope": false
    }
  ]
}
```

Server implementation notes:
- UNION two queries: one against `social_advocates` (filter by active), one against `diviner_affiliates` (filter by active). Deduplicate by `(affiliate_id, affiliate_type)`.
- For "last_active_at", compute the max of (account `created_at`, most recent `campaign_clicks.clicked_at` where `affiliate_id = row`, most recent `campaign_conversions.converted_at`). A materialized view per affiliate keeps this fast.
- When `exclude_scope` + `exclude_destination_id` are passed, JOIN `diviner_service_affiliates` to flag rows already assigned at that scope for THIS diviner. Do NOT filter them out — the UI shows them disabled with a badge.

On submit, POST to `/api/dashboard/affiliate-assignments` (new):
```
{ destination_type, destination_id (nullable), affiliate_id, affiliate_type, commission_type, commission_value, notes }
```

Server validates:
- The diviner owns the listed service (for SERVICE scope).
- The affiliate exists and is active.
- No duplicate active assignment for the same scope (server-side enforcement of the UI disable).

### 3. Edit / Revoke assignment

- **Edit** — opens the same dialog prefilled; only commission value + notes are editable (scope and affiliate are locked — revoke and re-create to change).
- **Revoke** — AlertDialog confirming. Calls PATCH with `is_active=false`. The trigger from Task 01 auto-pauses the affiliate's campaigns tied to this assignment.

### 4. APIs

New routes under `src/app/api/dashboard/affiliate-assignments/`:
- `GET /` — list all the diviner's assignments with per-assignment KPIs (counts joined from `campaign_clicks`, `campaign_conversions` over 30d).
- `POST /` — create assignment.
- `GET /[id]` — detail + performance breakdown.
- `PATCH /[id]` — update commission or revoke.

Plus the supporting affiliate-search route (used by the Create Assignment combobox):
- `GET /api/dashboard/affiliates/search` — see step 2 for full contract.

All routes authenticate via the existing diviner-session helper (resolve `diviner_id` from `auth.getUser()`), reject non-diviners with 403, and enforce `diviner_id` ownership on every read/write.

### 5. Remove the deprecated campaign-side affiliate UI

In `src/app/dashboard/campaigns/[id]/page.tsx`, **remove all affiliate-enrollment UI elements from the diviner's campaign detail page** — affiliates are no longer enrolled per-campaign under the new model. Specifically delete:

- The `<Card>` titled **"Enrolled Affiliates"** (currently renders under Date Range / Commission strip).
- The **"Add Affiliate"** button in that card's header (`<UserPlus /> Add Affiliate`).
- The `<Dialog>` titled **"Add Affiliate to Campaign"** — the modal containing the "Affiliate ID" UUID input, the "Affiliate Type" select (Diviner Affiliate / Social Advocate), the "Custom Commission Override" input, and the "Add to Campaign" submit button.
- The associated client state: `addAffOpen`, `addAffId`, `addAffType`, `addAffCommission`, `addAffSaving`, and the `handleAddAffiliate` / `handleRemoveAffiliate` functions.
- The `affiliates` field on the `CampaignDetail` type + the `affiliates.length` usage in the KPI strip (replace with something else — e.g. "Destination" badge — or drop the KPI entirely if better).
- The conversion-history column `Affiliate` if it referenced `aff.affiliate_id.slice(0, 8)` — keep the conversions table but drop that column (conversions now carry affiliate_id from the campaign's `owner_affiliate_id`, so labels can be derived differently).

Keep only the **campaign-level data** on this page: Destination & Campaign Link, Date Range, Commission (now just reflects the campaign's own commission for diviner-owned campaigns — zero for `owner_type='diviner'`), Conversion History.

The "Add Affiliate" action moves entirely to `/dashboard/affiliates` → Assignments tab (step 1 above) and is scoped to a service or profile, not a campaign.

Keep the removed code in git history for 30 days post-cutover (git log + the feature flag from Task 06 together provide the rollback path).

### 6. Performance panel (inline, on the Assignments tab)

Each row inline shows the 30-day aggregates (clicks / conversions / commission earned) so the diviner gets a quick read without drilling in.

### 7. Per-assignment detail page

Route: `/dashboard/affiliates/assignments/[id]`. Opens when the diviner clicks any row in the Assignments tab.

Page contents:
- **Header:** affiliate avatar + name + type, scope (Profile or service name), commission type + value, assigned_at, status badge, Edit / Revoke buttons.
- **KPI strip:** Clicks, Unique Clicks, Conversions, Commission Earned (period: 7d / 30d / 90d / All).
- **Time-series chart:** clicks and conversions by day for the selected period.
- **Top campaigns driving value:** table of the affiliate-owned campaigns sourced from this assignment, sortable by clicks, conversions, or commission. Columns: campaign name, status, code, clicks, conversions, commission, started_at.
- **Conversion list:** every `campaign_conversions` row for this assignment — booking_id, converted_at, order amount, commission amount, reversed_at (if any). Paginated; CSV export.
- **Traffic breakdown:** device / geo / referrer tabs aggregating the affiliate's clicks for this assignment.

Data sources:
- `diviner_service_affiliates` row for header
- `affiliate_campaigns` WHERE `source_assignment_id = :id` for campaign list
- `campaign_clicks` JOIN those campaigns for clicks/traffic breakdowns
- `campaign_conversions` WHERE `campaign_id` IN (…those campaigns) for conversions

Accessed only by the owning diviner (server checks `diviner_id = auth.uid`'s diviner record).

### 8. New API route for detail page

`GET /api/dashboard/affiliate-assignments/[id]/analytics?period=30d`

Returns a composite JSON payload: assignment row, KPI totals, time-series buckets, top campaigns, paginated conversions, traffic breakdowns. Single endpoint to keep the client simple.

## Verification Plan

1. Log in as diviner → go to `/dashboard/affiliates` → Assignments tab renders.
2. Click "+ New Assignment" → dialog opens. Affiliate combobox immediately shows 5 most-recently-active affiliates prefetched (no search typed). Each row shows avatar + name + @handle + role badge + last-active date.
3. Type "ali" in the search → combobox re-queries `/api/dashboard/affiliates/search?q=ali` (debounced 250ms). Results filter by name/email containing "ali".
4. Select Alice → dialog form captures her affiliate_id + affiliate_type (no UUID typing). Create a Profile-scope assignment at 10%.
5. Create a Service-scope assignment for the same affiliate at 20% for Solar Return. The combobox now shows Alice disabled with an "Already assigned to this scope" badge when Scope=Profile is re-opened; for Scope=Service → Solar Return she appears enabled (different scope).
6. Assignments list shows both, each with correct scope, commission, affiliate info.
7. Edit Profile assignment's commission → shows updated value.
8. Revoke Service assignment → confirm dialog → revoked row moves to an "Inactive" filter (or is hidden).
9. Revoking the Service assignment should pause any affiliate-owned campaigns pointing at Solar Return owned by affiliate A.
10. Open the Create Assignment dialog again → the combobox now shows Alice enabled for the Service scope (previous assignment was revoked, not a duplicate anymore).
11. Try to create the same affiliate+scope combo twice via direct API call bypassing the UI → server rejects as duplicate.
12. Try to create an assignment for a service the admin has disabled (`is_enabled=false`) → server rejects.
13. Verify the affiliate-enrollment UI is fully gone from `/dashboard/campaigns/[id]`:
    - No "Enrolled Affiliates" card rendered.
    - No "Add Affiliate" button or icon anywhere on the page.
    - No "Add Affiliate to Campaign" dialog exists in the DOM.
    - The `CampaignDetail` / `CampaignAffiliate` types no longer include `affiliates`.
    - `grep -n "Enrolled Affiliates\|Add Affiliate\|campaign_affiliates\|handleAddAffiliate" src/app/dashboard/campaigns/\[id\]/page.tsx` returns **zero matches**.
14. Toggle the **Group by: Affiliate / Service** control — same rows appear, regrouped; counts at the top of each group match the sum of the rows within it.
15. Click any row → land on `/dashboard/affiliates/assignments/[id]`; confirm header + KPI strip + time-series chart + top campaigns + conversion list all render with the correct affiliate + scope scoping.
16. As a different diviner, attempt to open another diviner's assignment detail URL → expect 404 or 403.

## Edge Cases

- Diviner tries to assign themselves as an affiliate → reject at API with clear error.
- Admin has disabled a service after a SERVICE assignment was created → assignment stays but is effectively dead (cannot back a campaign until service is re-enabled). Flag visually.
- Affiliate is deactivated platform-wide → assignments remain but no new campaigns can be created; existing campaigns auto-pause.
- Very high commission values (> 100%) → validate ≤ 100 for `percent`. Validate sane bounds for `flat`.

## Rollback Plan

- Hide the Assignments tab (feature flag).
- Restore the "Enrolled Affiliates" card on campaign detail page (revert file).
- Data in `diviner_service_affiliates` stays untouched.
