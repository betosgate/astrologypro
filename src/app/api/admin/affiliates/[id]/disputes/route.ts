import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/affiliates/[id]/disputes
// List all disputes for a given affiliate (admin only).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const cursor = searchParams.get("cursor");

  const admin = createAdminClient();

  let query = admin
    .from("affiliate_commission_disputes")
    .select(
      "id, commission_id, affiliate_id, raised_by, status, reason, resolution_notes, resolved_by, resolved_at, created_at, updated_at"
    )
    .eq("affiliate_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("id", cursor);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/500",
        title: "Database error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  const hasMore = (data ?? []).length > limit;
  const items = hasMore ? (data ?? []).slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return NextResponse.json({ data: items, nextCursor, hasMore });
}

// PATCH /api/admin/affiliates/[id]/disputes
// Resolve or dismiss a dispute.
// Body: { dispute_id, status: "resolved" | "dismissed" | "under_review", resolution_notes? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { id: affiliateId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const { dispute_id, status: newStatus, resolution_notes } = body as Record<string, unknown>;

  const allowedStatuses = ["resolved", "dismissed", "under_review"];
  if (typeof dispute_id !== "string" || dispute_id.trim() === "") {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "dispute_id is required", status: 422 },
      { status: 422 }
    );
  }
  if (typeof newStatus !== "string" || !allowedStatuses.includes(newStatus)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        status: 422,
        detail: `status must be one of: ${allowedStatuses.join(", ")}`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Verify dispute belongs to the given affiliate
  const { data: existing, error: fetchError } = await admin
    .from("affiliate_commission_disputes")
    .select("id, affiliate_id, status")
    .eq("id", dispute_id.trim())
    .eq("affiliate_id", affiliateId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Dispute not found", status: 404 },
      { status: 404 }
    );
  }

  const updatePayload: Record<string, unknown> = { status: newStatus };
  if (newStatus === "resolved" || newStatus === "dismissed") {
    updatePayload.resolved_by = user.id;
    updatePayload.resolved_at = new Date().toISOString();
  }
  if (typeof resolution_notes === "string" && resolution_notes.trim()) {
    updatePayload.resolution_notes = resolution_notes.trim();
  }

  const { data, error } = await admin
    .from("affiliate_commission_disputes")
    .update(updatePayload)
    .eq("id", dispute_id.trim())
    .select("id, status, resolution_notes, resolved_by, resolved_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", detail: error?.message, status: 500 },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
