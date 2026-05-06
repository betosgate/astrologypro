# Task 06 — Affiliate UI: Connect Stripe + Payout Visibility

- Status: Not Started
- Priority: P0
- Depends on: 01, 02, 04
- Blocks: 08

## Goal

Surface the four pieces of state the affiliate needs to see:

1. **Connection status** — Connect / Resume / Pending verification / Connected
2. **Earnings summary** — total earned, total paid, pending (ripe-but-not-yet-paid), upcoming-cycle estimate
3. **Outstanding offset** — if `balance_offset_cents > 0`, show what
   refunded booking caused it and the affected next-payout amount
4. **Payout history** — table of past payouts with Stripe transfer ID,
   amount, status, date, line-item drilldown

Plus the **gate UX** when the affiliate isn't payouts-enabled:
"Create campaign" / "Create share link" buttons disabled with the
correct CTA from Task 03.

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/affiliate/(portal)/dashboard/page.tsx` | **Modify** — add connection status panel + earnings summary + offset banner |
| 2 | `src/app/affiliate/(portal)/earnings/page.tsx` | **Modify** — add payout history table + drilldown |
| 3 | `src/app/affiliate/(portal)/_components/StripeConnectPanel.tsx` | **Create** — reusable status panel |
| 4 | `src/app/affiliate/(portal)/_components/OffsetBanner.tsx` | **Create** — alert banner shown when offset > 0 |
| 5 | `src/app/affiliate/(portal)/_components/PayoutHistoryTable.tsx` | **Create** — table component |
| 6 | `src/app/api/affiliate/payouts/route.ts` | **Create** — GET list payouts for current affiliate |
| 7 | `src/app/api/affiliate/payouts/[id]/route.ts` | **Create** — GET single payout with line items |
| 8 | `src/app/api/affiliate/earnings-summary/route.ts` | **Create** — GET aggregated earned/paid/pending/offset/next-cycle |
| 9 | `src/app/affiliate/(portal)/campaigns/create/page.tsx` (or wherever the create flow lives — verify) | **Modify** — show the Task-03 readiness CTA when not ready |
| 10 | `src/app/affiliate/(portal)/earnings/page.tsx` | **Modify** — add per-row payout-status pill on the existing conversions list |
| 11 | `src/app/affiliate/(portal)/_components/PayoutStatusPill.tsx` | **Create** — reusable pill component (used in both per-conversion list AND payout history table) |
| 12 | `src/app/affiliate/(portal)/_components/TaxInfoLink.tsx` | **Create** — link to Stripe Express's hosted tax document page |

Verify exact paths before writing — the affiliate portal layout uses
the `(portal)` route group and components live under
`_components/`. Match the existing pattern, don't invent a new one.

## Edit 1 — Earnings summary endpoint

**File:** `src/app/api/affiliate/earnings-summary/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/earnings-summary
 * Returns aggregated balances for the current affiliate's dashboard.
 *
 * Numbers are computed from campaign_conversions + affiliate_payouts.
 * Cents-based throughout; the UI does the dollar formatting.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id, balance_offset_cents, balance_offset_last_changed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
  }

  // All conversions for this affiliate, joined via diviner_affiliates
  const { data: conversions } = await admin
    .from("campaign_conversions")
    .select(
      `id, commission_amount_cents, paid_amount_cents, payout_status,
       reversed_at, ripeness_at,
       affiliate:diviner_affiliates!inner(affiliate_account_id)`,
    )
    .eq("affiliate.affiliate_account_id", affiliate.id);

  let earned = 0;        // sum commission_amount_cents (excl reversed)
  let paid = 0;          // sum paid_amount_cents (status='paid')
  let pendingRipe = 0;   // ripe-but-not-yet-paid
  let pendingHolding = 0; // unpaid + ripeness in future
  let reversed = 0;
  let offsetApplied = 0;

  const now = Date.now();
  for (const c of (conversions ?? []) as any[]) {
    const cents = Number(c.commission_amount_cents ?? 0);
    if (c.reversed_at) {
      reversed += cents;
      continue;
    }
    earned += cents;
    if (c.payout_status === "paid") {
      paid += Number(c.paid_amount_cents ?? 0);
    } else if (c.payout_status === "offset_applied") {
      offsetApplied += Number(c.paid_amount_cents ?? 0);
    } else if (c.payout_status === "ripe" || c.payout_status === "paying") {
      pendingRipe += cents;
    } else {
      // unpaid
      const ripenessMs = c.ripeness_at ? new Date(c.ripeness_at).getTime() : Infinity;
      if (ripenessMs <= now) pendingRipe += cents;
      else pendingHolding += cents;
    }
  }

  const offset = Number(affiliate.balance_offset_cents ?? 0);
  const nextCycleNet = Math.max(0, pendingRipe - offset);

  return NextResponse.json({
    earnedCents: earned,
    paidCents: paid,
    pendingRipeCents: pendingRipe,
    pendingHoldingCents: pendingHolding,
    reversedCents: reversed,
    offsetCents: offset,
    offsetLastChangedAt: affiliate.balance_offset_last_changed_at,
    offsetAppliedHistoricalCents: offsetApplied,
    nextCycleEstimateCents: nextCycleNet,
  });
}
```

## Edit 2 — Payouts list endpoint

**File:** `src/app/api/affiliate/payouts/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate) return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });

  const { data: payouts, count } = await admin
    .from("affiliate_payouts")
    .select(
      "id, ripe_total_cents, offset_applied_cents, net_transferred_cents, " +
      "stripe_transfer_id, status, failure_reason, blocked_reason, " +
      "created_at, transferred_at, trigger_source, notes",
      { count: "exact" },
    )
    .eq("affiliate_account_id", affiliate.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    items: payouts ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
```

## Edit 3 — Payout detail endpoint

**File:** `src/app/api/affiliate/payouts/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: payout } = await admin
    .from("affiliate_payouts")
    .select(
      `id, affiliate_account_id, stripe_account_id, ripe_total_cents,
       offset_applied_cents, net_transferred_cents, stripe_transfer_id,
       status, failure_reason, blocked_reason, created_at, transferred_at,
       trigger_source, notes,
       items:affiliate_payout_items(id, conversion_id, applied_amount_cents, offset_applied_cents,
         conversion:campaign_conversions(id, booking_id, commission_amount_cents, converted_at,
           campaign:affiliate_campaigns(id, name, share_code)))`,
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorize: caller's affiliate_account_id must match
  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate || affiliate.id !== payout.affiliate_account_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(payout);
}
```

## Edit 4 — `StripeConnectPanel.tsx`

**File:** `src/app/affiliate/(portal)/_components/StripeConnectPanel.tsx`

Renders one of four states based on the `/api/affiliate/stripe-connect/status`
response. Match the existing affiliate portal's design tokens / shadcn
components (look at sibling files for the right `Card`, `Button`,
`Badge` imports).

State matrix:

| connected | payoutsEnabled | detailsSubmitted | Render |
|---|---|---|---|
| false | — | — | "Connect Stripe" button (POST `/start`) — primary CTA, full-width |
| true | false | false | Yellow banner: "Resume Stripe onboarding" — links to fresh `/start` |
| true | false | true | Yellow banner: "Stripe is verifying your account. We'll enable payouts when verification completes." |
| true | true | true | Green check: "Connected — payouts enabled" + small text "Last synced 2m ago" |

The "Connect Stripe" / "Resume" buttons hit POST `/api/affiliate/stripe-connect/start`,
read `{ url }` from the response, and `window.location.href = url`.

## Edit 5 — `OffsetBanner.tsx`

**File:** `src/app/affiliate/(portal)/_components/OffsetBanner.tsx`

Renders only when `summary.offsetCents > 0`. Yellow/amber banner above
the earnings summary cards.

```
⚠ A previous booking was refunded after we paid you the commission.
   $35.00 will be deducted from your next payout.
   [What's this?] (links to a help article — placeholder for now)
```

If `nextCycleEstimateCents === 0` because offset >= ripe, change wording:

```
⚠ Your next payout is fully offset by a prior refund.
   You'll receive payouts again once you earn back $35.00.
```

## Edit 6 — `PayoutHistoryTable.tsx`

Standard table:

| Date | Net Transfer | Offset Applied | Status | Stripe Transfer | Actions |
|---|---|---|---|---|---|
| Mar 5, 2026 | $113.75 | — | Completed | tr_1AbC... (link to drilldown) | View details |
| Feb 26, 2026 | $0.00 | $35.00 | Offset Applied | — (no transfer) | View details |
| Feb 19, 2026 | — | — | Failed | — | Show reason |

Status pills:

- `dry_run` → grey "Preview" — only visible to admins (filter out for affiliates)
- `pending` → blue "Processing"
- `completed` → green "Paid"
- `offset_applied` → amber "Offset"
- `failed` → red "Failed" with `failure_reason` tooltip
- `blocked` → red "Blocked" with `blocked_reason` tooltip
- `disputed` → red "Disputed" (admin-only state)

For affiliates, **filter out** `dry_run` rows in the API endpoint
(Edit 2 — add `.in("status", ["pending","completed","offset_applied","failed","blocked"])`).

## Edit 7 — Update dashboard page

**File:** `src/app/affiliate/(portal)/dashboard/page.tsx`

Add three sections in this order, above the existing campaign list:

1. `<StripeConnectPanel />`
2. `<OffsetBanner summary={...} />` (renders null if offset = 0)
3. Earnings summary cards: Earned / Paid / Pending / Next-cycle estimate

The summary numbers come from `/api/affiliate/earnings-summary`.

If `connected && payoutsEnabled === true` AND `offsetCents === 0`,
the StripeConnectPanel is collapsed to a one-line success row at the
top of the dashboard so it doesn't dominate the layout.

## Edit 7b — Per-row payout status pill (existing earnings page)

The existing affiliate earnings page lists individual conversions with
amounts but no payout-state visibility. Phase 2 adds a `payout_status`
pill per row.

### Anchor

Find the existing conversions table at
`src/app/affiliate/(portal)/earnings/page.tsx` (or the underlying
`ConversionsTable` component if separated). Locate the column
definition list — typically a header row like:

```tsx
<TableHead>Date</TableHead>
<TableHead>Campaign</TableHead>
<TableHead>Order amount</TableHead>
<TableHead>Commission</TableHead>
```

### Add a status column between Commission and any trailing actions

```tsx
<TableHead>Date</TableHead>
<TableHead>Campaign</TableHead>
<TableHead>Order amount</TableHead>
<TableHead>Commission</TableHead>
<TableHead>Payout status</TableHead>
{/* ... existing trailing columns ... */}
```

In the row body, render the new `<PayoutStatusPill />`:

```tsx
<TableCell>
  <PayoutStatusPill
    status={conversion.payout_status}
    ripenessAt={conversion.ripeness_at}
    paidAt={conversion.paid_at}
  />
</TableCell>
```

### Update the API endpoint feeding this list

The conversions list endpoint (likely `/api/affiliate/reports/conversions`
or similar — search for the existing handler) must include
`payout_status, ripeness_at, paid_at, paid_amount_cents` in the
SELECT.

```bash
grep -rn "campaign_conversions" src/app/api/affiliate/ \
  | grep -i "select\|reports/conversions"
# Find the existing route and add the columns to its SELECT.
```

## Edit 7c — Create `PayoutStatusPill` component

**File:** `src/app/affiliate/(portal)/_components/PayoutStatusPill.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

type PayoutStatus =
  | "unpaid" | "ripe" | "paying" | "paid" | "offset_applied" | "blocked";

const PILL_COPY: Record<PayoutStatus, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  unpaid: { label: "Holding", tone: "outline" },
  ripe: { label: "Ready to pay", tone: "secondary" },
  paying: { label: "Processing", tone: "secondary" },
  paid: { label: "Paid", tone: "default" },
  offset_applied: { label: "Offset (refunded)", tone: "outline" },
  blocked: { label: "Reversed", tone: "destructive" },
};

export function PayoutStatusPill({
  status,
  ripenessAt,
  paidAt,
}: {
  status: PayoutStatus;
  ripenessAt?: string | null;
  paidAt?: string | null;
}) {
  const cfg = PILL_COPY[status] ?? PILL_COPY.unpaid;
  let tooltip: string | undefined;

  if (status === "unpaid" && ripenessAt) {
    const ms = new Date(ripenessAt).getTime() - Date.now();
    if (ms > 0) {
      tooltip = `Available in ${formatDistanceToNow(new Date(ripenessAt))}`;
    }
  } else if (status === "paid" && paidAt) {
    tooltip = `Paid ${formatDistanceToNow(new Date(paidAt), { addSuffix: true })}`;
  } else if (status === "offset_applied") {
    tooltip = "Booking refunded after payout. Offset applied to your next payout.";
  }

  return (
    <Badge variant={cfg.tone} title={tooltip}>
      {cfg.label}
    </Badge>
  );
}
```

> Verify the project's badge import path (`@/components/ui/badge`) and
> available variants. Match what other affiliate portal files use.

## Edit 7d — Tax Info link

**File:** `src/app/affiliate/(portal)/_components/TaxInfoLink.tsx`

Stripe Express provides a hosted tax document page accessible via
`stripe.accounts.createLoginLink(accountId)` — this returns a
short-lived URL the affiliate can use to access their Stripe Express
dashboard, which includes downloadable 1099-NEC forms.

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TaxInfoLink({ stripeAccountId }: { stripeAccountId: string | null }) {
  const [loading, setLoading] = useState(false);

  if (!stripeAccountId) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect Stripe to access tax documents.
      </p>
    );
  }

  async function open() {
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/stripe-connect/login-link", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={open} disabled={loading}>
      {loading ? "Opening…" : "View tax documents (Stripe)"}
    </Button>
  );
}
```

### Add the supporting endpoint

**File:** `src/app/api/affiliate/stripe-connect/login-link/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!affiliate?.stripe_account_id) {
    return NextResponse.json({ error: "Stripe not connected" }, { status: 400 });
  }

  const link = await stripe.accounts.createLoginLink(
    affiliate.stripe_account_id as string,
  );
  return NextResponse.json({ url: link.url });
}
```

The `TaxInfoLink` component is added to the affiliate dashboard
sidebar / footer near the existing earnings link — match the layout
of the existing portal.

## Edit 8 — Update earnings page

**File:** `src/app/affiliate/(portal)/earnings/page.tsx`

Add a new "Payouts" section beneath the existing earnings detail
(conversions table). Render `<PayoutHistoryTable />` driven by
`/api/affiliate/payouts`.

Drilldown: clicking a row navigates to `/affiliate/payouts/[id]`
(create a new page that fetches `/api/affiliate/payouts/[id]` and
renders the line items table). Each line item shows the booking date,
campaign name, gross commission, applied amount, offset applied.

## Edit 9 — Gate the campaign creation flow

**File:** `src/app/affiliate/(portal)/campaigns/create/page.tsx` (or
wherever the create form lives — verify path)

Server-side: call `checkAffiliatePayoutReadiness` (from Task 03).
If `!ready`, render the gating screen instead of the form:

```
[icon] Connect Stripe to create new campaigns
       Existing campaigns continue to work — this only affects new ones.
       [Connect Stripe →] (or Resume / Pending / Contact support based on cta)
```

Submitting the form calls the existing POST endpoint. The Task 03
gate returns 403 if somehow bypassed; surface the structured error
in a toast.

## Acceptance for this task

- [ ] Affiliate dashboard shows the StripeConnectPanel in the correct
      state for each of the 4 scenarios in the table above
- [ ] Earnings summary numbers match SQL hand-computed values across
      ≥3 test affiliates
- [ ] OffsetBanner appears when `balance_offset_cents > 0`,
      disappears when zero
- [ ] Payout history table lists payouts in `created_at DESC` order with
      status pills rendered correctly
- [ ] `dry_run` rows are NOT visible to affiliates (filtered server-side)
- [ ] Drilldown to a payout shows line items with booking date,
      campaign, gross, applied, offset
- [ ] "Create campaign" page shows the gating screen for non-ready
      affiliates with the correct CTA from Task 03's readiness helper
- [ ] All four `cta` values (`connect`, `resume`, `verify`,
      `contact_support`) render distinct, correct UI
- [ ] No regression in existing affiliate dashboard / earnings UIs for
      a fully-connected affiliate
- [ ] Per-row payout-status pill renders correctly on the existing
      conversions list — `unpaid` shows "Holding" + countdown tooltip,
      `ripe` shows "Ready to pay", `paid` shows "Paid X ago", etc.
- [ ] Tax-info link opens Stripe Express's hosted login (with the 1099
      tax page reachable from there). Affiliate without Stripe
      connected sees the "Connect Stripe to access tax documents" copy
      instead.

## Verification

```bash
# Files landed
ls src/app/affiliate/\(portal\)/_components/StripeConnectPanel.tsx \
   src/app/affiliate/\(portal\)/_components/OffsetBanner.tsx \
   src/app/affiliate/\(portal\)/_components/PayoutHistoryTable.tsx \
   src/app/api/affiliate/payouts/route.ts \
   src/app/api/affiliate/payouts/\[id\]/route.ts \
   src/app/api/affiliate/earnings-summary/route.ts

# Component imports the right helpers
grep -n "checkAffiliatePayoutReadiness" src/app/affiliate/

# E2E (manual):
# 1. Sign in as test affiliate with no Stripe → see Connect CTA, Create
#    Campaign blocked
# 2. Connect Stripe in test mode → see Connected pill, Create Campaign
#    enabled
# 3. Trigger a paid booking via test booking → see ripe pending in
#    earnings
# 4. Wait 24h (or set ripeness_at backwards in DB) → next cron tick
#    pays it; row appears in payout history
# 5. Refund the same booking via admin → OffsetBanner appears, next-
#    cycle estimate drops by the offset
```

## Out of scope

- Email notifications on payout / offset changes (in-app only for now)
- Mobile-specific layout (existing portal layout is responsive; rely on
  inherited media queries)
- Date-range filtering on payout history (just list newest 20 with
  pagination — Task 07 admin gets the heavy filtering)
- Currency formatting for non-USD (US/USD only this sprint)
- "Disputed" status flow (admin-only state; affiliates cannot dispute
  via the affiliate UI in this sprint)
- Help article content for the offset banner — link points to an
  empty stub or omit the link until content is written
