import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
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

    const { data, error } = await supabase
      .from("client_subscriptions")
      .select(
        `id, subscription_type, status, amount_cents, current_period_end,
         cancelled_at, created_at,
         diviners(display_name, username, avatar_url),
         weekly_subscription_products(title, description)`
      )
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[portal/subscriptions] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    return NextResponse.json({ subscriptions: data ?? [] });
  } catch (err) {
    console.error("[portal/subscriptions] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
