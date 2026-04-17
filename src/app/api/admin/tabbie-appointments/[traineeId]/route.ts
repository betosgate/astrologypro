import { NextRequest } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTraineeAppointmentHistory } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/tabbie-appointments/[traineeId] ───────────────────────────
// Returns trainee appointment detail + all appointment records + history.

export async function GET(
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

  const [traineeResult, appointmentsResult, historyResult] = await Promise.all([
    admin
      .from("trainees")
      .select(
        `id, name, username, training_status, graduated_at,
         tabbie_appointment_required, tabbie_appointment_status,
         tabbie_appointment_completed, tabbie_appointment_completed_at,
         current_tabbie_appointment_id, tabbie_appointment_sync_status,
         tabbie_appointment_last_synced_at, tabbie_appointment_completion_source,
         tabbie_appointment_completion_notes, user_id`
      )
      .eq("id", traineeId)
      .maybeSingle(),
    admin
      .from("trainee_tabbie_appointments")
      .select("*")
      .eq("trainee_id", traineeId)
      .order("created_at", { ascending: false })
      .limit(50),
    getTraineeAppointmentHistory(traineeId),
  ]);

  if (!traineeResult.data) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "Trainee not found", status: 404 },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    data: {
      trainee: traineeResult.data,
      appointments: appointmentsResult.data ?? [],
      history: historyResult,
    },
  });
}
