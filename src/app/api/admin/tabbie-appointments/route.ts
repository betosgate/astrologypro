import { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/tabbie-appointments ───────────────────────────────────────
// Query params: status, from, to, search, page, limit
// Returns paginated list of trainees with their tabbie appointment summary.

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const search = sp.get("search") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("trainees")
    .select(
      `id, name, username, training_status, graduated_at,
       tabbie_appointment_required, tabbie_appointment_status,
       tabbie_appointment_completed, tabbie_appointment_completed_at,
       current_tabbie_appointment_id, tabbie_appointment_sync_status,
       tabbie_appointment_last_synced_at, user_id`,
      { count: "exact" }
    )
    .order("tabbie_appointment_last_synced_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true });

  if (status) {
    query = query.eq("tabbie_appointment_status", status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
  }
  if (from) {
    query = query.gte("tabbie_appointment_completed_at", from);
  }
  if (to) {
    query = query.lte("tabbie_appointment_completed_at", to);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  return Response.json({
    ok: true,
    data: data ?? [],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
