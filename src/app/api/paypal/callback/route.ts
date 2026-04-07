import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/paypal/callback
 * PayPal redirects here after the seller completes onboarding.
 * PayPal includes merchantId and merchantIdInPayPal as query params.
 */

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const params = request.nextUrl.searchParams;

  const divinerId = params.get("diviner_id");
  // PayPal sends these after onboarding completion
  const merchantIdInPayPal = params.get("merchantIdInPayPal");
  const merchantId = params.get("merchantId");

  if (!divinerId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?paypal=error&reason=missing_diviner", appUrl)
    );
  }

  // If PayPal didn't send a merchant ID the seller may not have finished onboarding
  if (!merchantIdInPayPal && !merchantId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?paypal=error&reason=incomplete", appUrl)
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("diviners")
    .update({
      paypal_merchant_id: merchantIdInPayPal ?? merchantId,
      paypal_onboarded: true,
      paypal_onboarded_at: new Date().toISOString(),
    })
    .eq("id", divinerId);

  if (error) {
    console.error("[PayPal Callback] DB update error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?paypal=error&reason=db_error", appUrl)
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/settings?paypal=connected", appUrl)
  );
}
