import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Stripe Checkout success redirect for gift certificates.
 *
 * Stripe redirects here after a successful gift payment with the session ID.
 * We look up the gift cert that the webhook created using that session ID
 * and redirect to the gift certificate display page.
 *
 * The webhook may fire slightly before or after Stripe redirects here,
 * so we poll for up to ~8 seconds before falling back.
 */
export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://astrologypro.com";

  if (!sessionId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const admin = createAdminClient();

  // Poll for the cert — webhook usually fires within 1-3 seconds
  let code: string | null = null;
  for (let i = 0; i < 8; i++) {
    const { data, error } = await admin
      .from("gift_certificates")
      .select("code")
      .eq("stripe_payment_intent_id", sessionId)
      .maybeSingle();

    if (error) {
      console.error("[gift/confirm] query error", error);
      return NextResponse.json(
        { type: "about:blank", title: "Internal Server Error", status: 500, detail: "Failed to look up gift certificate." },
        { status: 500, headers: { "Content-Type": "application/problem+json" } }
      );
    }

    if (data?.code) {
      code = data.code;
      break;
    }
    // Wait 1 second then retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (code) {
    return NextResponse.redirect(new URL(`/gift/${code}`, appUrl));
  }

  // Webhook hasn't fired yet — redirect to a generic success page
  return NextResponse.redirect(
    new URL(`/gift/pending?session=${sessionId}`, appUrl)
  );
}
