import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────
// Query params: status, diviner_id, from, to, search, page, limit
// Returns: { bookings, total, page, limit, pages }

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401, detail: "Admin access required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const diviner_id = searchParams.get("diviner_id") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // ── Build the query ──────────────────────────────────────────────────────────
  let query = admin
    .from("bookings")
    .select(
      `id, scheduled_at, duration_minutes, base_price, total_amount, status,
       stripe_payment_intent_id, stripe_payment_status, cancellation_reason,
       canceled_at, created_at, google_calendar_event_id, outlook_calendar_event_id,
       diviners!inner(id, display_name, username),
       clients!inner(id, full_name, email),
       services!inner(id, name, duration_minutes)`,
      { count: "exact" }
    )
    .order("scheduled_at", { ascending: false })
    .order("id", { ascending: false }) // deterministic tie-breaker
    .range(offset, offset + limit - 1);

  // ── Filters ──────────────────────────────────────────────────────────────────
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (diviner_id) {
    query = query.eq("diviner_id", diviner_id);
  }
  if (from) {
    query = query.gte("scheduled_at", new Date(from).toISOString());
  }
  if (to) {
    // End of the day for the "to" date
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("scheduled_at", toDate.toISOString());
  }

  const { data: bookings, count, error } = await query;

  if (error) {
    console.error("[admin/bookings] query error:", error);
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  // ── Client-side search filter (name/email) ───────────────────────────────────
  // Done post-query because Supabase FK filter on joined tables is limited.
  // For production scale, add a full-text index on clients.full_name + email.
  let filtered = bookings ?? [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((b) => {
      const client = b.clients as { full_name?: string | null; email?: string | null } | null;
      return (
        client?.full_name?.toLowerCase().includes(q) ||
        client?.email?.toLowerCase().includes(q)
      );
    });
  }

  // ── Summary stats (current month) ────────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

  const { data: monthlyBookings } = await admin
    .from("bookings")
    .select("status, total_amount")
    .gte("scheduled_at", monthStart)
    .lte("scheduled_at", monthEnd);

  const stats = {
    total_this_month: monthlyBookings?.length ?? 0,
    confirmed: monthlyBookings?.filter((b) => b.status === "confirmed").length ?? 0,
    completed: monthlyBookings?.filter((b) => b.status === "completed").length ?? 0,
    revenue: monthlyBookings
      ?.filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) ?? 0,
  };

  const total = count ?? 0;
  return Response.json({
    bookings: filtered,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    stats,
  });
}
