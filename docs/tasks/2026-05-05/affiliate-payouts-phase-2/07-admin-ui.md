# Task 07 — Admin UI: Payouts List, Manual Override, Dispute Resolution

- Status: Not Started
- Priority: P1
- Depends on: 01, 04
- Blocks: 08

## Goal

Give admins the operational surface to:

1. **See every payout** across every affiliate, filterable by status,
   affiliate, date range
2. **Review dry-run output** before flipping the kill-switch
3. **Flip the kill-switch** (`platform_settings.affiliate_payouts_enabled`)
   from FALSE to TRUE (or back) without touching the DB directly
4. **Manually trigger a payout** for a specific affiliate (admin
   bypass of cron — useful when an affiliate complains)
5. **Mark a payout disputed** + add notes
6. **Write off an outstanding offset** when an affiliate has churned
   and the offset is permanent platform loss
7. **See per-affiliate balance** with breakdown: ripe / paid /
   offset / next-cycle estimate

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/app/admin/reports/affiliate-payouts/page.tsx` | **Create** — list page |
| 2 | `src/app/admin/reports/affiliate-payouts/[id]/page.tsx` | **Create** — detail page (line items, mark disputed) |
| 3 | `src/app/api/admin/affiliate-payouts/route.ts` | **Create** — GET list + filters |
| 4 | `src/app/api/admin/affiliate-payouts/[id]/route.ts` | **Create** — GET detail |
| 5 | `src/app/api/admin/affiliate-payouts/[id]/dispute/route.ts` | **Create** — POST mark disputed |
| 6 | `src/app/api/admin/affiliate-payouts/trigger/route.ts` | **Create** — POST manual trigger for one affiliate |
| 7 | `src/app/api/admin/affiliate-payouts/kill-switch/route.ts` | **Create** — POST flip the kill-switch |
| 8 | `src/app/api/admin/affiliate-accounts/[id]/offset/write-off/route.ts` | **Create** — POST zero the offset, log the write-off |
| 9 | `src/app/admin/_layout` (or wherever the admin nav lives — verify) | **Modify** — add "Affiliate Payouts" link in finance section |

## Edit 1 — Admin payouts list endpoint

**File:** `src/app/api/admin/affiliate-payouts/route.ts`

Authorization: admin-only via `getAdminUser` from
[src/lib/admin-auth.ts](src/lib/admin-auth.ts). Returns `User | null`
(not Response — caller is responsible for the 401).

Pattern (matches existing [src/app/api/admin/refunds/route.ts:21](src/app/api/admin/refunds/route.ts#L21)):

```ts
const user = await getAdminUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status"); // optional filter
  const affiliateId = url.searchParams.get("affiliate_account_id"); // optional
  const since = url.searchParams.get("since"); // optional ISO timestamp
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const admin = createAdminClient();

  let q = admin
    .from("affiliate_payouts")
    .select(
      `id, affiliate_account_id, stripe_account_id, ripe_total_cents,
       offset_applied_cents, net_transferred_cents, stripe_transfer_id,
       status, failure_reason, blocked_reason, created_at, transferred_at,
       trigger_source, triggered_by, notes,
       affiliate:affiliate_accounts(id, email, name, stripe_payouts_enabled, balance_offset_cents)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);
  if (affiliateId) q = q.eq("affiliate_account_id", affiliateId);
  if (since) q = q.gte("created_at", since);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [], total: count ?? 0, limit, offset });
}
```

## Edit 2 — Manual trigger endpoint

**File:** `src/app/api/admin/affiliate-payouts/trigger/route.ts`

Bypasses the cron's batch limit; calls the same
`executeAffiliatePayouts` helper for one affiliate.

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { executeAffiliatePayouts } from "@/lib/affiliate-payout-execution";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const affiliateAccountId = body?.affiliate_account_id as string | undefined;
  if (!affiliateAccountId) {
    return NextResponse.json({ error: "affiliate_account_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await executeAffiliatePayouts({
    admin,
    onlyAffiliateAccountId: affiliateAccountId,
    triggerSource: "admin_manual",
    triggeredBy: user.id,
    affiliateBatchSize: 1,
  });

  return NextResponse.json(result);
}
```

## Edit 3 — Kill-switch endpoint

**File:** `src/app/api/admin/affiliate-payouts/kill-switch/route.ts`

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const enabled = body?.enabled;
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be boolean" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin
    .from("platform_settings")
    .update({ affiliate_payouts_enabled: enabled });

  // admin_action_log columns verified at
  // supabase/migrations/20260424000010_affiliate_commission_v2_additive.sql:116-128
  // - admin_user_id NOT NULL FK auth.users (use the admin caller's id)
  // - action_kind CHECK extended in Phase 2 Task 01
  // - target_resource_type NOT NULL TEXT
  // - target_resource_id NULLABLE UUID (Phase 1.5 made it nullable)
  // - reason NOT NULL TEXT (5-500 chars)
  // - payload JSONB (Phase 1.5)
  await admin.from("admin_action_log").insert({
    admin_user_id: user.id,
    action_kind: "affiliate_payouts_kill_switch_toggled",
    target_resource_type: "platform_settings",
    target_resource_id: null,
    reason: enabled
      ? "Enabled affiliate payouts (kill-switch ON)"
      : "Disabled affiliate payouts (kill-switch OFF)",
    payload: { affiliate_payouts_enabled: enabled },
  });

  return NextResponse.json({ ok: true, enabled });
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("affiliate_payouts_enabled")
    .limit(1)
    .single();

  return NextResponse.json({ enabled: !!data?.affiliate_payouts_enabled });
}
```

## Edit 4 — Dispute marking

**File:** `src/app/api/admin/affiliate-payouts/[id]/dispute/route.ts`

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const note = (body?.note as string | undefined) ?? "";

  const admin = createAdminClient();
  const { data: payout } = await admin
    .from("affiliate_payouts")
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle();
  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin
    .from("affiliate_payouts")
    .update({ status: "disputed", notes: note })
    .eq("id", params.id);

  // admin_action_log shape — see kill-switch endpoint above for column
  // verification. action_kind CHECK extended in Phase 2 Task 01.
  await admin.from("admin_action_log").insert({
    admin_user_id: user.id,
    action_kind: "affiliate_payout_disputed",
    target_resource_type: "affiliate_payout",
    target_resource_id: params.id,
    reason: (note && note.length >= 5 ? note : "Admin marked payout disputed").slice(0, 500),
    payload: { previous_status: payout.status, note },
  });

  return NextResponse.json({ ok: true });
}
```

> Marking disputed does NOT reverse the Stripe transfer. That's
> intentional — Stripe transfers between platform and connected
> accounts are not reversible from your side without the connected
> account's cooperation. The dispute status flag is purely for
> internal tracking; remediation (if proven correct) goes through
> the offset mechanism on the next cycle (admin manually increments
> the affiliate's `balance_offset_cents` via a separate admin
> action — out of scope for this sprint, deferred to Phase 3 if
> actually needed).

## Edit 5 — Offset write-off

**File:** `src/app/api/admin/affiliate-accounts/[id]/offset/write-off/route.ts`

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const reason = (body?.reason as string | undefined) ?? "";
  if (!reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("id, balance_offset_cents")
    .eq("id", params.id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wrote = Number(account.balance_offset_cents ?? 0);
  if (wrote === 0) {
    return NextResponse.json({ ok: true, wroteOffCents: 0 });
  }

  await admin
    .from("affiliate_accounts")
    .update({
      balance_offset_cents: 0,
      balance_offset_last_changed_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  await admin.from("admin_action_log").insert({
    admin_user_id: user.id,
    action_kind: "affiliate_offset_written_off",
    target_resource_type: "affiliate_account",
    target_resource_id: params.id,
    reason: reason.slice(0, 500), // already validated min length above
    payload: { wrote_off_cents: wrote },
  });

  return NextResponse.json({ ok: true, wroteOffCents: wrote });
}
```

## Edit 6 — Admin UI page (list)

**File:** `src/app/admin/reports/affiliate-payouts/page.tsx`

Server Component. Fetches `/api/admin/affiliate-payouts` with default
filters and renders:

1. **Header** — "Affiliate Payouts" + breadcrumb
2. **Kill-switch banner** — current state + toggle button (calls
   POST `/kill-switch` via Client Component child); large warning
   when flipping FALSE → TRUE for the first time
3. **Filter bar** — status dropdown, affiliate search, date-range
4. **Stats cards** — Total paid this month, Total pending, Total
   blocked, Total dry-run preview
5. **Table** — same columns as affiliate-side `PayoutHistoryTable`
   plus affiliate name + a "Manual trigger" action per row (only on
   `failed` / `blocked` rows)

## Edit 7 — Admin UI page (detail)

**File:** `src/app/admin/reports/affiliate-payouts/[id]/page.tsx`

Server Component. Fetches the payout + line items + the affiliate
account.

Shows:
- Status pill + Stripe Transfer ID (link to Stripe Dashboard) +
  timestamps
- Line items table: conversion → booking → campaign → applied/offset
  amounts
- Notes textarea + "Mark Disputed" button (POST `/dispute`)
- Affiliate's current balance state (offset, ripe, paid totals)
- Action log for this payout (filtered admin_action_log rows)

## Edit 8 — Add nav link

Verify the admin nav structure (likely `src/app/admin/_layout.tsx`
or a sidebar component). Add an "Affiliate Payouts" link under the
Finance section pointing to
`/admin/reports/affiliate-payouts`.

## Stale-offset alert

Surface in the existing admin finance overview (likely
`/admin/reports/finance-ops` per the codebase audit):

A widget showing all `affiliate_accounts` where:
- `balance_offset_cents > 0`
- `balance_offset_last_changed_at < now() - 90 days`

For each, render a row with affiliate name, offset amount, days since
last change, and a "Write off" link to `/admin/reports/affiliate-payouts?affiliate=...`
with a write-off action.

This is the only "alert" mechanism in this sprint — no email, no
push. Admins find it on their existing dashboard.

## Acceptance for this task

- [ ] Admin can navigate to `/admin/reports/affiliate-payouts` and see
      a paginated list of all payouts across all affiliates
- [ ] Filters work: status, affiliate, date-range
- [ ] Kill-switch reads correct current state; toggling it persists
      and writes to admin_action_log
- [ ] Manually triggering a payout for an affiliate runs the same
      `executeAffiliatePayouts` helper as the cron and surfaces the
      result in the UI
- [ ] Marking a payout disputed flips its status to `disputed` and logs
      to admin_action_log; no Stripe call is made
- [ ] Writing off an offset zeros `balance_offset_cents` and logs to
      admin_action_log with the reason
- [ ] Stale-offset widget on `/admin/reports/finance-ops` (or
      equivalent dashboard) shows accounts with offset > 0 unchanged
      for 90+ days
- [ ] All admin endpoints reject non-admin callers with 403
- [ ] Detail page action log shows the relevant `admin_action_log`
      rows in chronological order

## Verification

```bash
# Routes landed
ls src/app/api/admin/affiliate-payouts/route.ts \
   src/app/api/admin/affiliate-payouts/\[id\]/route.ts \
   src/app/api/admin/affiliate-payouts/\[id\]/dispute/route.ts \
   src/app/api/admin/affiliate-payouts/trigger/route.ts \
   src/app/api/admin/affiliate-payouts/kill-switch/route.ts \
   src/app/api/admin/affiliate-accounts/\[id\]/offset/write-off/route.ts

# Pages landed
ls src/app/admin/reports/affiliate-payouts/page.tsx \
   src/app/admin/reports/affiliate-payouts/\[id\]/page.tsx

# Admin nav has the new link
grep -rn "Affiliate Payouts\|affiliate-payouts" src/app/admin/
# Expected: at least 1 hit in nav config

# Auth check (call without admin cookie → 401/403)
curl -X GET https://localhost:3000/api/admin/affiliate-payouts
# Expected: 401 or 403
```

### Manual E2E (post-Stage-1 deploy)

1. Sign in as admin
2. Navigate to `/admin/reports/affiliate-payouts` — verify empty
   state with kill-switch banner showing "Disabled (Dry Run)"
3. Run the cron manually via curl — verify dry_run rows appear
4. Toggle the kill-switch ON — verify warning modal + audit log
5. Run the cron again — verify rows flip to `pending` then
   `completed` once Stripe responds
6. Issue a refund on a paid booking via diviner dashboard — verify
   the linked affiliate's `balance_offset_cents` increased
7. After 90+ days (or manually backdate
   `balance_offset_last_changed_at`), verify the stale-offset widget
   surfaces the row

## Out of scope

- Bulk operations (multi-row select + bulk dispute / retrigger) —
  one row at a time for now
- Export to CSV — defer to a follow-up if needed
- Real-time updates (WebSocket / SSE) — page refresh is fine
- Email notifications to affiliates / admins on dispute / write-off
- Attachment / document upload on dispute notes
- Reversal of a Stripe transfer initiated from this UI — Stripe doesn't
  support that for platform-to-connected transfers without the
  connected account's cooperation; intentionally not implemented
