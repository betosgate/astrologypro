import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected", "on_hold"],
  on_hold: ["approved", "rejected", "pending"],
  approved: ["paid", "reversed", "on_hold"],
  rejected: ["pending"],
  paid: ["reversed"],
  reversed: [],
};

// PATCH /api/admin/commissions/[commissionId]
// Approve, reject, or hold a commission
// Body: { status: 'approved' | 'rejected' | 'on_hold', reason? }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commissionId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  const { commissionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.io/422", title: "Invalid JSON body", status: 422 },
      { status: 422 }
    );
  }

  const { status: newStatus, reason } = body as Record<string, unknown>;

  const allowedStatuses = ["approved", "rejected", "on_hold", "paid", "reversed", "pending"];
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

  // Fetch current commission
  const { data: commission, error: fetchError } = await admin
    .from("affiliate_commissions")
    .select("id, affiliate_id, status, notes")
    .eq("id", commissionId)
    .single();

  if (fetchError || !commission) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/404", title: "Commission not found", status: 404 },
      { status: 404 }
    );
  }

  const currentStatus = commission.status as string;
  const allowedNext = VALID_TRANSITIONS[currentStatus] ?? [];

  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.io/422",
        title: "Invalid status transition",
        status: 422,
        detail: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedNext.join(", ") || "none"}`,
      },
      { status: 422 }
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = { status: newStatus };

  if (newStatus === "approved") {
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.approved_by = user.id;
  }

  if ((newStatus === "rejected" || newStatus === "on_hold") && typeof reason === "string" && reason.trim()) {
    const existingNotes = commission.notes ?? "";
    const reasonNote = `[${newStatus.toUpperCase()} by ${user.email ?? user.id}]: ${reason.trim()}`;
    updatePayload.notes = existingNotes ? `${existingNotes}\n${reasonNote}` : reasonNote;
  }

  // Insert history record first
  await admin
    .from("affiliate_commission_history")
    .insert({
      commission_id: commissionId,
      old_status: currentStatus,
      new_status: newStatus,
      changed_by: user.id,
      reason: typeof reason === "string" ? reason.trim() || null : null,
    });

  // Update commission status
  const { data, error: updateError } = await admin
    .from("affiliate_commissions")
    .update(updatePayload)
    .eq("id", commissionId)
    .select("id, affiliate_id, diviner_id, status, approved_at, approved_by, notes, updated_at")
    .single();

  if (updateError || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.io/500", title: "Database error", status: 500, detail: updateError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
