import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/clients
 * Returns the authenticated diviner's clients with pagination, search, and sorting.
 *
 * Query params:
 *   page      — page number (default 1)
 *   limit     — page size (default 20, max 50)
 *   search    — filter by client full_name or email
 *   sort_by   — "last_session_at" | "total_sessions" | "total_spent" | "first_session_at" (default "last_session_at")
 *   sort_dir  — "asc" | "desc" (default "desc")
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
  const search = sp.get("search")?.trim() || null;
  const rawSortBy = sp.get("sort_by") || "last_session_at";
  const sortBy = ["last_session_at", "total_sessions", "total_spent", "first_session_at"].includes(rawSortBy)
    ? rawSortBy
    : "last_session_at";
  const ascending = sp.get("sort_dir") === "asc";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // If searching, resolve matching client IDs first
  let clientIdFilter: string[] | null = null;
  if (search) {
    const safeTerm = search.replace(/[%_()'",]/g, "");
    const { data: matchedClients } = await admin
      .from("clients")
      .select("id")
      .or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%`);
    clientIdFilter = matchedClients?.map((c) => c.id) ?? [];
  }

  let query = admin
    .from("client_diviners")
    .select(
      "id, client_id, total_sessions, total_spent, last_session_at, first_session_at, notes, clients(id, full_name, email, birth_date, birth_time, birth_city)",
      { count: "exact" }
    )
    .eq("diviner_id", diviner.id);

  if (clientIdFilter !== null) {
    if (clientIdFilter.length === 0) {
      // No clients match — return empty
      return NextResponse.json({
        clients: [],
        total: 0,
        page,
        pages: 0,
        diviner_id: diviner.id,
        stats: await getStats(admin, diviner.id),
      });
    }
    query = query.in("client_id", clientIdFilter);
  }

  const { data, count, error } = await query
    .order(sortBy, { ascending, nullsFirst: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Query failed", status: 500, detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    clients: data ?? [],
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
    diviner_id: diviner.id,
    stats: await getStats(admin, diviner.id),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStats(admin: any, divinerId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, activeRes, aggregateRes] = await Promise.all([
    admin.from("client_diviners").select("id", { count: "exact", head: true }).eq("diviner_id", divinerId),
    admin.from("client_diviners").select("id", { count: "exact", head: true }).eq("diviner_id", divinerId).gte("last_session_at", thirtyDaysAgo),
    admin.from("client_diviners").select("total_sessions, total_spent").eq("diviner_id", divinerId),
  ]);

  const totalSessions = aggregateRes.data?.reduce((s, r) => s + (r.total_sessions ?? 0), 0) ?? 0;
  const totalRevenue = aggregateRes.data?.reduce((s, r) => s + Number(r.total_spent ?? 0), 0) ?? 0;

  return {
    total: totalRes.count ?? 0,
    active_30d: activeRes.count ?? 0,
    total_sessions: totalSessions,
    total_revenue: Number(totalRevenue.toFixed(2)),
  };
}
