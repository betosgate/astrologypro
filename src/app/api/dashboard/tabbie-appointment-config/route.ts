import { createClient } from "@/lib/supabase/server";
import { getAdminTabbieConfig } from "@/lib/trainee-tabbie-appointments";

export const dynamic = "force-dynamic";

// ─── GET /api/dashboard/tabbie-appointment-config ────────────────────────────
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

  const config = await getAdminTabbieConfig();
  return Response.json({ ok: true, data: config });
}
