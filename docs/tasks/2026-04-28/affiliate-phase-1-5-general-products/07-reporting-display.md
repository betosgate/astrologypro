# Task 07 — Reporting Display Labels

- Status: Not Started
- Priority: P1
- Depends on: 01
- Blocks: 08
- Spec: §10 Phase 1.5 — Reporting touches

## Goal

Make every conversion display in admin / diviner / affiliate dashboards
honestly distinguish per-diviner credits from general-program credits.
The report endpoints already pull the right rows after Task 01's
`affiliate_account_id` column lands; this task is purely the
display-side formatting.

## Display rule

Per row:
- If `campaign_conversions.affiliate_type = 'general'` (or
  `owner_affiliate_account_id IS NOT NULL` on the joined campaign):
  show `"General: <service_template.name>"`.
- Else: show the existing `"Diviner: <diviner.display_name>"` (or
  whatever label the report currently uses).

## Surfaces to update

### Admin

**`/admin/reports/affiliates/conversions`** ([page.tsx](src/app/admin/reports/affiliates/conversions/page.tsx))
- Conversion log row's "Campaign" or "Source" column gains the
  General/Diviner prefix.
- API endpoint (`src/app/api/admin/reports/affiliates/conversions/route.ts`)
  needs to JOIN `service_templates` on `campaign.destination_service_template_id`
  for the general rows so the page has the template name to render.

**`/admin/reports/affiliates/clicks`** — same display change. The
clicks API joins `affiliate_campaigns` already; just extend the SELECT
to grab the template name when `owner_affiliate_type='general'`.

**`/admin/reports/affiliates/by-affiliate`** — already groups by
account. Add a column "General credits" + "Per-diviner credits"
breakdown for visual clarity. NICE-TO-HAVE; not blocking.

**`/admin/reports/affiliates/by-diviner`** — general conversions have
`diviner_id IS NULL` and naturally drop out of this report. No change
needed; verify they don't accidentally aggregate under a
`null`/`unknown` diviner row.

**`/admin/reports/payouts`** — already account-anchored after the
previous bug fix. General credits aggregate seamlessly into
`AffiliateCommission.totalEarned`. No display change required.

### Diviner

**`/dashboard/affiliates/[id]`** — per-affiliate detail page filters
campaigns/conversions by `owner_affiliate_id = junction_id`. General
campaigns DON'T match (they have `owner_affiliate_id IS NULL`) so they
correctly stay hidden from per-diviner views. **No change required.**
This is the core anti-leakage guarantee from §10 Phase 1.5 decision #5.

**`/dashboard/affiliates/reports`** — shows commission attribution per
affiliate partner. General credits aren't attributable to any specific
diviner so they don't appear here. Confirm via test that they're
EXCLUDED, not surfaced under a fake/null diviner.

### Affiliate

**`/affiliate/earnings`** ([page.tsx](src/app/affiliate/(portal)/earnings/page.tsx))
- Add a "Source" column (or extend an existing one) to show
  General / Per-diviner for each conversion.
- Pull the template name (general) or diviner name (per-diviner) for
  display.

**`/affiliate/campaigns`** — list page already shows Diviner column.
Display change: when `owner_affiliate_type='general'`, show
"General product" instead of the diviner name.

**`/affiliate/campaigns/[id]`** detail — show source label in the
header (`General campaign — <template name>` vs `Campaign — <diviner>`).

## Implementation notes

The display-change logic is small. The endpoints that drive these
pages need to JOIN `service_templates` when fetching campaigns whose
`owner_affiliate_type='general'`. Use the PostgREST nested-select shape
that the v2 sprint already uses elsewhere.

### Concrete SELECT additions per endpoint

**`/api/admin/reports/affiliates/conversions`:**
```ts
// existing
.select("id, campaign_id, affiliate_id, affiliate_type, ...,
         campaign:affiliate_campaigns(diviner_id, name)")
// extend the campaign sub-select to also pull the destination template
.select(`
  id, campaign_id, affiliate_id, affiliate_type, affiliate_account_id,
  booking_id, order_amount_cents, commission_amount_cents,
  rate_type_used, rate_value_used, reversed_at, reversed_reason,
  created_at,
  campaign:affiliate_campaigns(
    diviner_id, name, owner_affiliate_type,
    template:service_templates!destination_service_template_id(id, name)
  )
`)
```

**`/api/admin/reports/affiliates/clicks`:**
```ts
// extend campaign sub-select the same way
.select(`
  id, campaign_id, campaign_code, diviner_id, destination_type,
  destination_id, affiliate_id, affiliate_type, ip, country,
  user_agent, referrer, is_bot, is_unique_click, created_at,
  campaign:affiliate_campaigns(
    owner_affiliate_type,
    template:service_templates!destination_service_template_id(name)
  )
`)
```

**`/api/affiliate/reports/conversions`** (and the affiliate's
`/affiliate/earnings` data path):
```ts
.select(`
  id, campaign_id, booking_id, order_amount_cents,
  commission_amount_cents, rate_type_used, rate_value_used,
  reversed_at, reversed_reason, created_at,
  campaign:affiliate_campaigns(
    name, owner_affiliate_type,
    diviner:diviners(display_name),
    template:service_templates!destination_service_template_id(name)
  )
`)
```

### Type updates

```ts
interface ConversionRow {
  // existing fields...
  affiliate_type: 'diviner_affiliate' | 'social_advocate' | 'general';
  campaign:
    | {
        name: string | null;
        owner_affiliate_type: 'diviner_affiliate' | 'social_advocate' | 'general';
        diviner: { display_name: string } | null;
        template: { name: string } | null;
      }
    | { /* same shape, array form per Supabase typing */ }[]
    | null;
}

function sourceLabel(row: ConversionRow): string {
  const c = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
  if (!c) return "Unknown";
  if (c.owner_affiliate_type === 'general') {
    return `General: ${c.template?.name ?? 'Unknown template'}`;
  }
  return `Diviner: ${c.diviner?.display_name ?? 'Unknown'}`;
}
```

## Acceptance

- [ ] Admin conversions log shows `General: <name>` for general rows
      and `Diviner: <name>` for per-diviner rows.
- [ ] Admin clicks log shows the same label split.
- [ ] Diviner per-affiliate detail page does NOT show general campaigns
      or general conversions (verified via the RLS test in Task 08).
- [ ] Affiliate earnings page shows the source label per row.
- [ ] Affiliate campaigns list shows "General product" instead of a
      diviner name when applicable.
- [ ] All display labels handle the case where the template/diviner
      lookup returns null gracefully (renders "Unknown" instead of
      crashing).

## Suggested files

- `src/app/api/admin/reports/affiliates/conversions/route.ts` (extended SELECT)
- `src/app/api/admin/reports/affiliates/clicks/route.ts`
- `src/app/admin/reports/affiliates/conversions/page.tsx`
- `src/app/admin/reports/affiliates/clicks/page.tsx`
- `src/app/affiliate/(portal)/earnings/page.tsx`
- `src/app/affiliate/(portal)/campaigns/page.tsx`
- `src/app/affiliate/(portal)/campaigns/[id]/page.tsx`
