import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/stripe/account — returns connected Stripe account info
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const account = await stripe.accounts.retrieve();
    const keyPrefix = (process.env.STRIPE_SECRET_KEY ?? "").slice(0, 12) + "...";

    return NextResponse.json({
      account: {
        id: account.id,
        business_name: account.settings?.dashboard?.display_name ?? account.business_profile?.name ?? null,
        email: account.email,
        country: account.country,
        default_currency: account.default_currency?.toUpperCase() ?? null,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        livemode: !keyPrefix.includes("test"),
        key_prefix: keyPrefix,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch Stripe account" },
      { status: 500 },
    );
  }
}
