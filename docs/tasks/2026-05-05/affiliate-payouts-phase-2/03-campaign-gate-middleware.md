# Task 03 — Campaign Creation & Share Link Gate

- Status: Not Started
- Priority: P0
- Depends on: 01, 02
- Blocks: 04 (sign-off), 06

## Goal

Block any **new** campaign creation or **new** share-link generation
by an affiliate that does not have:

- `affiliate_accounts.stripe_account_id IS NOT NULL`, AND
- `affiliate_accounts.stripe_payouts_enabled = TRUE`

**Grandfathering:** existing campaigns + existing share links keep
working. Conversions accrue. Only the act of *creating new ones* is
gated. This is the user's explicit decision (00-master §3) — don't
break the 14 active affiliates overnight.

## Files to modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/affiliate-payout-readiness.ts` | **Create** — single helper called from every gate |
| 2 | `src/app/api/affiliate/general-campaigns/route.ts` | Gate `POST` (general-campaign creation) at line ~140 (above the insert) |
| 3 | `src/app/api/affiliate/assignments/[id]/campaigns/route.ts` | Gate `POST` (per-assignment campaign creation) at line ~150 (above the insert) |
| 4 | `src/app/api/affiliate/campaigns/[id]/share-link/route.ts` (verify path; may live elsewhere) | Gate `POST` (regenerating / first-generating share link) — only if regen is a feature |

Search for additional `POST` endpoints under `/api/affiliate/` that
create or modify campaign-shaped state — same gate everywhere.

## Edit 1 — Create the readiness helper

**File:** `src/lib/affiliate-payout-readiness.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type ReadinessResult =
  | { ready: true; affiliateAccountId: string }
  | {
      ready: false;
      reason:
        | "not_affiliate"
        | "blocked"
        | "no_stripe_account"
        | "stripe_payouts_disabled";
      message: string;
      cta: "connect" | "resume" | "verify" | "contact_support";
    };

/**
 * Single source of truth for "is this affiliate allowed to create new
 * campaigns / share links?". Every gate calls this — keeps the rule
 * in one place. Grandfathering happens at the call site (don't call
 * this when reading existing campaigns).
 *
 * The `cta` field tells the UI which button to surface.
 */
export async function checkAffiliatePayoutReadiness(input: {
  admin: SupabaseClient;
  userId: string;
}): Promise<ReadinessResult> {
  const { admin, userId } = input;

  const { data: affiliate, error } = await admin
    .from("affiliate_accounts")
    .select(
      "id, status, stripe_account_id, stripe_payouts_enabled, stripe_details_submitted",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !affiliate) {
    return {
      ready: false,
      reason: "not_affiliate",
      message: "You must be an affiliate to do this.",
      cta: "contact_support",
    };
  }

  if (affiliate.status === "blocked") {
    return {
      ready: false,
      reason: "blocked",
      message: "Your affiliate account is blocked. Contact support.",
      cta: "contact_support",
    };
  }

  if (!affiliate.stripe_account_id) {
    return {
      ready: false,
      reason: "no_stripe_account",
      message:
        "Connect a Stripe account before creating new campaigns or share links. Existing campaigns continue to work.",
      cta: "connect",
    };
  }

  if (!affiliate.stripe_payouts_enabled) {
    return {
      ready: false,
      reason: "stripe_payouts_disabled",
      message: affiliate.stripe_details_submitted
        ? "Stripe verification is pending. We'll enable new campaigns the moment Stripe approves your account."
        : "Finish Stripe onboarding to enable new campaigns and share links.",
      cta: affiliate.stripe_details_submitted ? "verify" : "resume",
    };
  }

  return {
    ready: true,
    affiliateAccountId: affiliate.id as string,
  };
}
```

## Edit 2 — Gate POST `/api/affiliate/general-campaigns/route.ts`

### Verified anchor (line numbers as of audit)

POST starts at line 49. Auth → ctx resolution at lines 50-58. Rate limit
starts at line 62. Insert the readiness check **between line 58 and
line 62** (after `ctx` is resolved, before rate limit consumes budget):

```ts
// (existing) line 58:  if (!ctx) return problem(403, "Not an active affiliate");
// INSERT below this line:

const readiness = await checkAffiliatePayoutReadiness({ admin, userId: user.id });
if (!readiness.ready) {
  return problem(403, readiness.message, undefined, {
    code: "affiliate_payout_not_ready",
    reason: readiness.reason,
    cta: readiness.cta,
  });
}

// (existing) line 62:  const rl = await rateLimit(...
```

### Why this `problem()` signature works

The local `problem()` helper at the top of this file (verified in audit
at line 23) has the signature:

```ts
function problem(
  status: number,
  title: string,
  detail?: string,
  extras?: Record<string, unknown>,
)
```

So a 4-arg call with `extras` containing `{ code, reason, cta }` is
supported and merges into the response body. Same pattern this file
already uses at line 87-93 for validation errors.

Add the import at the top:

```ts
import { checkAffiliatePayoutReadiness } from "@/lib/affiliate-payout-readiness";
```

### After-edit verification

```bash
grep -n "checkAffiliatePayoutReadiness" src/app/api/affiliate/general-campaigns/route.ts
# Expected: 2 hits — import + call
```

## Edit 3 — Gate POST `/api/affiliate/assignments/[id]/campaigns/route.ts`

### Verified anchor + helper-signature gotcha

POST starts at line 47. Auth → ctx resolution at lines 53-61. Rate
limit starts at line 66. Insert the readiness check **between line
61 and line 66**:

```ts
// (existing) line 61:  if (!ctx) return problem(403, "Not an active affiliate");
// INSERT below this line:

const readiness = await checkAffiliatePayoutReadiness({ admin, userId: user.id });
if (!readiness.ready) {
  return problem(403, readiness.message, JSON.stringify({
    code: "affiliate_payout_not_ready",
    reason: readiness.reason,
    cta: readiness.cta,
  }));
}

// (existing) line 66:  const rl = await rateLimit(...
```

### Why a different shape than Edit 2

The local `problem()` helper in this file (verified at line 27) has a
**3-arg signature** — no `extras` param:

```ts
function problem(status: number, title: string, detail?: string)
```

Two options for handling this. Pick ONE consistently:

**Option A (recommended, less invasive):** widen the local `problem()`
helper to match the 4-arg signature used by `general-campaigns/route.ts`:

```ts
function problem(
  status: number,
  title: string,
  detail?: string,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      type: `https://httpstatuses.io/${status}`,
      title,
      status,
      ...(detail ? { detail } : {}),
      ...(extras ?? {}),
    },
    { status },
  );
}
```

Then the call shape matches Edit 2:

```ts
return problem(403, readiness.message, undefined, {
  code: "affiliate_payout_not_ready",
  reason: readiness.reason,
  cta: readiness.cta,
});
```

**Option B (zero ripple):** stuff the structured fields into the
`detail` string as JSON, parse on the client. Uglier but local.

Pick A. It aligns the two campaign-create routes.

Add the import at the top:

```ts
import { checkAffiliatePayoutReadiness } from "@/lib/affiliate-payout-readiness";
```

## Edit 4 — Gate share-link generation (verify path first)

```bash
# Find the actual route — name may differ
grep -rn "share_code\|share_link\|share-link" src/app/api/affiliate/ \
  | grep -E "POST|generate|create" | head -10
```

If a share-link generation endpoint exists (where an affiliate
creates a NEW link beyond the campaign default), gate it the same
way. If share-links are only auto-generated at campaign creation
time, this edit is a no-op (the gate on Edits 2 + 3 is sufficient).
Document either way in the PR description.

## What we explicitly do NOT gate

- `GET /api/affiliate/campaigns` — reading existing campaigns
- `GET /api/affiliate/dashboard` — affiliate's home page
- `GET /api/affiliate/reports/*` — earnings / conversions reports
- `POST /api/affiliate/campaigns/[id]/pause` etc. — pause/resume of
  existing campaigns
- The `/r/[code]` redirect — referral clicks from existing share
  links continue to convert (otherwise grandfathering is broken)
- Conversion crediting flow — `creditAffiliateConversion` keeps
  writing rows for grandfathered campaigns; payout (Task 04) only
  pays out conversions for affiliates who later become
  payouts-enabled. Pre-connection conversions accrue and become
  payable on first payout cycle after connection (00-master §8 —
  backlog eligible on connection).

## UI integration (handed to Task 06)

The gate returns a `cta` field with one of:
- `connect` — first-time connect button
- `resume` — affiliate started Stripe onboarding but didn't finish
- `verify` — Stripe is processing verification; show a "pending" pill
- `contact_support` — blocked or non-affiliate

Task 06 renders these in the affiliate dashboard's "Create campaign"
flow. The same readiness helper is also called server-side from the
campaigns list page for the disabled-state rendering of the "Create"
button.

## Acceptance for this task

- [ ] `src/lib/affiliate-payout-readiness.ts` exports
      `checkAffiliatePayoutReadiness` returning the union type above
- [ ] POST `/api/affiliate/general-campaigns` returns 403 + structured
      reason for an affiliate without `stripe_payouts_enabled = TRUE`
- [ ] POST `/api/affiliate/assignments/[id]/campaigns` returns 403 in
      the same case
- [ ] An affiliate with `stripe_payouts_enabled = TRUE` can create a
      campaign normally (200 OK + campaign row)
- [ ] An affiliate with `stripe_account_id IS NULL` gets the `connect`
      cta
- [ ] An affiliate with `stripe_account_id` set but
      `stripe_payouts_enabled = FALSE` AND `stripe_details_submitted = FALSE`
      gets the `resume` cta
- [ ] An affiliate with `stripe_account_id` set + details submitted but
      NOT `stripe_payouts_enabled` gets the `verify` cta
- [ ] An existing campaign created BEFORE Phase 2 ships continues to
      function: `GET` campaigns, conversions credit, share link still
      redirects (grandfathered)

## Verification

```bash
# Helper exported
grep -n "export.*checkAffiliatePayoutReadiness" src/lib/affiliate-payout-readiness.ts

# Helper called from every POST that creates campaigns
grep -rn "checkAffiliatePayoutReadiness" src/app/api/affiliate/
# Expected: at least 4 hits (1 import + 1 call per gated endpoint × 2)

# Manual test via curl (substitute real session cookie):
curl -X POST https://localhost:3000/api/affiliate/general-campaigns \
  -H "Content-Type: application/json" -b "session=..." \
  -d '{"templateId":"...", "rate":{"type":"percent","value":20}}'
# Expected (no Stripe connected): HTTP/1.1 403 + JSON with cta: "connect"

# After connecting Stripe:
curl -X POST ... # same body
# Expected: HTTP/1.1 201 + the new campaign row
```

## Out of scope

- Front-end UI changes (Task 06 owns those — read this doc for the
  contract on the `cta` field)
- Bulk migration of existing affiliates' campaigns (grandfathered;
  no migration needed)
- Auto-disable of existing campaigns when an affiliate fails Stripe
  re-verification later — leave them running; revisit in Phase 3 if
  it becomes an issue
- Email notifications when a gate fires — out of scope; rely on the
  in-UI CTA + readiness state shown on the dashboard
