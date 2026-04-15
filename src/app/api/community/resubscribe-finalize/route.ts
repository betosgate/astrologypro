import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/resubscribe-finalize
 *
 * Called by the resubscribe success page after Stripe redirects back.
 * Verifies the checkout session is complete and paid, then updates
 * community_members.membership_status to 'active'.
 *
 * This mirrors the Mystery School finalize pattern — no webhook dependency.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { status: "unauthorized", message: "Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const sessionId = typeof body?.session_id === "string" ? body.session_id : "";

    if (!sessionId) {
      return NextResponse.json(
        { status: "failed", message: "Missing Stripe Checkout session." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // Verify session belongs to this user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { status: "failed", message: "This checkout session does not belong to the current user." },
        { status: 403 }
      );
    }

    if (session.status !== "complete") {
      return NextResponse.json(
        { status: "pending", message: "Your checkout is still processing. Please wait a moment." },
        { status: 202 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { status: "failed", message: "Stripe did not mark this checkout as paid." },
        { status: 422 }
      );
    }

    // Extract subscription ID
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as { id?: string })?.id ?? null;

    // Update community_members to active
    const admin = createAdminClient();
    const { error: updateErr } = await admin
      .from("community_members")
      .update({
        membership_status: "active",
        stripe_subscription_id: subscriptionId,
      })
      .eq("user_id", user.id)
      .eq("membership_type", "perennial_mandalism");

    if (updateErr) {
      console.error("[resubscribe-finalize] DB update error:", updateErr);
      return NextResponse.json(
        { status: "failed", message: "Could not activate your membership." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      redirectTo: "/community",
    });
  } catch (error) {
    console.error("[resubscribe-finalize]", error);
    return NextResponse.json(
      { status: "failed", message: "Could not finalize your resubscription. Please try again." },
      { status: 500 }
    );
  }
}
