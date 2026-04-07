import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `id, product_title, product_type, amount_cents, currency, status,
         notes, paid_at, intake_submitted_at, delivered_at, created_at,
         service_id, stripe_payment_intent_id,
         diviners(id, display_name, username, avatar_url),
         services(id, name)`
      )
      .eq("id", id)
      .eq("client_id", client.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: intakeSubmission } = await supabase
      .from("order_intake_submissions")
      .select("id, fields, completed_at")
      .eq("order_id", id)
      .maybeSingle();

    return NextResponse.json({ order, intakeSubmission });
  } catch (err) {
    console.error("[portal/orders/[id]] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
