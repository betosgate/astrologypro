import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 50;

// ─── GET /api/admin/activity-log ─────────────────────────────────────────────
// Returns paginated admin activity log entries with optional filters.

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const adminUserId = sp.get("admin_user_id") ?? "";
  const targetUserId = sp.get("target_user_id") ?? "";
  const actionType = sp.get("action_type") ?? "";
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo = sp.get("created_to") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("admin_activity_log")
    .select("id, admin_user_id, target_user_id, action_type, details, ip_address, created_at", {
      count: "exact",
    });

  if (adminUserId) query = query.eq("admin_user_id", adminUserId);
  if (targetUserId) query = query.eq("target_user_id", targetUserId);
  if (actionType) query = query.eq("action_type", actionType);
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59Z");

  query = query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ entries: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
