import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWeeklySubscriptionManageToken } from "@/lib/weekly-subscription-manage-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ManageAction = "cancel" | "pause_emails" | "resume_emails";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      action?: ManageAction;
    };

    const token = String(body.token ?? "");
    const action = body.action;

    if (!token || !action) {
      return NextResponse.json(
        { error: "token and action are required" },
        { status: 422 },
      );
    }

    if (!["cancel", "pause_emails", "resume_emails"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 422 });
    }

    const verified = verifyWeeklySubscriptionManageToken(token);
    if (!verified.valid || !verified.subscriberId || !verified.email) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: subscriber } = await admin
      .from("weekly_subscription_subscribers")
      .select(
        "id, client_id, diviner_id, status, email, current_period_end, stripe_subscription_id, email_opt_out",
      )
      .eq("id", verified.subscriberId)
      .eq("email", verified.email)
      .maybeSingle();

    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === "pause_emails" || action === "resume_emails") {
      const emailOptOut = action === "pause_emails";

      const { error: subscriberError } = await admin
        .from("weekly_subscription_subscribers")
        .update({
          email_opt_out: emailOptOut,
          email_opted_out_at: emailOptOut ? now : null,
          updated_at: now,
        })
        .eq("id", subscriber.id);

      if (subscriberError) {
        return NextResponse.json(
          { error: subscriberError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: emailOptOut
          ? "Weekly email deliveries are paused."
          : "Weekly email deliveries are active again.",
      });
    }

    if (subscriber.status === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "This subscription is already cancelled.",
      });
    }

    if (subscriber.stripe_subscription_id) {
      await stripe.subscriptions.update(subscriber.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    await admin
      .from("weekly_subscription_subscribers")
      .update({
        status: "cancelled",
        cancelled_at: now,
        updated_at: now,
      })
      .eq("id", subscriber.id);

    if (subscriber.client_id) {
      await admin
        .from("client_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: now,
          updated_at: now,
        })
        .eq("client_id", subscriber.client_id)
        .eq("stripe_subscription_id", subscriber.stripe_subscription_id ?? "");
    }

    const periodEnd = subscriber.current_period_end
      ? new Date(subscriber.current_period_end).toLocaleDateString("en-US", {
          dateStyle: "long",
        })
      : null;

    return NextResponse.json({
      success: true,
      message: periodEnd
        ? `Your subscription has been cancelled and will remain active until ${periodEnd}.`
        : "Your subscription has been cancelled.",
    });
  } catch (error) {
    console.error("[api/subscriptions/manage]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
