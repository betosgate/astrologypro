# Task 09 — Notifications + Existing-Page Integrations + Failed-Payout Alert

- Status: Not Started
- Priority: P0
- Depends on: 04, 05, 06
- Blocks: 08

## Goal

Close the gaps the cross-check audit surfaced:

1. **4 new affiliate notification kinds** wired to fire from
   Tasks 04 + 05 + 02 (deauthorization)
2. **Per-kind copy generators** following the established pattern in
   [src/lib/affiliate-notifications.ts:167+](src/lib/affiliate-notifications.ts#L167)
3. **Existing admin affiliate reports updated** at
   [src/app/admin/reports/affiliates/](src/app/admin/reports/affiliates/) —
   add payout columns / breakdowns to existing pages
4. **Failed-payout admin alert widget** on
   [src/app/admin/reports/finance-ops/](src/app/admin/reports/finance-ops/) —
   mirrors the stale-offset widget but for `affiliate_payouts.status='failed'`
5. **Conversions list endpoint extended** so the per-row
   `PayoutStatusPill` from Task 06 has data to render

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/affiliate-notifications.ts` | **Modify** — add 4 new kinds to the union type + 4 copy generators |
| 2 | `src/app/api/dashboard/affiliate-reports/conversions/route.ts` (verified path; line 64 has the `from("campaign_conversions")` SELECT) | **Modify** — include `payout_status, ripeness_at, paid_at, paid_amount_cents` in SELECT |
| 3 | `src/app/admin/reports/affiliates/page.tsx` | **Modify** — top-of-page summary cards include new payout breakdown |
| 4 | `src/app/admin/reports/affiliates/_components/AffiliatePayoutSummary.tsx` (verify name; create if needed) | **Create** — reusable widget |
| 5 | `src/app/admin/reports/finance-ops/page.tsx` | **Modify** — add `<FailedPayoutsWidget />` alongside the stale-offset widget |
| 6 | `src/app/admin/reports/finance-ops/_components/FailedPayoutsWidget.tsx` | **Create** — list of `affiliate_payouts.status='failed'` rows in the last 7 days with retry links |
| 7 | `src/app/api/admin/affiliate-payouts/failed-recent/route.ts` | **Create** — GET feed for the widget |

## Important schema note (verified 2026-05-05)

The `notifications.type` column has a CHECK constraint with a fixed set
of values:

```
type CHECK (type IN ('info','success','warning','error','training','ritual','billing','system'))
```

Verified at [supabase/migrations/20260406000013_notifications.sql:11](supabase/migrations/20260406000013_notifications.sql#L11).

This means the in-app notification rows that `notifyAffiliate` writes
**cannot** carry a `type='affiliate'` or `type='affiliate_payout'` value.
The existing helper at [src/lib/affiliate-notifications.ts:108](src/lib/affiliate-notifications.ts#L108)
already uses `'billing'` as the closest valid bucket — Phase 2 keeps
that mapping. **Do NOT propose extending this CHECK constraint** as
part of Phase 2; it's a broader refactor (requires UI updates for the
notifications inbox to render an `'affiliate'` category icon, etc.)
and is out of scope.

The 5 new `AffiliateNotificationKind` values (the `kind` field in
`notifyAffiliate`) are independent of `notifications.type` — those go
into the title/body and the `kind`-keyed `notification_prefs` toggles,
not the row's `type` column.

## Edit 1 — Extend the notification kinds union

**File:** `src/lib/affiliate-notifications.ts`

### Anchor — find the existing union

```ts
export type AffiliateNotificationKind =
  | "affiliate.assigned"
  | "affiliate.rate_changed"
  | "affiliate.revoked"
  | "affiliate.conversion"
  | "affiliate.reversal"
  | "admin.override.assignment_revoked"
  | "admin.override.campaign_archived";
```

### Extend with Phase 2 kinds

```ts
export type AffiliateNotificationKind =
  | "affiliate.assigned"
  | "affiliate.rate_changed"
  | "affiliate.revoked"
  | "affiliate.conversion"
  | "affiliate.reversal"
  // Phase 2 (Affiliate Payouts):
  | "affiliate.payout_completed"
  | "affiliate.payout_failed"
  | "affiliate.offset_applied"
  | "affiliate.stripe_disconnected"
  | "affiliate.stripe_verification_needed"
  | "admin.override.assignment_revoked"
  | "admin.override.campaign_archived";
```

## Edit 2 — Add copy generators (5 functions)

Append to the end of `src/lib/affiliate-notifications.ts`. Each
generator wraps `notifyAffiliate` with kind-specific title + body.
Pattern matches the existing `formatRate` helper at
[src/lib/affiliate-notifications.ts:172](src/lib/affiliate-notifications.ts#L172).

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

interface CommonInput {
  admin: SupabaseClient;
  affiliateAccountId: string;
}

async function resolveRecipient(
  admin: SupabaseClient,
  affiliateAccountId: string,
): Promise<{ userId: string; email: string } | null> {
  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("user_id, email")
    .eq("id", affiliateAccountId)
    .maybeSingle();
  if (!account?.user_id || !account?.email) return null;
  return {
    userId: account.user_id as string,
    email: account.email as string,
  };
}

/**
 * Fired after a successful Stripe transfer for an affiliate's payout.
 * Includes net amount, the Stripe transfer id, and a link to payout
 * detail.
 */
export async function notifyAffiliatePayoutCompleted(input: CommonInput & {
  netCents: number;
  payoutId: string;
  stripeTransferId: string | null;
}): Promise<void> {
  const recipient = await resolveRecipient(input.admin, input.affiliateAccountId);
  if (!recipient) return;
  const dollars = (input.netCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    kind: "affiliate.payout_completed",
    title: `Payout sent: $${dollars}`,
    body: `Your payout of $${dollars} has been transferred to your Stripe account. ${
      input.stripeTransferId
        ? `Transfer ID: ${input.stripeTransferId}.`
        : "(Settled via offset — no Stripe transfer needed this cycle.)"
    }`,
    actionUrl: `/affiliate/payouts/${input.payoutId}`,
    toEmail: recipient.email,
  });
}

/**
 * Fired when a Stripe transfer attempt fails (e.g., account in restricted
 * state). Affiliate is advised to fix their Stripe account; cron retries
 * on next tick.
 */
export async function notifyAffiliatePayoutFailed(input: CommonInput & {
  netCents: number;
  payoutId: string;
  failureReason: string;
}): Promise<void> {
  const recipient = await resolveRecipient(input.admin, input.affiliateAccountId);
  if (!recipient) return;
  const dollars = (input.netCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    kind: "affiliate.payout_failed",
    title: `Payout pending: action needed`,
    body:
      `We tried to transfer $${dollars} to your Stripe account but it failed: ${input.failureReason}. ` +
      `We'll retry automatically once your Stripe account is in good standing.`,
    actionUrl: `/affiliate/dashboard?stripe=verify`,
    toEmail: recipient.email,
  });
}

/**
 * Fired when a booking is refunded after the affiliate has already been
 * paid for it; the affiliate's `balance_offset_cents` is incremented by
 * the conversion's `paid_amount_cents` and the offset is consumed from
 * the next payout.
 */
export async function notifyAffiliateOffsetApplied(input: CommonInput & {
  offsetIncrementCents: number;
  newBalanceOffsetCents: number;
  bookingId: string;
}): Promise<void> {
  const recipient = await resolveRecipient(input.admin, input.affiliateAccountId);
  if (!recipient) return;
  const inc = (input.offsetIncrementCents / 100).toFixed(2);
  const total = (input.newBalanceOffsetCents / 100).toFixed(2);
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    kind: "affiliate.offset_applied",
    title: `Refund offset: $${inc} will be deducted from your next payout`,
    body:
      `A booking you earned commission on was refunded after we paid you. ` +
      `$${inc} will be deducted from your next payout. Outstanding offset: $${total}.`,
    actionUrl: `/affiliate/earnings`,
    toEmail: recipient.email,
  });
}

/**
 * Fired when the affiliate revokes platform access from their Stripe
 * Dashboard (`account.application.deauthorized` webhook). They must
 * reconnect to receive future payouts.
 */
export async function notifyAffiliateStripeDisconnected(input: CommonInput): Promise<void> {
  const recipient = await resolveRecipient(input.admin, input.affiliateAccountId);
  if (!recipient) return;
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    kind: "affiliate.stripe_disconnected",
    title: "Stripe disconnected — reconnect to receive payouts",
    body:
      `Your Stripe account has been disconnected from our platform. ` +
      `Reconnect from your affiliate dashboard to start receiving payouts again. ` +
      `Earnings continue to accrue while disconnected.`,
    actionUrl: `/affiliate/dashboard`,
    toEmail: recipient.email,
  });
}

/**
 * Fired when an `account.updated` webhook arrives with non-empty
 * `requirements.currently_due` or `requirements.past_due`, AND the
 * affiliate isn't already in `payouts_enabled` state. Surfaces what
 * Stripe is asking for.
 */
export async function notifyAffiliateStripeVerificationNeeded(input: CommonInput & {
  requirementsCurrentlyDue: string[];
  requirementsPastDue: string[];
}): Promise<void> {
  const recipient = await resolveRecipient(input.admin, input.affiliateAccountId);
  if (!recipient) return;
  const all = [...input.requirementsPastDue, ...input.requirementsCurrentlyDue];
  if (all.length === 0) return; // nothing to ask for
  const summary = all.slice(0, 3).join(", ");
  await notifyAffiliate({
    admin: input.admin,
    userId: recipient.userId,
    affiliateAccountId: input.affiliateAccountId,
    kind: "affiliate.stripe_verification_needed",
    title: "Stripe verification needed",
    body:
      `Stripe needs more information before it can release your payouts: ${summary}. ` +
      `Open your affiliate dashboard to resume Stripe onboarding.`,
    actionUrl: `/affiliate/dashboard?stripe=verify`,
    toEmail: recipient.email,
  });
}
```

## Edit 3 — Wire `notifyAffiliatePayoutCompleted` + `notifyAffiliatePayoutFailed`

**File:** `src/lib/affiliate-payout-execution.ts`

After the success branch (where `affiliate_payouts.status` flips to
`completed`), call:

```ts
import {
  notifyAffiliatePayoutCompleted,
  notifyAffiliatePayoutFailed,
} from "@/lib/affiliate-notifications";

// In the success path:
await notifyAffiliatePayoutCompleted({
  admin,
  affiliateAccountId: g.affiliateAccountId,
  netCents: net,
  payoutId: payoutRowId,
  stripeTransferId: transfer.id,
});

// In the offset-fully-consumed path:
await notifyAffiliatePayoutCompleted({
  admin,
  affiliateAccountId: g.affiliateAccountId,
  netCents: 0,
  payoutId: payoutRowId,
  stripeTransferId: null,
});

// In the catch (failure) path:
await notifyAffiliatePayoutFailed({
  admin,
  affiliateAccountId: g.affiliateAccountId,
  netCents: net,
  payoutId: payoutRowId,
  failureReason: message.slice(0, 200),
});
```

Each call is fire-and-forget — the helper already swallows internal
errors. Don't wrap in try/catch.

## Edit 4 — Wire `notifyAffiliateOffsetApplied`

**File:** `src/lib/affiliate-offset.ts`

Inside `applyRefundOffsetForBooking`, after the successful update + the
`admin_action_log` write, fire the notification:

```ts
import { notifyAffiliateOffsetApplied } from "@/lib/affiliate-notifications";

// After audit log write, before returning ok:
try {
  await notifyAffiliateOffsetApplied({
    admin,
    affiliateAccountId,
    offsetIncrementCents: offsetIncrement,
    newBalanceOffsetCents: newOffset,
    bookingId,
  });
} catch (err) {
  console.error("[applyRefundOffsetForBooking] notify failed", err);
}
```

## Edit 5 — Wire `notifyAffiliateStripeVerificationNeeded`

**File:** `src/lib/affiliate-stripe-sync.ts`

Inside `syncAffiliateStripeStatus`, after the cache-column update, fire
the notification only when verification is genuinely outstanding:

```ts
import { notifyAffiliateStripeVerificationNeeded } from "@/lib/affiliate-notifications";

// After the .update(...) call:
if (
  !status.payoutsEnabled &&
  (status.requirementsCurrentlyDue.length > 0 ||
    status.requirementsPastDue.length > 0)
) {
  try {
    await notifyAffiliateStripeVerificationNeeded({
      admin,
      affiliateAccountId,
      requirementsCurrentlyDue: status.requirementsCurrentlyDue,
      requirementsPastDue: status.requirementsPastDue,
    });
  } catch (err) {
    console.error("[syncAffiliateStripeStatus] notify failed", err);
  }
}
```

> **Throttling:** if `account.updated` fires repeatedly (Stripe can
> send multiple in quick succession), this could spam the affiliate.
> Add a soft dedup: check if `affiliate.stripe_verification_needed`
> was sent in the last 24h via the existing notifications table, and
> skip if so. Implementation note in PR description; not blocking
> unless we observe spam in dry-run.

## Edit 6 — Wire `notifyAffiliateStripeDisconnected`

Already wired in Task 02's `account.application.deauthorized` branch.
This task adds the helper (above); Task 02's webhook already calls it.
**No new code in the webhook handler — Task 02 references the helper
that this task creates.** When implementing in real order, ship Task 09
helpers before merging Task 02's webhook code, OR ship simultaneously.

## Edit 7 — Conversions list endpoint

Find the existing route returning the conversions list rendered on
the affiliate's earnings page:

```bash
grep -rn "campaign_conversions" src/app/api/affiliate/ \
  | grep -i "select" | head -10
```

Likely candidates: `src/app/api/affiliate/reports/conversions/route.ts`
or `src/app/api/dashboard/affiliate-reports/conversions/route.ts`.
Open the route, locate the SELECT, and extend:

```ts
.select(
  "id, campaign_id, affiliate_id, booking_id, order_amount_cents, " +
  "commission_amount_cents, rate_type_used, rate_value_used, " +
  "reversed_at, reversal_reason, converted_at, " +
  // Phase 2 additions:
  "payout_status, ripeness_at, paid_at, paid_amount_cents"
)
```

The existing response shape gains 4 new fields; existing consumers
ignore them. Type definitions in the corresponding API client (if any)
need extension.

## Edit 8 — Existing admin affiliate reports

**File:** `src/app/admin/reports/affiliates/page.tsx`

Add a new summary section at the top of the page (above the existing
earnings table) showing:

| Metric | Value | Sub-text |
|---|---|---|
| Total earned (this period) | $X | sum `commission_amount_cents` excl reversed |
| Total paid | $Y | sum `paid_amount_cents` where `payout_status='paid'` |
| Currently held | $Z | sum where `payout_status` in (`unpaid`, `ripe`, `paying`) |
| Outstanding offset | $W | sum `affiliate_accounts.balance_offset_cents` across active affiliates |

Numbers come from a new endpoint (or extend the existing one feeding
this page; verify the existing data shape first):

```bash
grep -rn "from(\"campaign_conversions\")\|from('campaign_conversions')" \
  src/app/api/admin/reports/affiliates/ \
  src/app/api/admin/affiliates/ 2>/dev/null
# Find the existing aggregation endpoint and extend its SELECT to
# include payout_status / paid_amount_cents / balance_offset_cents.
```

If no admin reports endpoint exists yet, create
`src/app/api/admin/affiliate-payout-summary/route.ts` returning the
aggregated cents.

## Edit 9 — Failed-payout widget endpoint

**File:** `src/app/api/admin/affiliate-payouts/failed-recent/route.ts`

```ts
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("affiliate_payouts")
    .select(
      `id, affiliate_account_id, ripe_total_cents, net_transferred_cents,
       failure_reason, created_at,
       affiliate:affiliate_accounts(id, name, email)`,
    )
    .eq("status", "failed")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ items: data ?? [] });
}
```

## Edit 10 — Failed-payout widget component

**File:** `src/app/admin/reports/finance-ops/_components/FailedPayoutsWidget.tsx`

Server Component or Client Component matching the existing pattern of
the stale-offset widget on the same page. Renders the failed list with
links to `/admin/reports/affiliate-payouts/[id]` (Task 07).

```tsx
import { headers } from "next/headers";

export async function FailedPayoutsWidget() {
  const res = await fetch("/api/admin/affiliate-payouts/failed-recent", {
    headers: await headers(),
    cache: "no-store",
  });
  const { items } = await res.json();
  if (!items || items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failed Affiliate Payouts (last 7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>When</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.affiliate?.name ?? "—"}</TableCell>
                <TableCell>${(row.net_transferred_cents / 100).toFixed(2)}</TableCell>
                <TableCell className="text-red-600">{row.failure_reason}</TableCell>
                <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Link href={`/admin/reports/affiliate-payouts/${row.id}`}>
                    Investigate
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

## Edit 11 — Mount widget on finance-ops dashboard

**File:** `src/app/admin/reports/finance-ops/page.tsx`

```tsx
import { FailedPayoutsWidget } from "./_components/FailedPayoutsWidget";
// existing imports...

// Inside the page render, near the existing widgets:
<FailedPayoutsWidget />
{/* alongside the existing stale-offset / unpaid-subscriptions / etc. widgets */}
```

## Acceptance for this task

- [ ] `AffiliateNotificationKind` union extended with the 5 new kinds
- [ ] 5 copy generators exported from `affiliate-notifications.ts`
- [ ] `notifyAffiliatePayoutCompleted` fires on every successful
      transfer + every offset-fully-consumed path
- [ ] `notifyAffiliatePayoutFailed` fires on every failed transfer
- [ ] `notifyAffiliateOffsetApplied` fires when
      `applyRefundOffsetForBooking` succeeds with `offsetIncrement > 0`
- [ ] `notifyAffiliateStripeDisconnected` fires when the
      `account.application.deauthorized` webhook lands (Task 02 wiring)
- [ ] `notifyAffiliateStripeVerificationNeeded` fires from
      `syncAffiliateStripeStatus` when Stripe reports outstanding
      requirements AND the affiliate isn't already payouts-enabled
- [ ] All 5 notifications respect
      `affiliate_accounts.notification_prefs` per-kind toggles
- [ ] Conversions list endpoint returns `payout_status`,
      `ripeness_at`, `paid_at`, `paid_amount_cents` on every row
- [ ] Existing affiliate earnings page uses `<PayoutStatusPill />`
      (Task 06) on every conversion row
- [ ] Existing `/admin/reports/affiliates` page shows the new
      summary section with 4 metric cards (earned / paid / held /
      offset)
- [ ] `<FailedPayoutsWidget />` appears on
      `/admin/reports/finance-ops` and renders the last 7 days of
      `affiliate_payouts.status='failed'` rows
- [ ] No regression in existing affiliate notifications
      (`affiliate.assigned`, `affiliate.conversion`, etc.)

## Verification

```bash
# All 5 helpers exported
grep -n "export async function notifyAffiliate" src/lib/affiliate-notifications.ts
# Expected: 6 hits — 1 base + 5 Phase 2

# Wired in payout execution
grep -n "notifyAffiliatePayout" src/lib/affiliate-payout-execution.ts
# Expected: 2 distinct (Completed + Failed)

# Wired in offset
grep -n "notifyAffiliateOffsetApplied" src/lib/affiliate-offset.ts
# Expected: 1 hit

# Wired in stripe sync
grep -n "notifyAffiliateStripeVerificationNeeded" src/lib/affiliate-stripe-sync.ts
# Expected: 1 hit

# Existing admin reports updated
grep -n "balance_offset_cents\|payout_status" src/app/admin/reports/affiliates/

# Failed widget mounted
grep -n "FailedPayoutsWidget" src/app/admin/reports/finance-ops/page.tsx
```

### Manual E2E

1. **Payout success notification** — flip kill-switch ON, run cron with
   ripe conversions → recipient sees "Payout sent: $X" in inbox + email
2. **Payout failure notification** — set affiliate's Stripe account to
   restricted via Stripe test mode → next cron tick → "Payout pending"
   notification fires
3. **Offset notification** — refund a paid booking → "Refund offset"
   notification fires
4. **Disconnect notification** — replay `account.application.deauthorized`
   → "Stripe disconnected" notification fires
5. **Verification notification** — onboard a Stripe account, leave a
   requirement past_due in test mode → `account.updated` fires →
   "Stripe verification needed" notification fires
6. **Admin failed-payout widget** — force a failed payout → row appears
   on `/admin/reports/finance-ops` within seconds
7. **Existing admin/reports/affiliates** — pre-populate test data with
   paid + offset + held conversions → all 4 metric cards reflect
   correct sums

## Out of scope

- Long-form HTML email templates with branded layout — minimal copy
  for v1; richer templates a follow-up
- Push notifications (mobile / browser) — in-app + email only
- Per-conversion drilldown on the admin affiliate report — link to
  existing detail pages
- Auto-throttle of duplicate verification-needed notifications across
  multiple `account.updated` webhooks within 24h — flagged in Edit 5
  but not implemented unless dry-run shows spam
- Slack / Discord webhook integration for admin failed-payout
  alerts — admin dashboard widget only
