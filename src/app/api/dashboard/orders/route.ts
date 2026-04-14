import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/orders
 * Returns the authenticated diviner's orders with pagination, search, filters, and sorting.
 *
 * Query params:
 *   page         — page number (default 1)
 *   limit        — page size (default 20, max 50)
 *   status       — filter by order status
 *   search       — search client name/email, service type, payment ID, notes
 *   date_from    — ISO date string (YYYY-MM-DD), inclusive lower bound on created_at
 *   date_to      — ISO date string (YYYY-MM-DD), inclusive upper bound on created_at
 *   sort_by      — "created_at" | "amount" (default "created_at")
 *   sort_dir     — "asc" | "desc" (default "desc")
 *   booking_id   — filter by a specific booking ID
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
  const dateFrom = sp.get("date_from") || null;
  const dateTo = sp.get("date_to") || null;
  const rawSortBy = sp.get("sort_by") || "created_at";
  const sortBy = ["created_at", "amount"].includes(rawSortBy) ? rawSortBy : "created_at";
  const sortDir = sp.get("sort_dir") === "asc" ? true : false; // ascending?
  const bookingId = sp.get("booking_id") || null;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("orders")
    .select(
      "id, booking_id, client_id, service_type, amount, currency, status, stripe_payment_intent_id, notes, created_at, clients(full_name, email)",
      { count: "exact" }
    )
    .eq("diviner_id", diviner.id);

  if (status) query = query.eq("status", status);

  if (bookingId) query = query.eq("booking_id", bookingId);

  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

  if (search) {
    const safeTerm = search.replace(/[%_()'",]/g, "");

    // Search clients by name/email to get matching client IDs
    const { data: matchingClients } = await admin
      .from("clients")
      .select("id")
      .or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%`);

    const clientIds = matchingClients?.map((c) => c.id) ?? [];

    if (clientIds.length > 0) {
      const idList = clientIds.join(",");
      query = query.or(
        `service_type.ilike.%${safeTerm}%,stripe_payment_intent_id.ilike.%${safeTerm}%,notes.ilike.%${safeTerm}%,client_id.in.(${idList})`
      );
    } else {
      query = query.or(
        `service_type.ilike.%${safeTerm}%,stripe_payment_intent_id.ilike.%${safeTerm}%,notes.ilike.%${safeTerm}%`
      );
    }
  }

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortDir })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  // Stats — always global (unfiltered) counts for dashboard KPIs
  const [totalRes, completedRes, pendingRes, refundedRes] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).eq("diviner_id", diviner.id),
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
      total: totalRes.count ?? 0,
      completed: completedRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      refunded: refundedRes.count ?? 0,
    },
  });
}
