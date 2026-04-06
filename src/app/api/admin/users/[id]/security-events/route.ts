import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/users/:id/security-events ─────────────────────────────────
// Returns recent security events for a user.
// Query params: limit (default 50, max 200)

export async function GET(req: NextRequest, { params }: Params) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const admin = createAdminClient();

  // Verify auth user exists
  const { data: authUserData, error: authErr } = await admin.auth.admin.getUserById(id);
  if (authErr || !authUserData.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("user_security_events")
    .select(
      "id, event_type, ip_address, device_info, metadata, actor_user_id, created_at"
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [] });
}
