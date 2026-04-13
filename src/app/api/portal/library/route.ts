import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_TYPES = ["all", "recordings", "tarot", "charts", "astro"] as const;
type LibraryType = (typeof VALID_TYPES)[number];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get client record
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const typeParam = req.nextUrl.searchParams.get("type") ?? "all";
  const type: LibraryType = VALID_TYPES.includes(typeParam as LibraryType)
    ? (typeParam as LibraryType)
    : "all";

  const admin = createAdminClient();

  // Build parallel queries based on requested type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries: Record<string, PromiseLike<{ data: any[] | null; error: any }>> =
    {};

  if (type === "all" || type === "recordings") {
    queries.recordings = admin
      .from("bookings")
      .select(
        "id, scheduled_at, recording_url, recording_share_id, actual_duration_minutes, services(name), diviners(display_name, username)"
      )
      .eq("client_id", client.id)
      .eq("status", "completed")
      .not("recording_url", "is", null)
      .order("scheduled_at", { ascending: false });
  }

  if (type === "all" || type === "tarot") {
    queries.tarot = admin
      .from("tarot_readings")
      .select(
        "id, spread_name, cards, notes, share_token, created_at, diviner_id, diviners(display_name)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  }

  if (type === "all" || type === "charts") {
    queries.charts = admin
      .from("birth_chart_results")
      .select(
        "id, city_label, birth_day, birth_month, birth_year, chart_url, created_at, diviner_id, diviners(display_name)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  }

  if (type === "all" || type === "astro") {
    queries.astro = admin
      .from("astro_toolkit_readings")
      .select(
        "id, reading_type, input_data, result_data, created_at, diviner_id, diviners(display_name)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
  }

  const keys = Object.keys(queries);
  const results = await Promise.all(Object.values(queries));

  const resolved: Record<string, any[]> = {};
  for (let i = 0; i < keys.length; i++) {
    resolved[keys[i]] = results[i].data ?? [];
  }

  const recordings = resolved.recordings ?? [];
  const tarot = resolved.tarot ?? [];
  const charts = resolved.charts ?? [];
  const astro = resolved.astro ?? [];

  return NextResponse.json({
    recordings,
    tarot,
    charts,
    astro,
    counts: {
      recordings: recordings.length,
      tarot: tarot.length,
      charts: charts.length,
      astro: astro.length,
    },
  });
}
