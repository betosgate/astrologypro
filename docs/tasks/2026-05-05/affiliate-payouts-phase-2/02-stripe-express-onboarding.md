# Task 02 — Stripe Express Onboarding for Affiliates

- Status: Not Started
- Priority: P0
- Depends on: 01
- Blocks: 03, 04, 06, 07

## Goal

Wire the Stripe Express Connect flow for affiliates so they can:

1. Click "Connect Stripe" in the affiliate dashboard
2. Complete Stripe-hosted onboarding (bank, ID, tax forms — Stripe
   handles all of it)
3. Return to the dashboard with `affiliate_accounts.stripe_account_id`
   populated and the `stripe_*_enabled` cache columns refreshed
4. Have the cache stay fresh as Stripe sends `account.updated`
   webhooks

This mirrors the existing diviner Connect flow at
[src/app/api/stripe/connect/onboard/route.ts](src/app/api/stripe/connect/onboard/route.ts)
and [src/lib/stripe/connect.ts](src/lib/stripe/connect.ts) but
operates against `affiliate_accounts` instead of `diviners`. We do
NOT generalize the helper to take both — keep the diviner one
untouched, add a parallel `affiliate-connect.ts` helper. Less risk
of cross-contamination.

## Files to create / modify

| # | File | Action |
|---|---|---|
| 1 | `src/lib/stripe/affiliate-connect.ts` | **Create** — affiliate-side Stripe helpers |
| 2 | `src/app/api/affiliate/stripe-connect/start/route.ts` | **Create** — start onboarding (creates account if needed, returns URL) |
| 3 | `src/app/api/affiliate/stripe-connect/status/route.ts` | **Create** — read current cached status + remote refresh |
| 4 | `src/app/api/stripe/webhooks/route.ts` | **Modify** — handle `account.updated` AND `account.application.deauthorized` for affiliates |
| 5 | `src/lib/affiliate-stripe-sync.ts` | **Create** — small helper to refresh cache columns from Stripe |
| 6 | `src/lib/affiliate-country-precheck.ts` | **Create** — pre-validate before calling Stripe so non-US affiliates get a friendly message instead of a Stripe error |

## Edit 1 — Create `src/lib/stripe/affiliate-connect.ts`

```ts
import { stripe } from "./client";

interface CreateAffiliateConnectAccountParams {
  email: string;
  affiliateAccountId: string;
}

/**
 * Create a Stripe Express account for an affiliate. Currently US/USD only
 * (per Phase 2 master decision §7). Capabilities request `transfers` —
 * affiliates do NOT charge cards through their own account; the platform
 * sends them money via stripe.transfers.create.
 */
export async function createAffiliateConnectAccount({
  email,
  affiliateAccountId,
}: CreateAffiliateConnectAccountParams) {
  return stripe.accounts.create({
    type: "express",
    email,
    country: "US",
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      affiliateAccountId,
      role: "affiliate",
    },
  });
}

interface CreateAffiliateOnboardingLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}

export async function createAffiliateOnboardingLink({
  accountId,
  refreshUrl,
  returnUrl,
}: CreateAffiliateOnboardingLinkParams) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function getAffiliateConnectStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirementsCurrentlyDue: account.requirements?.currently_due ?? [],
    requirementsPastDue: account.requirements?.past_due ?? [],
    disabledReason: account.requirements?.disabled_reason ?? null,
  };
}
```

**Why a separate helper instead of generalizing the diviner one:**
diviners need `card_payments` capability (they receive customer
charges via destination charges); affiliates only need `transfers`
(they receive platform-funded transfers). Different capability
requests + different metadata → cleaner to keep separate. The
diviner flow stays byte-for-byte unchanged.

## Edit 2 — Create `src/app/api/affiliate/stripe-connect/start/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAffiliateConnectAccount,
  createAffiliateOnboardingLink,
} from "@/lib/stripe/affiliate-connect";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/stripe-connect/start
 * Called from the affiliate dashboard's "Connect Stripe" CTA.
 *
 * Behavior:
 *   - If the affiliate already has a stripe_account_id, creates a fresh
 *     account link (resume / re-onboard).
 *   - If not, creates a new Express account first, persists the ID,
 *     then creates the link.
 *
 * Returns: { url: string } — the affiliate is redirected to this URL.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: affiliate, error: affErr } = await admin
      .from("affiliate_accounts")
      .select("id, email, stripe_account_id, prior_stripe_account_ids, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (affErr || !affiliate) {
      return NextResponse.json(
        { error: "Affiliate account not found" },
        { status: 404 },
      );
    }

    if (affiliate.status === "blocked") {
      return NextResponse.json(
        { error: "Affiliate account is blocked. Contact support." },
        { status: 403 },
      );
    }

    // Country pre-check — friendly message before calling Stripe.
    // Currently US-only (00-master decision §7). If the affiliate's
    // declared country is non-US, surface a useful error.
    const { checkAffiliateCountryEligible } = await import(
      "@/lib/affiliate-country-precheck"
    );
    const eligibility = await checkAffiliateCountryEligible({
      admin,
      affiliateAccountId: affiliate.id as string,
      userEmail: affiliate.email as string,
    });
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.message,
          countryCode: eligibility.detectedCountryCode ?? null,
          supportedCountries: ["US"],
        },
        { status: 422 },
      );
    }

    let accountId = affiliate.stripe_account_id as string | null;

    if (!accountId) {
      const account = await createAffiliateConnectAccount({
        email: affiliate.email as string,
        affiliateAccountId: affiliate.id as string,
      });
      accountId = account.id;

      await admin
        .from("affiliate_accounts")
        .update({
          stripe_account_id: accountId,
          stripe_account_synced_at: new Date().toISOString(),
        })
        .eq("id", affiliate.id);
    }

    const accountLink = await createAffiliateOnboardingLink({
      accountId,
      refreshUrl: `${APP_URL}/affiliate/dashboard?stripe=refresh`,
      returnUrl: `${APP_URL}/affiliate/dashboard?stripe=complete`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("[affiliate/stripe-connect/start] error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Stripe onboarding link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## Edit 3 — Create `src/app/api/affiliate/stripe-connect/status/route.ts`

Returns the cached status, then fires a fresh remote read in the
background (non-blocking) so subsequent reads are accurate.

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAffiliateStripeStatus } from "@/lib/affiliate-stripe-sync";

export const dynamic = "force-dynamic";

/**
 * GET /api/affiliate/stripe-connect/status
 * Returns the cached Stripe status from affiliate_accounts.
 *
 * If the cache is older than 60 seconds AND a stripe_account_id is set,
 * triggers a synchronous remote refresh before responding so the UI
 * never displays stale state on first load post-onboarding return.
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
    .select(
      "id, stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted, stripe_account_synced_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ connected: false });
  }

  // Refresh on first load OR after a stale window of 60s
  const STALE_MS = 60_000;
  const lastSync = affiliate.stripe_account_synced_at
    ? new Date(affiliate.stripe_account_synced_at as string).getTime()
    : 0;
  const ageMs = Date.now() - lastSync;

  if (affiliate.stripe_account_id && ageMs > STALE_MS) {
    try {
      await syncAffiliateStripeStatus({
        admin,
        affiliateAccountId: affiliate.id as string,
      });
    } catch (err) {
      console.error("[affiliate/stripe-connect/status] sync error:", err);
      // Fall through and return cached state.
    }
  }

  // Re-read after potential sync
  const { data: fresh } = await admin
    .from("affiliate_accounts")
    .select(
      "stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted, stripe_account_synced_at",
    )
    .eq("id", affiliate.id)
    .maybeSingle();

  return NextResponse.json({
    connected: !!fresh?.stripe_account_id,
    stripeAccountId: fresh?.stripe_account_id ?? null,
    payoutsEnabled: !!fresh?.stripe_payouts_enabled,
    chargesEnabled: !!fresh?.stripe_charges_enabled,
    detailsSubmitted: !!fresh?.stripe_details_submitted,
    syncedAt: fresh?.stripe_account_synced_at ?? null,
  });
}
```

## Edit 4 — Create `src/lib/affiliate-stripe-sync.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAffiliateConnectStatus } from "@/lib/stripe/affiliate-connect";

/**
 * Refresh affiliate_accounts.stripe_*_enabled cache columns from Stripe.
 *
 * Idempotent. Safe to call from webhook + status endpoint + admin tools.
 * Throws on the underlying Stripe call; caller decides whether to retry.
 */
export async function syncAffiliateStripeStatus(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  /** When set, bypass the row read (for webhook callers who already have the ID) */
  knownStripeAccountId?: string;
}): Promise<{ payoutsEnabled: boolean; chargesEnabled: boolean }> {
  const { admin, affiliateAccountId, knownStripeAccountId } = input;

  let stripeAccountId = knownStripeAccountId ?? null;
  if (!stripeAccountId) {
    const { data: row } = await admin
      .from("affiliate_accounts")
      .select("stripe_account_id")
      .eq("id", affiliateAccountId)
      .maybeSingle();
    stripeAccountId = (row?.stripe_account_id as string | null) ?? null;
  }

  if (!stripeAccountId) {
    throw new Error("affiliate has no stripe_account_id");
  }

  const status = await getAffiliateConnectStatus(stripeAccountId);

  await admin
    .from("affiliate_accounts")
    .update({
      stripe_payouts_enabled: status.payoutsEnabled,
      stripe_charges_enabled: status.chargesEnabled,
      stripe_details_submitted: status.detailsSubmitted,
      stripe_account_synced_at: new Date().toISOString(),
    })
    .eq("id", affiliateAccountId);

  return {
    payoutsEnabled: status.payoutsEnabled,
    chargesEnabled: status.chargesEnabled,
  };
}
```

## Edit 4b — Create `src/lib/affiliate-country-precheck.ts`

```ts
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPPORTED_COUNTRIES = new Set(["US"]);

export type CountryEligibilityResult =
  | { eligible: true; detectedCountryCode: "US" }
  | {
      eligible: false;
      message: string;
      detectedCountryCode: string | null;
    };

/**
 * Pre-validate an affiliate's country before calling Stripe. If they're
 * outside the supported list, surface a friendly message rather than a
 * Stripe error.
 *
 * Detection priority:
 *   1. affiliate_accounts.payout_details.country (if present — JSONB)
 *   2. affiliate_accounts.timezone heuristic (Intl-derived; "US" if America/*)
 *   3. Default to "US" — onboarding will fail at Stripe with clear errors if wrong
 */
export async function checkAffiliateCountryEligible(input: {
  admin: SupabaseClient;
  affiliateAccountId: string;
  userEmail: string;
}): Promise<CountryEligibilityResult> {
  const { admin, affiliateAccountId } = input;

  const { data: affiliate } = await admin
    .from("affiliate_accounts")
    .select("payout_details, timezone")
    .eq("id", affiliateAccountId)
    .maybeSingle();

  let detected: string | null = null;
  const payoutDetails = (affiliate?.payout_details as { country?: string } | null) ?? null;
  if (payoutDetails?.country) {
    detected = payoutDetails.country.toUpperCase().slice(0, 2);
  } else if (affiliate?.timezone) {
    const tz = String(affiliate.timezone);
    if (tz.startsWith("America/")) detected = "US";
  }

  if (!detected) {
    // Couldn't detect — proceed to Stripe (Stripe's own error messaging
    // will catch it). Don't block on a heuristic miss.
    return { eligible: true, detectedCountryCode: "US" };
  }

  if (SUPPORTED_COUNTRIES.has(detected)) {
    return { eligible: true, detectedCountryCode: "US" };
  }

  return {
    eligible: false,
    detectedCountryCode: detected,
    message:
      `Affiliate payouts are currently US-only. Your account is registered in ${detected}; we'll notify you when international support launches.`,
  };
}
```

## Edit 5 — Wire `account.updated` AND `account.application.deauthorized` webhooks

### Verified webhook structure (audited 2026-05-05)

- Webhook handler GET starts at top of file
- `switch (event.type)` at **line 2396**
- `case "account.updated"` already exists at **line 2482**, calls
  `handleAccountUpdated(event.data.object as Stripe.Account)`
- `handleAccountUpdated` is a separate named function at **line 1789**
- It currently updates the `diviners` table only — does NOT branch on
  `account.metadata.role`
- No `account.application.deauthorized` case exists yet

### The cleaner edit shape

Don't fork the switch case. Extend `handleAccountUpdated` itself to
dispatch based on `account.metadata?.role`. This keeps the switch
flat and matches the existing pattern.

**File:** `src/app/api/stripe/webhooks/route.ts`

Stripe sends `account.updated` whenever a connected account's
verification state changes. We use the `metadata.role === "affiliate"`
tag we set in `createAffiliateConnectAccount` to distinguish from
diviner accounts (which lack that metadata or carry `role !== "affiliate"`).

### Edit 5a — Extend `handleAccountUpdated` (line 1789)

Replace the existing 14-line function body with a role-dispatching
version:

```ts
async function handleAccountUpdated(account: Stripe.Account) {
  const role = account.metadata?.role ?? null;

  if (role === "affiliate") {
    const affiliateAccountId = account.metadata?.affiliateAccountId;
    if (!affiliateAccountId) {
      console.warn(
        "[webhook] account.updated for affiliate without affiliateAccountId metadata",
        account.id,
      );
      return;
    }
    const admin = createAdminClient();
    try {
      await syncAffiliateStripeStatus({
        admin,
        affiliateAccountId,
        knownStripeAccountId: account.id,
      });
    } catch (err) {
      console.error("[webhook] affiliate stripe status sync failed", {
        affiliateAccountId,
        stripeAccountId: account.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // Existing diviner behavior — unchanged from current line-1792 logic.
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("diviners")
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("Failed to update Connect account status:", error);
  }
}
```

This preserves the existing diviner update verbatim — just gates it
behind a non-affiliate role check first.

### Edit 5b — Add `account.application.deauthorized` case to the switch

Add a NEW case to the `switch (event.type)` block at **line 2396**.
Insert between the existing `case "account.updated":` (line 2482-2484)
and the `default:` (line 2485):

```ts
case "account.application.deauthorized":
  await handleAccountDeauthorized(event);
  break;
```

Then add the `handleAccountDeauthorized` function near
`handleAccountUpdated` (e.g., right after line 1803):

```ts
async function handleAccountDeauthorized(event: Stripe.Event) {
  // Stripe sends `event.account` (the connected account ID) on this event.
  // metadata.role isn't reliably present — match by stripe_account_id directly.
  const stripeAccountId = event.account ?? null;
  if (!stripeAccountId) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("affiliate_accounts")
    .select("id, stripe_account_id, prior_stripe_account_ids")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();

  if (!row) {
    // Could be a diviner deauthorization. Don't error; existing diviner flow
    // either has its own deauth handling or doesn't (out of Phase 2 scope).
    return;
  }

  // Append the now-deauthorized account to prior_stripe_account_ids and
  // null out the active one. Affiliate must re-onboard before any future
  // payout can fire.
  const prior = Array.isArray(row.prior_stripe_account_ids)
    ? (row.prior_stripe_account_ids as string[])
    : [];
  await admin
    .from("affiliate_accounts")
    .update({
      stripe_account_id: null,
      stripe_payouts_enabled: false,
      stripe_charges_enabled: false,
      stripe_details_submitted: false,
      stripe_account_synced_at: new Date().toISOString(),
      prior_stripe_account_ids: [
        ...prior,
        { account_id: stripeAccountId, deauthorized_at: new Date().toISOString() },
      ],
    })
    .eq("id", row.id);

  // Fire affiliate.stripe_disconnected notification (Task 09 adds the kind)
  try {
    const { notifyAffiliateStripeDisconnected } = await import(
      "@/lib/affiliate-notifications"
    );
    await notifyAffiliateStripeDisconnected({ admin, affiliateAccountId: row.id as string });
  } catch (err) {
    console.error("[webhook] notify deauthorized failed", err);
  }
}
```

Also add the import near the existing webhook imports:

```ts
import { syncAffiliateStripeStatus } from "@/lib/affiliate-stripe-sync";
```

## Behavior matrix

| Affiliate state | `stripe_account_id` | `payouts_enabled` cache | UI shows |
|---|---|---|---|
| Never connected | NULL | FALSE | "Connect Stripe" CTA |
| Started onboarding, didn't finish | "acct_X" | FALSE | "Resume Stripe onboarding" CTA + list of `requirementsCurrentlyDue` |
| Onboarded, payouts disabled (e.g. tax form pending) | "acct_X" | FALSE | "Verification pending" + list of `requirementsCurrentlyDue` |
| Fully connected, ready | "acct_X" | TRUE | green check + "Connected" + last 4 of bank |

## Acceptance for this task

- [ ] `src/lib/stripe/affiliate-connect.ts` exports the three functions
- [ ] POST `/api/affiliate/stripe-connect/start` returns a URL on first
      call AND on repeat calls (resume / re-onboard scenario)
- [ ] GET `/api/affiliate/stripe-connect/status` returns cached values
      that match what's in `affiliate_accounts` after a sync
- [ ] After completing Stripe onboarding in test mode, the affiliate's
      `stripe_payouts_enabled` flips to TRUE within 5 seconds of returning
      to the dashboard (the GET status endpoint triggers the sync)
- [ ] `account.updated` webhook from Stripe (replayed via the Stripe CLI
      `stripe trigger account.updated --connect-account acct_X`) flips
      the cache columns without a UI refresh
- [ ] Diviner Stripe Connect flow is **byte-for-byte unchanged** (no
      regression in `/api/stripe/connect/onboard`)
- [ ] Non-US country pre-check fires before the Stripe call: e.g. an
      affiliate with `payout_details.country = "GB"` clicks Connect
      and gets a 422 with the friendly "US-only" message; no Stripe
      account is created
- [ ] `account.application.deauthorized` webhook (replayed via
      `stripe trigger account.application.deauthorized --connect-account acct_X`)
      nulls out `stripe_account_id`, sets the cache flags FALSE, and
      appends the deauthorized account to `prior_stripe_account_ids`
- [ ] After deauthorization, the affiliate dashboard shows the
      Connect CTA again (re-onboarding allowed)

## Verification

```bash
# Files landed
ls src/app/api/affiliate/stripe-connect/start/route.ts \
   src/app/api/affiliate/stripe-connect/status/route.ts \
   src/lib/stripe/affiliate-connect.ts \
   src/lib/affiliate-stripe-sync.ts

# Webhook handler updated
grep -n "role === \"affiliate\"\|role === 'affiliate'" src/app/api/stripe/webhooks/route.ts
# Expected: 1 hit in the account.updated branch

# Diviner flow untouched
git diff src/app/api/stripe/connect/onboard/route.ts src/lib/stripe/connect.ts
# Expected: no diff
```

### Manual test (Stripe test mode)

1. Sign in as a test affiliate
2. Hit POST `/api/affiliate/stripe-connect/start`, follow the URL
3. Complete onboarding with Stripe's test data
   (https://stripe.com/docs/connect/testing)
4. Return to `/affiliate/dashboard?stripe=complete`
5. Verify in the DB: `SELECT stripe_account_id, stripe_payouts_enabled
   FROM affiliate_accounts WHERE user_id = '...'`
6. Use the Stripe CLI to replay an account.updated webhook and verify
   the cache stays in sync

## Out of scope

- International (non-US) onboarding — `country: "US"` hardcoded
- Connect Standard (full account) onboarding — Express only
- Tax form chasing — Stripe Express handles 1099-NEC; we surface
  `requirementsCurrentlyDue` in the UI but do not push affiliates
- Migration of legacy diviner-affiliates who already have a Stripe
  account through the diviner flow — they need to onboard separately
  for affiliate (different metadata, different capabilities); admin
  CLI for this is a follow-up if it actually comes up
- Account deletion / disconnection — Phase 3 if affiliates ever
  request it; today nothing in the UI lets them disconnect
