import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDivinerBillingPortalSession } from "@/lib/stripe-saas";

export const dynamic = "force-dynamic";

// ─── POST /api/dashboard/billing/portal ──────────────────────────────────────

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "Authentication required.",
      },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/401",
        title: "Unauthorized",
        status: 401,
        detail: "No diviner record found.",
      },
      { status: 401 }
    );
  }

  if (!diviner.stripe_customer_id) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "No billing account",
        status: 422,
        detail: "Subscribe to a plan first.",
      },
      { status: 422 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";
  const returnUrl = `${appUrl}/dashboard/billing`;

  try {
    const url = await createDivinerBillingPortalSession(
      diviner.stripe_customer_id,
      returnUrl
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing/portal] Stripe error:", err);
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Portal session failed",
        status: 500,
        detail: "Unable to create Stripe billing portal session.",
      },
      { status: 500 }
    );
  }
}
