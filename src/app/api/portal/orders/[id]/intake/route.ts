import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
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

    // Validate order belongs to client
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, client_id")
      .eq("id", orderId)
      .eq("client_id", client.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "paid" && order.status !== "awaiting_intake") {
      return NextResponse.json(
        { error: "Intake can only be submitted for paid or awaiting_intake orders" },
        { status: 422 }
      );
    }

    const body = await req.json() as { fields?: Record<string, string> };
    const fields = body.fields;

    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return NextResponse.json(
        { error: "fields must be a key-value object" },
        { status: 422 }
      );
    }

    // Validate field values are strings and not excessively long
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value !== "string") {
        return NextResponse.json(
          { error: `Field "${key}" must be a string` },
          { status: 422 }
        );
      }
      if (value.length > 5000) {
        return NextResponse.json(
          { error: `Field "${key}" exceeds maximum length` },
          { status: 422 }
        );
      }
    }

    const now = new Date().toISOString();
    const adminSupabase = createAdminClient();

    // Upsert intake submission (UNIQUE on order_id)
    const { data: submission, error: upsertError } = await adminSupabase
      .from("order_intake_submissions")
      .upsert(
        {
          order_id: orderId,
          client_id: client.id,
          fields,
          completed_at: now,
        },
        { onConflict: "order_id" }
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error("[portal/orders/intake] Upsert error:", upsertError);
      return NextResponse.json({ error: "Failed to save intake" }, { status: 500 });
    }

    // Update order status to intake_submitted
    const { error: updateError } = await adminSupabase
      .from("orders")
      .update({ status: "intake_submitted", intake_submitted_at: now })
      .eq("id", orderId);

    if (updateError) {
      console.error("[portal/orders/intake] Status update error:", updateError);
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
    }

    return NextResponse.json({
      id: submission.id,
      message: "Intake submitted successfully.",
    });
  } catch (err) {
    console.error("[portal/orders/intake] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
