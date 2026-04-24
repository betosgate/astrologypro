# Task 02 — Rewire Stripe Webhook + Retire System A

- Status: Done (2026-04-24) — except for 5 admin endpoints rolled into Task 07
- Priority: P0
- Depends on: 01 (additive migration only)
- Blocks: 04 (stamping + credit work), 01b (destructive migration — pending Task 07 closeout)
- Spec: v1.2 (§5 Flow F, §9)

## Goal

Cut System A out of the live payment flow. Rewrite any function that
reads `affiliate_commissions` to instead read `campaign_conversions`.
Remove every writer of `affiliate_commissions`. After this task,
System A is dead code; task 01b drops the tables.

## Concrete changes

### Money-split bridge — rewrite

`src/lib/revenue-ledger.ts::getAffiliateCommissionTotalForOrderRef`
currently reads `affiliate_commissions.order_reference`. Rewrite:

- Signature stays the same: `(orderReference: string) => Promise<number>`.
- Extract booking id from `orderReference` (format is `booking:<uuid>`).
- SELECT `commission_amount_cents` FROM `campaign_conversions`
  WHERE `booking_id = <uuid> AND reversed_at IS NULL`.
- SUM and return.
- Existing call sites at `src/app/api/stripe/webhooks/route.ts:1417` and
  `:2062` stay unchanged.

### Webhook — remove legacy writers

`src/app/api/stripe/webhooks/route.ts`:

- Remove imports of `recordAffiliateCommission` and
  `recordSignupAffiliateCommission`.
- Delete call sites currently at lines ~385, 796, 965, 1167, 1281, 1407,
  2051 (line numbers approximate — grep for the function names).
- Delete the local `recordSignupAffiliateCommission` wrapper (line ~979).
- Keep the `creditAffiliateConversion` call at line ~1951 — it's the
  campaign path.

### Delete legacy library code

- Delete `src/lib/affiliate-commissions.ts` entirely.
- Delete `src/lib/affiliate-attribution.ts` only if no longer referenced
  (verify — the campaign path probably still uses it; most likely KEEP
  this file and only drop `recordAffiliateCommission`-related bits).

### Delete legacy endpoints (code + folders)

Delete these route folders entirely:

- `src/app/api/admin/commissions/[commissionId]/` (PATCH state machine)
- `src/app/api/admin/commissions/[commissionId]/adjust/`
- `src/app/api/admin/commissions/[commissionId]/refund/`
- `src/app/api/admin/affiliates/[id]/commissions/` + `.../export/`
- `src/app/api/admin/affiliates/[id]/commission-rules/`
- `src/app/api/admin/commission-rules/[ruleId]/`
- `src/app/api/admin/analytics/commission/` + `.../export/` (to be
  replaced by campaign-based analytics in task 07)
- `src/app/api/dashboard/affiliate-commission/` (all sub-routes)

### Delete legacy public page

- `src/app/affiliate/[code]/` — the System A slug-based public referral
  page. Replaced entirely by `/r/<campaign_code>`.

### Delete legacy admin / diviner UI pages

- `src/app/dashboard/affiliate-commission/page.tsx`
- `src/app/dashboard/affiliate-commission/[affiliateId]/page.tsx`

### Delete the affiliate_commission_history admin UI references

Grep `src/app/admin` and `src/app/dashboard` for any remaining references
to the deleted tables; delete the referring components or the component
sections that rely on them.

### Additional System A call sites (discovered 2026-04-24 grep sweep)

The original delete list above misses code that reads System A tables
outside the webhook path. If these aren't handled, affiliates hit HTTP
500 the moment Task 01b drops the tables. Split between **delete** and
**refactor to read System B**:

#### Delete entirely (replaced by System B equivalents)

- `src/app/api/ref/[slug]/route.ts` — the System A public click redirect.
  Replaced by `/r/<campaign_code>`. Delete the folder.
- `src/app/api/dashboard/affiliates/[id]/links/route.ts` — per-junction
  referral link CRUD. Replaced by the campaign model; diviners create
  campaigns now, not slug links. Delete the folder.

#### Refactor to read System B

These must be rewritten before Task 01b. Each currently reads System A
tables; each has a System B equivalent.

| File | Current reads | New reads |
|---|---|---|
| `src/app/affiliate/(portal)/dashboard/page.tsx:91,95` | `affiliate_commissions` + `affiliate_referral_links` | `campaign_conversions` (KPI sums) + `affiliate_campaigns WHERE owner_affiliate_id IN junction_ids` (share links) |
| `src/app/affiliate/(portal)/partnerships/page.tsx:80` | `affiliate_commissions` | `campaign_conversions GROUP BY affiliate_id` joined to `diviner_affiliates` |
| `src/app/affiliate/(portal)/earnings/page.tsx:94,102` | `affiliate_commissions` + `affiliate_payouts` | `campaign_conversions` + (Phase 2 payouts — drop the payouts section for now, show "Payouts coming soon") |
| `src/app/api/affiliate/dashboard/route.ts:63,71` | `affiliate_referral_links` | `affiliate_campaigns WHERE owner_affiliate_id IN junction_ids` |
| `src/app/api/affiliate/links/route.ts:42` | `affiliate_referral_links` | Same — list the affiliate's active campaigns with their share URLs |
| `src/app/api/dashboard/affiliates/reports/route.ts:64` | `affiliate_referral_links` | `affiliate_campaigns WHERE diviner_id = me` |
| `src/lib/diviner-analytics.ts:107` | `affiliate_referral_links` | `affiliate_campaigns WHERE diviner_id = me` |

Any user-visible behavior change from these refactors (e.g. earnings
page no longer shows payouts until Phase 2) must be documented in a
comment at the top of the refactored file AND reflected in the spec
Changelog.

## Acceptance

- `git grep -E "recordAffiliateCommission|recordSignupAffiliateCommission|affiliate_commissions|affiliate_referral_links|affiliate_commission_history|affiliate_payouts|affiliate_clicks\b" -- 'src/**'` returns **zero hits**. This is the gate for Task 01b.
- For each System A table being dropped, an additional grep in isolation must also return zero: `git grep -w "affiliate_commissions" -- 'src/**'`, `git grep -w "affiliate_referral_links" -- 'src/**'`, etc. This catches usages that squeeze past the combined grep.
- Stripe webhook still type-checks and compiles.
- A manual end-to-end test booking with `ref_code` set produces a
  `campaign_conversions` row and the money-split total reported by
  `getAffiliateCommissionTotalForOrderRef` matches the commission row.
- **Affiliate portal post-login smoke test:** log in as a test affiliate;
  `/affiliate/dashboard`, `/affiliate/partnerships`, `/affiliate/earnings`
  all load without error. No 500s, no "table does not exist" stack traces.
- **Caveat for Task 01b:** Task 02 completion does NOT yet unlock 01b.
  Five admin-side endpoints still read System A and are now Task 07's
  responsibility to finish (see
  [07-reporting-and-dashboards.md](07-reporting-and-dashboards.md) →
  "Additional admin-side endpoints that MUST be handled before Task 01b").
  01b can run only after BOTH Task 02 and Task 07 close these out.

## Notes

- Do NOT drop the tables yet. Task 01b does that after this task lands
  and has been sanity-checked against the dev environment.
- `calculateMoneySplit` (`src/lib/money-split.ts`) is pure math and
  stays unchanged.

## Suggested files

- `src/lib/revenue-ledger.ts`
- `src/app/api/stripe/webhooks/route.ts`
- `src/lib/affiliate-commissions.ts` (delete)
- Various route folders (delete; see above)
- Spec: add Changelog entry "System A retired from the live write path"
