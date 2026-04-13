import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createConnectAccount,
  createConnectOnboardingLink,
} from "@/lib/stripe/connect";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/connect/onboard
 * Called from the diviner's Settings → Payments page.
 * - If the diviner already has a stripe_account_id, creates a fresh account link.
 * - If not, creates a new Express Connect account first, saves it, then creates the link.
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

    const { data: diviner } = await admin
      .from("diviners")
      .select("id, stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    let accountId = diviner.stripe_account_id as string | null;

    if (!accountId) {
      // Create a new Express Connect account
      const account = await createConnectAccount({
        email: user.email ?? "",
        divinerId: diviner.id,
      });
      accountId = account.id;

      // Persist the account ID immediately
      await admin
        .from("diviners")
        .update({ stripe_account_id: accountId })
        .eq("id", diviner.id);
    }

    const accountLink = await createConnectOnboardingLink({
      accountId,
      refreshUrl: `${APP_URL}/dashboard/settings?tab=payments&stripe=refresh`,
      returnUrl: `${APP_URL}/dashboard/settings?tab=payments&stripe=complete`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("[stripe/connect/onboard] error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create Stripe onboarding link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
