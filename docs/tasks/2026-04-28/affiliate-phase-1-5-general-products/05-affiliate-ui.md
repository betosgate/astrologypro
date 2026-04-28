# Task 05 — Affiliate UI (Marketing Kit + Products + new-campaign)

- Status: Not Started
- Priority: P1
- Depends on: 01, 04
- Blocks: 08
- Spec: §10 Phase 1.5 — Affiliate Marketing Kit + `/affiliate/products`

## Goal

Three affiliate-portal surfaces gain general-product awareness:
1. **`/affiliate/products`** — adds a "General products" section
   alongside the existing per-diviner assignment grid.
2. **`/affiliate/campaigns/new`** — extends to a two-mode picker:
   per-diviner (via assignment) OR general (via template).
3. **Marketing Kit** at `src/components/affiliate/marketing-kit.tsx` —
   rewrites to source from real DB data and use real campaign codes.

After this task, every share URL the affiliate copies routes through a
real campaign code that credits them when the customer books.

## Pre-condition: account-state gating

All three surfaces below render INSIDE
`src/app/affiliate/(portal)/layout.tsx`, which already redirects
unclaimed / blocked accounts to the AccountGateShell before any
portal page renders. This task assumes those gates are working —
no additional account-status checks are needed in the new UI code.

## A. `/affiliate/products` — new "General products" section

Add a section below the existing assignments grid:

```tsx
<section>
  <h2>General products you can promote</h2>
  <p className="text-muted-foreground">
    Available to all active affiliates. Commission rate is set by the
    platform.
  </p>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {generalTemplates.map((t) => (
      <Card key={t.id}>
        <CardHeader>
          <CardTitle>{t.name}</CardTitle>
          <CardDescription>
            Commission: {t.commission_value ?? 10}%
            {t.commission_value === null && (
              <span className="text-xs"> (default)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Optional thumbnail / description */}
          <Button asChild>
            <Link href={`/affiliate/campaigns/new?template=${t.id}`}>
              <Plus className="mr-2 size-3.5" />
              Create campaign
            </Link>
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
</section>
```

Server-side data source:
```sql
SELECT id, name, slug, description, commission_type, commission_value
FROM service_templates
WHERE is_general = true
  AND affiliate_program_enabled = true
ORDER BY name;
```

If no enabled general templates exist, hide the section entirely.

## B. `/affiliate/campaigns/new` — two-mode picker

The existing form picks an assignment via dropdown. Extend to:

```tsx
const mode = searchParams.assignment ? 'per-diviner' : 'general';
// OR auto-detect from query params: ?assignment=<id> vs ?template=<id>

{mode === 'per-diviner' ? (
  <AssignmentPickerCard />  // existing
) : (
  <GeneralTemplatePickerCard />  // new
)}
```

The general path:
- Pre-selects the template from `?template=<id>` if present.
- Shows the rate (`commission_value ?? 10`%) so the affiliate sees what
  they'll earn.
- Submit → `POST /api/affiliate/general-campaigns` (Task 04 endpoint).
- On success → `router.push('/affiliate/campaigns/<id>')`.

A toggle at the top lets the affiliate switch modes if they hit
`/affiliate/campaigns/new` with no query string.

## C. Marketing Kit rewrite

**File:** `src/components/affiliate/marketing-kit.tsx`

### What's currently broken

```tsx
// Today's broken code:
const READING_PAGES = [/* hardcoded 19 entries */];
const affiliateUrl = `${APP_BASE}/readings/${page.slug}?ref=${affiliateId}`;
// affiliateId is a junction UUID — never matches a campaign_code.
```

### After rewrite

Marketing Kit becomes a server-component that:
1. Queries `service_templates` for enabled general products.
2. For each template, ensures the affiliate has an
   `owner_affiliate_type='general'` campaign for it. If not, lazily
   creates one (calls Task 04's endpoint server-side, OR a thin
   helper function shared between endpoint and this component).
3. Renders the share URL as `${APP_BASE}/r/<campaign_code>`.

```tsx
export async function AffiliateMarketingKit({ accountId }: Props) {
  // 1. Pull enabled general templates
  const { data: templates } = await admin
    .from('service_templates')
    .select('id, name, slug, image_url, category, commission_value')
    .eq('is_general', true)
    .eq('affiliate_program_enabled', true)
    .order('name');

  // 2. For each, ensure a campaign exists
  const campaigns = await ensureMarketingKitCampaigns(accountId, templates);

  // 3. Render with real campaign_code in the share URL
  return (
    <div>
      {templates.map((t) => {
        const cmp = campaigns.get(t.id);
        const shareUrl = `${APP_BASE}/r/${cmp.campaign_code}`;
        return <MarketingKitCard key={t.id} template={t} shareUrl={shareUrl} />;
      })}
    </div>
  );
}
```

### `ensureMarketingKitCampaigns(accountId, templates)`

Helper that:
- For each template, looks up an existing affiliate_campaigns row where
  `owner_affiliate_account_id = accountId AND
   destination_service_template_id = template.id AND
   status = 'active'`.
- If found, return it.
- If not, create one (using the same insert shape as Task 04).
- Returns a `Map<template_id, campaign>`.

**Race condition acknowledgement:** if the affiliate has the dashboard
open in two tabs and both server-renders run simultaneously, the
"lookup → insert if missing" logic could create two campaigns for the
same `(account, template)` pair before either insert sees the other.
Two strategies, pick one when implementing:
1. **Accept the duplicate.** Two campaigns are functionally fine (the
   Marketing Kit display de-dupes by template; both campaign codes
   credit the same account). Cheap, no schema change.
2. **Add a unique partial index** on
   `(owner_affiliate_account_id, destination_service_template_id)
    WHERE owner_affiliate_type = 'general'`. The second insert hits the
   constraint and the helper retries the SELECT. Bullet-proof but
   requires a migration tweak on top of Task 01.

**Default to (1)** unless duplicate-campaign noise is reported as a
real issue.

### Filter

Keep the All / Astrology / Tarot filter — sourced from
`service_templates.category` instead of hardcoded.

### Deletion

Drop the `READING_PAGES` constant (lines 20-~210 in current file).

## Acceptance

- [ ] `/affiliate/products` shows the General section only when at
      least one general template has `affiliate_program_enabled=true`.
- [ ] Each card shows the commission rate (default 10% if NULL).
- [ ] "Create campaign" CTA pre-fills the template picker on
      `/affiliate/campaigns/new`.
- [ ] `/affiliate/campaigns/new?template=<id>` opens in general mode
      with the template pre-selected.
- [ ] `/affiliate/campaigns/new?assignment=<id>` opens in per-diviner
      mode (existing behavior).
- [ ] Marketing Kit only shows enabled general templates.
- [ ] Every Marketing Kit share URL is `${APP_BASE}/r/<campaign_code>`
      (no UUID anywhere).
- [ ] Clicking a Marketing Kit URL → 307 redirect → click logged in
      `campaign_clicks` → booking stamping works.
- [ ] Repeat visits to the dashboard don't create duplicate campaigns
      for the same affiliate × template pair (lazily-create-once
      semantics).

## Suggested files

- `src/app/affiliate/(portal)/products/page.tsx` (extended)
- `src/app/affiliate/(portal)/campaigns/new/page.tsx` + its
  `create-form.tsx` (extended to two-mode)
- `src/components/affiliate/marketing-kit.tsx` (rewritten)
- `src/lib/affiliate-marketing-kit.ts` (new helper —
  `ensureMarketingKitCampaigns`)
