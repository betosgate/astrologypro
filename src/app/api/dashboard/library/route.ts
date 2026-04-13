import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
    return NextResponse.json({ error: "Diviner not found" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

  const fetchRecordings = type === "all" || type === "recordings";
  const fetchTarot = type === "all" || type === "tarot";
  const fetchCharts = type === "all" || type === "charts";
  const fetchAstro = type === "all" || type === "astro";

  // Run all queries in parallel
  const [recordingsRes, tarotRes, chartsRes, astroRes] = await Promise.all([
    fetchRecordings
      ? admin
          .from("bookings")
          .select(
            "id, scheduled_at, recording_url, recording_share_id, actual_duration_minutes, session_notes, services(name), clients(full_name, email)"
          )
          .eq("diviner_id", diviner.id)
          .eq("status", "completed")
          .not("recording_url", "is", null)
          .order("scheduled_at", { ascending: false })
          .order("id", { ascending: false })
      : Promise.resolve({ data: null }),
    fetchTarot
      ? admin
          .from("tarot_readings")
          .select(
            "id, user_id, diviner_id, spread_name, cards, notes, share_token, created_at"
          )
          .eq("diviner_id", diviner.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
      : Promise.resolve({ data: null }),
    fetchCharts
      ? admin
          .from("birth_chart_results")
          .select(
            "id, user_id, diviner_id, city_label, birth_day, birth_month, birth_year, chart_url, created_at"
          )
          .eq("diviner_id", diviner.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
      : Promise.resolve({ data: null }),
    fetchAstro
      ? admin
          .from("astro_toolkit_readings")
          .select(
            "id, user_id, diviner_id, reading_type, input_data, result_data, booking_id, created_at"
          )
          .eq("diviner_id", diviner.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recordings: any[] = (recordingsRes.data as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tarotRows: any[] = (tarotRes.data as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chartRows: any[] = (chartsRes.data as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let astroRows: any[] = (astroRes.data as any[]) ?? [];

  // Filter recordings by client name search
  if (search && recordings.length > 0) {
    recordings = recordings.filter((r) =>
      r.clients?.full_name?.toLowerCase().includes(search)
    );
  }

  // Resolve client names for reading tables via user_id -> clients lookup
  const userIds = new Set<string>();
  for (const row of [...tarotRows, ...chartRows, ...astroRows]) {
    if (row.user_id) userIds.add(row.user_id);
  }

  let clientMap: Record<string, { full_name: string; email: string }> = {};
  if (userIds.size > 0) {
    const { data: clientRows } = await admin
      .from("clients")
      .select("user_id, full_name, email")
      .in("user_id", Array.from(userIds));

    if (clientRows) {
      for (const c of clientRows) {
        clientMap[c.user_id] = {
          full_name: c.full_name ?? "",
          email: c.email ?? "",
        };
      }
    }
  }

  // Attach client info and optionally filter by search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function attachClient(rows: any[]) {
    let result = rows.map((row) => ({
      ...row,
      client: clientMap[row.user_id] ?? null,
    }));
    if (search) {
      result = result.filter((r) =>
        r.client?.full_name?.toLowerCase().includes(search)
      );
    }
    return result;
  }

  tarotRows = attachClient(tarotRows);
  chartRows = attachClient(chartRows);
  astroRows = attachClient(astroRows);

  return NextResponse.json({
    recordings,
    tarot: tarotRows,
    charts: chartRows,
    astro: astroRows,
    counts: {
      recordings: recordings.length,
      tarot: tarotRows.length,
      charts: chartRows.length,
      astro: astroRows.length,
    },
  });
}
