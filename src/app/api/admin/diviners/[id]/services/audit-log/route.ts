import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/diviners/[id]/services/audit-log
// Returns paginated service access audit log for this diviner.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset    = parseInt(searchParams.get("offset") ?? "0");
  const action    = searchParams.get("action") ?? "";
  const dateFrom  = searchParams.get("date_from") ?? "";
  const dateTo    = searchParams.get("date_to") ?? "";

  const admin = createAdminClient();
  const divinerId = params.id;

  let query = admin
    .from("service_access_audit_log")
    .select(`
      id, action, performed_by, performed_by_role,
      old_value, new_value, reason, created_at,
      service_templates ( id, name, slug )
    `, { count: "exact" })
    .eq("diviner_id", divinerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) query = query.eq("action", action);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data: entries, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch performer names
  const performerIds = [...new Set((entries ?? []).map((e) => e.performed_by).filter(Boolean))];
  let performerNames: Record<string, string> = {};
  if (performerIds.length > 0) {
    const { data: performers } = await admin.rpc("get_auth_users_by_ids", {
      user_ids: performerIds,
    });
    for (const p of performers ?? []) {
      performerNames[p.id] = p.email ?? p.id;
    }
  }

  const enriched = (entries ?? []).map((e) => ({
    ...e,
    performer_name: performerNames[e.performed_by] ?? e.performed_by,
  }));

  return NextResponse.json({ entries: enriched, total: count ?? 0, limit, offset });
}
