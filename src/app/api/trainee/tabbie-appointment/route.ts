import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeTraineeTabbieDashboardState } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── GET /api/trainee/tabbie-appointment ─────────────────────────────────────
// Returns current dashboard state for the authenticated trainee.
// Never exposes a booking link to ineligible trainees.

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data: trainee } = await admin
    .from("trainees")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trainee) {
    return Response.json(
      { type: "https://httpstatuses.com/404", title: "Trainee not found", status: 404 },
      { status: 404 }
    );
  }

  try {
    const state = await computeTraineeTabbieDashboardState(trainee.id, user.id);

    // Safety: never expose booking link to ineligible trainees
    if (!state.isRequired && state.content?.bookingLink) {
      state.content.bookingLink = null;
    }

    return Response.json({ ok: true, data: state });
  } catch (err) {
    console.error("[api/trainee/tabbie-appointment] error:", err);
    return Response.json(
      { type: "https://httpstatuses.com/500", title: "Internal error", status: 500 },
      { status: 500 }
    );
  }
}
