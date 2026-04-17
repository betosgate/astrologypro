import { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTraineeSummary } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── POST /api/admin/tabbie-appointments/[traineeId]/sync ─────────────────────
// Manually resets the sync error flag and triggers a re-evaluation.
// Future: can call an external provider API to pull latest state.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ traineeId: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { traineeId } = await params;
  const admin = createAdminClient();

  const { data: trainee } = await admin
    .from("trainees")
    .select("id")
    .eq("id", traineeId)
    .maybeSingle();

  if (!trainee) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "Trainee not found", status: 404 },
      { status: 404 }
    );
  }

  // Reset sync error status — marks that a manual retry was requested
  await updateTraineeSummary(traineeId, {
    tabbie_appointment_sync_status: "pending_sync",
    tabbie_appointment_last_synced_at: new Date().toISOString(),
  });

  // Audit the sync trigger
  await admin.from("admin_activity_log").insert({
    admin_user_id: user.email ?? user.id,
    target_user_id: traineeId,
    action_type: "tabbie_manual_sync",
    details: { trainee_id: traineeId },
  }).maybeSingle();

  return Response.json({ ok: true, message: "Sync status reset — webhook will update next booking event" });
}
