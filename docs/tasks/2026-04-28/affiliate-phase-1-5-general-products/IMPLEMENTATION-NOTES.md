# Phase 1.5 Implementation Notes (2026-04-30)

Authoritative record of where the implementation diverged from the
written task plans + design spec. Future readers should consult this
before assuming any task plan body is correct as-written — Status:
lines on each task file already reflect ship state; this doc captures
**what changed and why**.

The living spec at
[`docs/specs/affiliate-commission-system.md`](../../../specs/affiliate-commission-system.md)
has been updated section-by-section to match reality. This doc is the
delta log behind those updates.

---

## Schema deviations from the original Phase 1.5 design

Folded into the same migration `20260430000002_affiliate_phase_1_5_general`
because the migration hadn't been applied yet:

### 1. `commission_type` enum — `'percent'` not `'percentage'`

| Where | Original spec | Actual |
|---|---|---|
| `service_templates.commission_type` CHECK | `('percentage','flat')` | `('percent','flat')` |

The v2 stamp pipeline already enforces `('percent','flat')` via the
CHECK on `bookings.commission_rate_type_stamp` (introduced in
`20260424000010_affiliate_commission_v2_additive.sql:41`). The original
Phase 1.5 design used `'percentage'` (a System A leftover). Storing
`'percentage'` on `service_templates` and copying it to the booking
stamp would have failed the booking insert with PG 23514 — every
general-product booking would have errored.

Caught during pre-flight audit (Task 01). Corrected to `'percent'` in
the migration; Task 02 stamp-resolver default also uses `'percent'`.
Spec §10 schema block updated.

### 2. `tracking_links.diviner_id` — dropped NOT NULL

Original `tracking_links` table from
`20260331000001_initial_schema.sql` declared `diviner_id UUID NOT NULL`.
That predated the affiliate model entirely. General campaigns have no
specific diviner (the matcher picks one at booking time), so any
attempt to insert a general tracking_links row would fail.

Caught during Task 04 implementation (general-campaigns endpoint
insert). Folded into Task 01's migration as section 2b.

### 3. `is_general` column added to `service_templates`

Original Phase 1.5 design relied on slug parsing
(`slug LIKE 'general-%'`) to discriminate general templates. Made the
discriminator a real column (`is_general BOOLEAN NOT NULL DEFAULT FALSE`)
and backfilled from the slug pattern. Cleaner long-term: admin can
flip the flag without renaming a slug, and queries don't have to do
string matching.

### 4. `admin_action_log` extensions

Original table from `20260424000010_affiliate_commission_v2_additive.sql`
had:
- `action_kind` CHECK in `('affiliate_assignment_revoked',
   'affiliate_campaign_archived', 'affiliate_conversion_reversed')`
- `target_resource_id UUID NOT NULL`
- No `payload` column

The Task 06 bulk-rate endpoint hits many rows in a single call, so:
- `action_kind` CHECK extended with `'service_templates_bulk_commission_update'`
- `target_resource_id` made NULLable
- Added `payload JSONB` (nullable) to carry structured action params

Caught during Task 06 implementation. Folded into Task 01's migration
as section 5b.

---

## Task plan body deviations

### Task 01 — Schema migration

- Original date prefix in the doc was `<YYYYMMDD>0001`; actual filename
  is `20260430000002_*` because the prefix `20260430000001` collided
  with a teammate's `search_auth_users_by_email_fn.sql` migration that
  landed mid-conversation. Bumped per the doc's own collision warning.
- Migration column list extended with `is_general` + the section 2b /
  5b changes above.

### Task 02 — Stamp + credit

- Pseudo-code in the task plan defaulted `template.commission_type ?? 'percentage'`.
  Real implementation defaults to `?? 'percent'` to match the v2 stamp
  enum (see deviation #1).
- New stamp reason `'program_disabled'` returned when
  `affiliate_program_enabled=false`. Plan called it
  `'program_disabled_on_service'` in passing; actual code uses the
  shorter form.
- `creditAffiliateConversion` per-diviner branch now ALWAYS populates
  `campaign_conversions.affiliate_account_id` (resolved via junction →
  account). Plan listed this as a separate sub-task; it's done in the
  same branch.
- `CreditConversionResult` shape adjusted: `affiliateId` is `string |
  null` (general credits have no junction id), and a new
  `affiliateAccountId: string` field always carries the cross-cutting
  identity. The webhook caller doesn't read the return value; the
  type honesty is for future consumers.
- Side-fix in `analytics/track`: `page_views.affiliate_type` CHECK only
  allows `('diviner_affiliate','social_advocate')`. Coerce general to
  null on the page-view insert so general clicks don't 23514 the
  tracker. Same pattern applied to the `/r/[code]` click logger in
  Task 03.

### Task 03 — `/r/[code]` 410 gate

- Spec wrote "410 with branded inactive page". Codebase convention is
  307 → `/link-not-active` (matches the existing revoked-assignment
  pattern). Implementation uses 307; customer-visible page is the same.
  All `/link-not-active` redirects share this convention — Task 03
  didn't introduce any new pattern.
- **Found and fixed:** the campaign destination resolver had no
  general-product branch and required `diviner_id` to be non-null.
  Extended `resolveCampaignDestination` to accept null `diviner_id`
  and route general SERVICE campaigns to `/services/<slug>` (the live
  Next.js dynamic route), not `/readings/<slug>` (the SEO marketing
  tree, which doesn't carry the `general-` prefix). Initial commit
  `8927c670` had the wrong path; corrected in commit `7ce83a45`.

### Task 04 — General-campaigns endpoint

- Insert payload writes `commission_type='percentage'` and
  `commission_value=0` for the legacy `affiliate_campaigns` columns
  (which still have a CHECK in `('percentage','fixed')`). These fields
  are no longer authoritative — rate lives on the booking stamp — but
  written to satisfy the legacy CHECK.
- Archive endpoint extension at `PATCH /api/affiliate/campaigns/[id]`
  was an in-spec requirement; added `isOwnedGeneral` branch matching
  on `owner_affiliate_account_id == ctx.account.id`.
- **Required follow-up:** dropping `tracking_links.diviner_id` NOT NULL
  (deviation #2 above) — added to the migration when implementing this
  task.

### Task 05 — Affiliate UI

- Marketing Kit rewritten to take an `items` prop instead of an
  `affiliateId` (junction id). New helper `src/lib/affiliate-marketing-kit.ts`
  does lookup-or-lazy-create per `(account, template)` pair.
- **Customer landing page concern surfaced and resolved in the same
  task:** the original assumption was that general products lived at
  `/readings/<general-slug>` like the existing 19 marketing pages.
  Actually they live at `/services/<slug>` (dynamic route at
  `src/app/services/[slug]/page.tsx`). Fix to `resolveCampaignDestination`
  bundled in.
- **Plan didn't anticipate** that `/affiliate/campaigns` (list) and
  `/affiliate/campaigns/[id]` (detail) reject general campaigns
  because their queries filter on `owner_affiliate_type='diviner_affiliate'`.
  Same kind of extension as Task 04's archive endpoint — added.
  Without these, an affiliate could create a general campaign and
  never see it again.
- Dashboard's earnings/clicks/recent-campaigns rollups also needed
  the same per-diviner-OR-general union; switched the conversions
  filter from `affiliate_id IN junctionIds` to
  `affiliate_account_id = account.id`.
- Three smaller component bugs caught in cross-check: (1) Marketing
  Kit "Preview" button was firing a self-attributed click; switched
  to un-tracked `/services/<slug>`; (2) rate badge said `{value}%` for
  flat-rate templates; widened the type model; (3) category badge got
  lowercased on display; preserve canonical casing.

### Task 06 — Admin UI

- New `_components/affiliate-program-card.tsx` and `_components/bulk-rate-card.tsx`.
- PATCH endpoint added validation rules per the spec table; rejects
  affiliate fields on diviner-specific templates with
  `field_not_applicable`.
- Bulk endpoint inserts an `admin_action_log` row — required the
  `admin_action_log` extensions (deviation #4 above).
- List endpoint SELECT extended to return the new columns;
  table gained "Affiliate program" + "Rate" columns.

### Task 07 — Reporting display labels

- Spec listed five surfaces for display-label changes; all five
  shipped.
- **Major scope addition during cross-check:** five distinct pre-
  existing column-name bugs across v2 reporting endpoints, all
  silently returning DB errors in production:
  - `campaign_conversions.created_at` (real: `converted_at`) — five
    endpoints + two pages
  - `campaign_conversions.reversed_reason` (real: `reversal_reason`)
  - `campaign_clicks.ip` (real: `ip_hash`)
  - `campaign_clicks.country` (real: `country_code`)
  - `campaign_clicks.referrer` (real: `referrer_url`)
- All fixed as part of Task 07 since the SELECTs were being extended
  anyway. The reporting endpoints are now functional (they weren't).
- Plan also asked for a "General credits / Per-diviner credits"
  breakdown column on `/admin/reports/affiliates/by-affiliate`. That
  was flagged NICE-TO-HAVE in the spec; deferred.

---

## Migration commits (in order)

| Commit | What |
|---|---|
| `ab47cb76` | Initial Phase 1.5 schema (Task 01) |
| `1c938875` | Hotfix: `created_at` → `converted_at` on the conversions index (caught by the first migration runner attempt) |
| `87b4db7d` | Task 02 — stamp + credit (no deploy keyword) |
| `8927c670` | Task 03 — `/r/[code]` gate + dest resolver (no deploy) |
| `e008fdf3` | Task 04 — general-campaigns endpoint + archive ownership extension; folded `tracking_links.diviner_id` NOT NULL drop into the migration |
| `7ce83a45` | Task 05 — affiliate UI; Task 03 dest-resolver path corrected to `/services/<slug>` |
| `7c7652b2` | Task 06 — admin UI; folded `admin_action_log` extensions into the migration |
| `b67bd0a1` | Task 07 — reporting display labels + 5 pre-existing bug fixes |

---

## Production state at end of sprint

- **Code on origin/master**: Tasks 01–07 all pushed, only Task 01
  carries the `deploy:` keyword. Tasks 02–07 are checkpoint commits;
  Vercel hasn't rebuilt for them yet.
- **Schema on production**: migration `20260430000002_affiliate_phase_1_5_general`
  has been registered in the admin runner allowlist (Task 01 deploy)
  but has not been applied (the user's first run failed on the
  `created_at` bug; awaiting retry after the hotfix).
- **Deploy plan**: bundle Tasks 02–07 in a single `deploy:` push, run
  the migration as the immediate first action after the build lands,
  to keep the column-mismatch risk window minimal. Per-diviner credit
  breaks if Task 02 code ships against the un-migrated DB (the credit
  INSERT writes `affiliate_account_id` which doesn't exist yet).
