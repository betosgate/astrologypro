import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/mystery-school/excuse
 * Body: { student_decan_progress_id: string, excuse_reason: string }
 *
 * Marks a missed decan as admin-excused with an audit trail.
 * Only rows with status === 'missed' can be excused.
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { student_decan_progress_id?: string; excuse_reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { student_decan_progress_id, excuse_reason } = body;

  if (!student_decan_progress_id || typeof student_decan_progress_id !== "string") {
    return NextResponse.json(
      { error: "student_decan_progress_id is required" },
      { status: 422 }
    );
  }
  if (!excuse_reason || typeof excuse_reason !== "string" || excuse_reason.trim().length === 0) {
    return NextResponse.json(
      { error: "excuse_reason is required and must not be empty" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch the progress row to verify it exists and is in 'missed' status
  const { data: progressRaw, error: fetchError } = await admin
    .from("student_decan_progress")
    .select("id, student_id, decan_id, status, admin_excused")
    .eq("id", student_decan_progress_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  type ProgressRow = {
    id: string;
    student_id: string;
    decan_id: string;
    status: string;
    admin_excused: boolean;
  };

  const progress = progressRaw as unknown as ProgressRow | null;

  if (!progress) {
    return NextResponse.json({ error: "Progress record not found" }, { status: 404 });
  }

  if (progress.status !== "missed") {
    return NextResponse.json(
      { error: `Only missed decans can be excused. Current status: ${progress.status}` },
      { status: 422 }
    );
  }

  if (progress.admin_excused) {
    return NextResponse.json(
      { error: "This decan has already been excused" },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const previousStatus = progress.status;

  // Update the progress row
  const { data: updatedRaw, error: updateError } = await admin
    .from("student_decan_progress")
    .update({
      admin_excused: true,
      admin_excused_at: now,
      admin_excused_by: user.id,
      excuse_reason: excuse_reason.trim(),
      excused_at: now,
      excused_by: user.id,
      updated_at: now,
    })
    .eq("id", student_decan_progress_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Insert audit record
  const { error: auditError } = await admin.from("decan_excuse_audit").insert({
    student_decan_progress_id: progress.id,
    student_id: progress.student_id,
    decan_id: progress.decan_id,
    excused_by: user.id,
    excuse_reason: excuse_reason.trim(),
    previous_status: previousStatus,
    new_status: "missed",
  });

  if (auditError) {
    // Log but don't fail the request — the update succeeded
    console.error("[excuse] audit insert failed:", auditError.message);
  }

  return NextResponse.json({ progress: updatedRaw });
}
