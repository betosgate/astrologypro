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
 *   - If the country pre-check rejects (non-US), responds 422 and logs
 *     to affiliate_onboarding_rejections (Phase 3 instrumentation).
 *
 * Returns: { url: string } — the affiliate is redirected to this URL.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/02-stripe-express-onboarding.md
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

    if ((affiliate as Record<string, unknown>).status === "blocked") {
      return NextResponse.json(
        { error: "Affiliate account is blocked. Contact support." },
        { status: 403 },
      );
    }

    // Country pre-check — friendly message before calling Stripe.
    const { checkAffiliateCountryEligible } = await import(
      "@/lib/affiliate-country-precheck"
    );
    const eligibility = await checkAffiliateCountryEligible({
      admin,
      affiliateAccountId: (affiliate as { id: string }).id,
      userEmail: (affiliate as { email: string }).email,
    });
    if (eligibility.eligible !== true) {
      const rej = eligibility;
      // Phase 3 prep: log the rejection for international-demand analytics.
      try {
        await admin.from("affiliate_onboarding_rejections").insert({
          affiliate_account_id: (affiliate as { id: string }).id,
          email: (affiliate as { email: string }).email,
          detected_country_code: rej.detectedCountryCode,
          reason: rej.message,
        });
      } catch (err) {
        console.error("[stripe-connect/start] rejection log failed", err);
      }

      return NextResponse.json(
        {
          error: rej.message,
          countryCode: rej.detectedCountryCode ?? null,
          supportedCountries: ["US"],
        },
        { status: 422 },
      );
    }

    let accountId =
      ((affiliate as Record<string, unknown>).stripe_account_id as string | null) ?? null;

    if (!accountId) {
      const account = await createAffiliateConnectAccount({
        email: (affiliate as { email: string }).email,
        affiliateAccountId: (affiliate as { id: string }).id,
      });
      accountId = account.id;

      await admin
        .from("affiliate_accounts")
        .update({
          stripe_account_id: accountId,
          stripe_account_synced_at: new Date().toISOString(),
        })
        .eq("id", (affiliate as { id: string }).id);
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
