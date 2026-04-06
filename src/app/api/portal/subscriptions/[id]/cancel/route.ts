import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: subscriptionId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Validate subscription belongs to client and is currently active
    const { data: subscription, error: subError } = await supabase
      .from("client_subscriptions")
      .select("id, status, current_period_end, client_id")
      .eq("id", subscriptionId)
      .eq("client_id", client.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json(
        { error: "Subscription is already cancelled" },
        { status: 422 }
      );
    }

    const now = new Date().toISOString();
    const adminSupabase = createAdminClient();

    const { error: updateError } = await adminSupabase
      .from("client_subscriptions")
      .update({ status: "cancelled", cancelled_at: now, updated_at: now })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("[portal/subscriptions/cancel] Update error:", updateError);
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    const periodEnd = subscription.current_period_end ?? null;
    const message = periodEnd
      ? `Your subscription has been cancelled. You will continue to have access until ${new Date(periodEnd).toLocaleDateString("en-US", { dateStyle: "long" })}.`
      : "Your subscription has been cancelled.";

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("[portal/subscriptions/cancel] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
