import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { finalizeMysterySchoolCheckoutSession } from "@/lib/mystery-school/finalize-checkout";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { status: "unauthorized", message: "Please sign in to finalize your enrollment." },
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

    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { status: "failed", message: "This checkout session does not belong to the current user." },
        { status: 403 }
      );
    }

    if (session.metadata?.membershipType !== "mystery_school" || session.metadata?.type !== "community") {
      return NextResponse.json(
        { status: "failed", message: "This checkout session is not a Mystery School enrollment." },
        { status: 422 }
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

    const result = await finalizeMysterySchoolCheckoutSession(session);

    return NextResponse.json({
      status: "success",
      redirectTo: "/mystery-school?subscribed=true",
      studentId: result.student.id,
    });
  } catch (error) {
    console.error("[mystery-school/checkout/finalize]", error);
    return NextResponse.json(
      {
        status: "failed",
        message: "We could not finalize your Mystery School enrollment yet. Please try again.",
      },
      { status: 500 }
    );
  }
}
