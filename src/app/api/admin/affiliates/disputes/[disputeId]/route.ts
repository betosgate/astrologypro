import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// PATCH /api/admin/affiliates/disputes/[disputeId]
// Body: { status: 'open'|'under_review'|'resolved'|'rejected', resolution_notes?: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { disputeId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { status, resolution_notes } = body as Record<string, unknown>;

  const allowedStatuses = ["open", "under_review", "resolved", "rejected"];
  if (typeof status !== "string" || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Validation error",
        detail: `status must be one of: ${allowedStatuses.join(", ")}.`,
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Confirm dispute exists
  const { data: existing, error: fetchError } = await admin
    .from("affiliate_commission_disputes")
    .select("id, status")
    .eq("id", disputeId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Dispute not found" },
      { status: 404 }
    );
  }

  const updatePayload: Record<string, unknown> = { status };

  if (typeof resolution_notes === "string" && resolution_notes.trim()) {
    updatePayload.resolution_notes = resolution_notes.trim();
  }

  // Set resolver fields when moving to a terminal state
  if (status === "resolved" || status === "rejected") {
    updatePayload.resolved_by = user.id;
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from("affiliate_commission_disputes")
    .update(updatePayload)
    .eq("id", disputeId)
    .select(
      "id, commission_id, affiliate_id, raised_by, status, reason, resolution_notes, resolved_by, resolved_at, updated_at"
    )
    .single();

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

  return NextResponse.json({ data });
}
