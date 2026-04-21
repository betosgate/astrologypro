# Task 05 — Affiliate Dashboard UI

- Status: Not Started
- Priority: P0
- Depends On: Tasks 01, 02, 03, 04
- Blocks: Task 06 migration (affiliate UI must exist for cutover to be safe)

## Goal

Give affiliates (both `social_advocate` role and `diviner_affiliate` role) a clean dashboard to see their assignments, create their own campaigns, and track their earnings. A campaign can only be created against an active assignment; the commission is inherited from the assignment and frozen into the campaign at creation.

## Current State

- Advocate portal exists at `/advocate/` with pages: `analytics`, `campaigns`, `content`, `earnings`, `kpi`, `profile`, `referrals`, `reports` (confirmed in `src/app/advocate/`).
- Advocate API routes exist under `src/app/api/advocate/campaigns/` and `src/app/api/advocate/reports/` — Task 05's new APIs slot in alongside these.
- `/affiliate/*` is a separate portal for diviner-affiliate role — treat identically via shared components.
- No "My Assignments" page exists on either portal.
- No per-affiliate campaign creation UI — the old model required the diviner to enroll them.

## Implementation Steps

### 1. My Assignments page

Route: `/advocate/assignments` (or `/affiliate/assignments` for diviner-affiliates — both should share a component).

Renders a grid or table of every active `diviner_service_affiliates` row where `affiliate_id` matches the current user.

Per-row:
- Diviner name + avatar + link to their public profile
- Scope badge (Profile or the service name)
- Commission type + value
- Assigned-on date
- Count of campaigns the affiliate has created against this assignment
- Aggregate clicks / conversions / earnings from those campaigns (30d)
- **"+ Create Campaign"** button
- **"Copy share link"** button (copies the canonical tagged URL — see step 3 for format)

Filters: scope type, diviner, active/all.

### 2. Create Campaign flow

Triggered from a "Create Campaign" button on an assignment row.

The dialog is similar to the diviner's campaign create flow but:
- Destination is pre-filled and locked (the assignment's scope is the destination).
- Commission fields are locked and display the inherited value.
- Fields the affiliate fills in: name, description, channel (Instagram/Email/Podcast/etc.), start/end dates, budget cap (optional), custom UTM params (optional).

On submit, POST to `/api/advocate/campaigns` (new):
```
{ assignment_id, name, description, channel, start_date, end_date, budget_cap_cents, utm_params }
```

Server:
- Looks up the assignment, verifies it belongs to the current user and is active.
- Creates `affiliate_campaigns` row with `owner_type='affiliate'`, `owner_affiliate_id` + `owner_affiliate_type` set, `commission_value_snapshot` + `commission_type_snapshot` copied from the assignment, `source_assignment_id` = assignment.id.
- Generates a unique `code` (format: `cmp_` + 8 alphanumeric, same as existing helper).
- Creates the matching `tracking_links` row.

### 3. Campaigns list

Route: `/advocate/campaigns` — shows all campaigns this affiliate owns.

Per-row:
- Name, Status, Diviner, Scope (Profile / Service name), Code, Clicks, Unique, Conversions, Commission earned, Dates.
- Row actions: Edit, Pause/Resume, Archive.
- Copy URL button with the canonical share URL.

### 4. Share URL format

Canonical tagged share link:
```
https://astrologypro.com/r/cmp_XXXXXXXX
```

The `/r/[code]` handler (already extended in Task 02) redirects to the destination + appends `?ref=cmp_XXXXXXXX`.

Alternative direct URL (deep-link, no redirect):
```
https://astrologypro.com/{username}?ref=cmp_XXXXXXXX
https://astrologypro.com/{username}/services/{slug}?ref=cmp_XXXXXXXX
```

Both formats should be supported. The "Copy share link" button defaults to the `/r/` form because it's shorter and allows the affiliate to swap destinations later without re-sharing.

### 5. Earnings dashboard

Route: `/advocate/earnings`.

Top-level KPIs:
- Total commission earned (all time)
- Pending (conversions not yet paid out)
- Paid (if payout system exists)
- Clicks / unique clicks (30d)
- Conversions (30d)

Breakdowns:
- By diviner
- By service / scope
- By campaign
- By month (time series)

Every card links to the source campaign or assignment for drill-down.

### 6. Campaign detail (affiliate view)

Route: `/advocate/campaigns/[id]` — mirrors the diviner's campaign detail but:
- Shows inherited commission (read-only).
- Shows the diviner's name and link to their profile.
- Shows per-campaign analytics (same `campaign_clicks` + `campaign_conversions` data).

### 7. APIs

Create these under `src/app/api/advocate/`:

- `src/app/api/advocate/assignments/route.ts` — `GET` returns the current user's assignments.
- `src/app/api/advocate/assignments/[id]/route.ts` — `GET` single assignment with KPIs.
- `src/app/api/advocate/campaigns/route.ts` — add `POST` (create) alongside the existing `GET` (list).
- `src/app/api/advocate/campaigns/[id]/route.ts` — `GET` detail, `PATCH` update (name, description, status, dates only).
- `src/app/api/advocate/earnings/route.ts` — `GET` aggregated commission totals.

All routes authenticate via `createClient()` → `supabase.auth.getUser()`, then resolve the user's affiliate identity. The affiliate-to-user mapping depends on whether they're a `social_advocate` or `diviner_affiliate`:

- `social_advocate` → query `social_advocates` table on `user_id = auth.uid()` to get `affiliate_id`.
- `diviner_affiliate` → query `diviner_affiliates` table on `user_id = auth.uid()`.

Scope every query to the resolved affiliate row. Return 403 if no affiliate record exists.

## Verification Plan

1. Log in as the affiliate user → go to `/advocate/assignments` → see the rows created in Task 04 verification.
2. Click "+ Create Campaign" on an assignment → dialog shows destination + commission locked.
3. Create a campaign — `affiliate_campaigns` row appears with correct `owner_type`, `source_assignment_id`, snapshot values.
4. `/advocate/campaigns` list shows the new campaign with its code.
5. Copy share URL → paste in incognito → redirects to the scoped destination with `?ref=`.
6. Trigger a test booking through that URL → `campaign_conversions` row appears with the assignment's commission rate (cross-reference Task 03 verification).
7. `/advocate/earnings` shows the conversion in the totals.
8. Try to create a campaign for an inactive assignment → server rejects 403.
9. Log in as a different affiliate → `/advocate/assignments` shows only their own assignments.
10. Try to hit another affiliate's campaign detail via direct URL → rejected 403.

## Edge Cases

- Affiliate has zero assignments → empty state explains they need to be assigned by a diviner first. Link to platform docs or to an "Invite a diviner" flow (out of scope).
- Assignment is revoked while the affiliate has active campaigns → campaigns auto-pause via trigger. UI should show the "Auto-paused: assignment revoked" state.
- Affiliate tries to change their campaign's destination → disabled in UI and blocked at API (destination comes from assignment only).
- Affiliate edits commission → UI disables the field entirely; it's inherited and frozen.

## Rollback Plan

- Feature-flag the affiliate pages; hide from sidebar.
- `affiliate_campaigns` rows with `owner_type='affiliate'` remain in DB, but no UI surfaces them (except diviner analytics).
