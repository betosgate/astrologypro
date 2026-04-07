import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function problem(status: number, title: string, detail: string) {
  return NextResponse.json(
    { type: "about:blank", title, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } }
  );
}

// ─── GET /api/admin/users/[id]/audit-log ─────────────────────────────────────
// Returns paginated audit log entries for a given user.
// Query params: page (0-indexed), limit (default 20, max 100)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return problem(403, "Forbidden", "Admin access required.");
  }

  const { id: targetUserId } = await params;

  const url = new URL(req.url);
  const page = Math.max(0, parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const offset = page * limit;

  const admin = createAdminClient();

  const { data, count, error } = await admin
    .from("admin_activity_log")
    .select("id, admin_user_id, action_type, details, created_at", { count: "exact" })
    .eq("target_user_id", targetUserId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[audit-log] query error", error);
    return problem(500, "Internal Server Error", "Failed to fetch audit logs.");
  }

  return NextResponse.json({
    logs: (data ?? []).map((entry) => ({
      id: entry.id,
      action_type: entry.action_type,
      admin_user_id: entry.admin_user_id,
      details: entry.details,
      created_at: entry.created_at,
    })),
    total: count ?? 0,
    page,
    limit,
  });
}
