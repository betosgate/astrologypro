import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/portal/deliverables/[orderId]
 * Fetch deliverable content for an order. Verifies the authenticated user owns the order.
 * Returns: order notes, linked astro_toolkit_readings and tarot_readings if any.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Authentication required" },
      { status: 401 },
    );
  }

  // Resolve client
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Client profile not found" },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Fetch order and verify ownership
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, status, notes, booking_id, delivered_at")
    .eq("id", orderId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (orderErr || !order) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not found", status: 404, detail: "Order not found" },
      { status: 404 },
    );
  }

  // Only show deliverables for delivered/completed orders
  if (order.status !== "delivered" && order.status !== "completed") {
    return NextResponse.json({
      deliverables: [],
      reading_notes: null,
      status: order.status,
    });
  }

  // Fetch linked readings if booking_id exists
  const deliverables: Array<{
    type: string;
    reading_type?: string;
    result_data?: unknown;
    created_at: string;
  }> = [];

  if (order.booking_id) {
    const [astroRes, tarotRes] = await Promise.all([
      admin
        .from("astro_toolkit_readings")
        .select("id, reading_type, result_data, created_at")
        .eq("booking_id", order.booking_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
      admin
        .from("tarot_readings")
        .select("id, spread_type, cards, interpretation, created_at")
        .eq("booking_id", order.booking_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
    ]);

    for (const r of astroRes.data ?? []) {
      deliverables.push({
        type: "astro_reading",
        reading_type: r.reading_type,
        result_data: r.result_data,
        created_at: r.created_at,
      });
    }

    for (const r of tarotRes.data ?? []) {
      deliverables.push({
        type: "tarot_reading",
        result_data: {
          spread_type: r.spread_type,
          cards: r.cards,
          interpretation: r.interpretation,
        },
        created_at: r.created_at,
      });
    }
  }

  return NextResponse.json({
    reading_notes: order.notes,
    delivered_at: order.delivered_at,
    deliverables,
    status: order.status,
  });
}
