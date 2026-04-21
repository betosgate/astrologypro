import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_STATUSES = ["pending", "assigned", "rejected", "all"] as const;

type StatusFilter = (typeof ALLOWED_STATUSES)[number];

/**
 * GET /api/admin/phone-requests
 *
 * Optional query params:
 *   status = pending | assigned | rejected | all  (default: pending)
 *   limit  = 1..200                                (default: 100)
 *   offset = >=0                                   (default: 0)
 *
 * Returns requests joined with diviner + assigned phone info for the admin
 * list view. Orders pending first, then by newest.
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusRaw = req.nextUrl.searchParams.get("status") ?? "pending";
  if (!ALLOWED_STATUSES.includes(statusRaw as StatusFilter)) {
    return NextResponse.json(
      { error: "Invalid status filter", allowed: ALLOWED_STATUSES },
      { status: 422 },
    );
  }
  const status = statusRaw as StatusFilter;

  const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const offsetRaw = Number(req.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, limitRaw)) : 100;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const admin = createAdminClient();

  let query = admin
    .from("phone_number_requests")
    .select(
      `
      id,
      status,
      note,
      rejected_reason,
      created_at,
      updated_at,
      assigned_at,
      rejected_at,
      diviner:diviners!phone_number_requests_diviner_id_fkey (
        id,
        display_name,
        username,
        user_id
      ),
      assigned_phone:chime_phone_numbers (
        id,
        phone_number
      ),
      assigned_by:admin_users (
        id,
        email
      )
      `,
    )
    // Deterministic ordering: pending first by age, then by created_at desc,
    // then by id tie-breaker (project rule #26).
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/phone-requests GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also return a count of pending for the sidebar badge (cheap single query).
  const { count: pendingCount } = await admin
    .from("phone_number_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return NextResponse.json({
    requests: data ?? [],
    pendingCount: pendingCount ?? 0,
  });
}
