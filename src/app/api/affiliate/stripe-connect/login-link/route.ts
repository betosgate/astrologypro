import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/affiliate/stripe-connect/login-link
 * Creates a one-time Stripe Express dashboard login link for the current
 * affiliate so they can manage their connected account, view tax docs,
 * and update bank details.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/06-affiliate-ui.md
 */
export async function POST() {
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
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripeAccountId =
    ((affiliate as Record<string, unknown> | null)?.stripe_account_id as
      | string
      | null) ?? null;
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: "No Stripe account connected" },
      { status: 404 },
    );
  }

  try {
    const link = await stripe.accounts.createLoginLink(stripeAccountId);
    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create login link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
