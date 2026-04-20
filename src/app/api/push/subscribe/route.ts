import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/subscribe
 * Saves a Web Push subscription for the authenticated diviner.
 * Called by the dashboard when the service worker registers successfully.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Must be a diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Only diviners can subscribe to push" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscription } = body as {
      subscription?: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
    };

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid push subscription" },
        { status: 400 }
      );
    }

    // Upsert — if this endpoint already exists for this diviner, update it
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          diviner_id: diviner.id,
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: request.headers.get("user-agent") ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "diviner_id,endpoint" }
      );

    if (error) {
      console.error("[push/subscribe] Upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("[push/subscribe] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
