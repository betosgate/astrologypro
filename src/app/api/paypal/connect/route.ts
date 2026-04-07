import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/paypal/connect
 * Initiates PayPal Partner Referrals onboarding for the authenticated diviner.
 * Redirects to PayPal's hosted signup page.
 *
 * Required env vars:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_PARTNER_ID      (facilitator merchant ID / BN code partner)
 *   NEXT_PUBLIC_APP_URL
 *
 * PayPal environment is controlled by PAYPAL_ENV=sandbox|live (default: sandbox)
 */

const PAYPAL_ENV = process.env.PAYPAL_ENV ?? "sandbox";
const PAYPAL_BASE =
  PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const partnerId = process.env.PAYPAL_PARTNER_ID;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) {
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || !partnerId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?paypal=error&reason=not_configured", appUrl)
    );
  }

  try {
    const accessToken = await getPayPalAccessToken();

    // Create a Partner Referral so PayPal gives us a signup URL
    const referralBody = {
      tracking_id: diviner.id,
      partner_config_override: {
        return_url: `${appUrl}/api/paypal/callback?diviner_id=${diviner.id}`,
        return_url_description: "Return to AstrologyPro settings",
      },
      operations: [
        {
          operation: "API_INTEGRATION",
          api_integration_preference: {
            rest_api_integration: {
              integration_method: "PAYPAL",
              integration_type: "THIRD_PARTY",
              third_party_details: {
                features: ["PAYMENT", "REFUND"],
              },
            },
          },
        },
      ],
      products: ["EXPRESS_CHECKOUT"],
      legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
    };

    const referralRes = await fetch(
      `${PAYPAL_BASE}/v2/customer/partner-referrals`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Partner-Attribution-Id": partnerId,
        },
        body: JSON.stringify(referralBody),
      }
    );

    if (!referralRes.ok) {
      const errText = await referralRes.text();
      console.error("[PayPal Connect] Partner referral error:", errText);
      return NextResponse.redirect(
        new URL("/dashboard/settings?paypal=error&reason=referral_failed", appUrl)
      );
    }

    const referralData = await referralRes.json();
    const actionUrl = (referralData.links as Array<{ rel: string; href: string }>)?.find(
      (l) => l.rel === "action_url"
    )?.href;

    if (!actionUrl) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?paypal=error&reason=no_action_url", appUrl)
      );
    }

    return NextResponse.redirect(actionUrl);
  } catch (err) {
    console.error("[PayPal Connect]", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?paypal=error&reason=server_error", appUrl)
    );
  }
}
