import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/orders
 * Returns the authenticated diviner's orders with pagination, search, and status filter.
 */
export async function GET(req: NextRequest) {
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

  const admin = createAdminClient();

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Diviner profile not found" },
      { status: 403 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const status = sp.get("status") || null;
  const search = sp.get("search")?.trim() || null;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("orders")
    .select("id, booking_id, client_id, service_type, amount, currency, status, stripe_payment_intent_id, notes, created_at, clients(full_name, email)", { count: "exact" })
    .eq("diviner_id", diviner.id);

  if (status) query = query.eq("status", status);
  if (search) {
    const safeTerm = search.replace(/[%_().,]/g, "");
    query = query.or(`service_type.ilike.%${safeTerm}%,stripe_payment_intent_id.ilike.%${safeTerm}%,notes.ilike.%${safeTerm}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  // Stats
  const [completedRes, pendingRes, refundedRes] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).eq("diviner_id", diviner.id).eq("status", "completed"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("diviner_id", diviner.id).eq("status", "pending"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("diviner_id", diviner.id).eq("status", "refunded"),
  ]);

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
    stats: {
      total: count ?? 0,
      completed: completedRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      refunded: refundedRes.count ?? 0,
    },
  });
}
