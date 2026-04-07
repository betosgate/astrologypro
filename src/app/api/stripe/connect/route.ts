import { NextRequest, NextResponse } from "next/server";
import {
  createConnectAccount,
  createConnectOnboardingLink,
} from "@/lib/stripe/connect";
import { APP_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, divinerId } = await request.json();

    if (!email || !divinerId) {
      return NextResponse.json(
        { error: "Missing email or divinerId" },
        { status: 400 }
      );
    }

    const account = await createConnectAccount({ email, divinerId });

    const accountLink = await createConnectOnboardingLink({
      accountId: account.id,
      refreshUrl: `${APP_URL}/onboarding?step=3`,
      returnUrl: `${APP_URL}/onboarding?step=4&connect_complete=true`,
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Failed to create Connect account" },
      { status: 500 }
    );
  }
}
