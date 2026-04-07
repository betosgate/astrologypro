import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: string;
  type: "entity" | "leader" | "event" | "forecast";
  title: string;
  snippet: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const typeFilter = sp.get("type") ?? "all"; // all, entity, leader, event, forecast
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));

  if (!q) {
    return NextResponse.json({
      results: [],
      counts: { all: 0, entity: 0, leader: 0, event: 0, forecast: 0 },
      page,
      limit,
    });
  }

  const admin = createAdminClient();
  const pattern = `%${q}%`;

  // Run searches in parallel
  const searchTypes = typeFilter === "all"
    ? ["entity", "leader", "event", "forecast"]
    : [typeFilter];

  const promises: Promise<{ type: string; results: SearchResult[]; total: number }>[] = [];

  if (searchTypes.includes("entity")) {
    promises.push(
      (async () => {
        const offset = typeFilter === "entity" ? (page - 1) * limit : 0;
        const lim = typeFilter === "entity" ? limit : 10;
        const { data, count } = await admin
          .from("mundane_entities_v2")
          .select("id, name, entity_type, region, flag_emoji", { count: "exact" })
          .ilike("name", pattern)
          .order("name", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + lim - 1);
        return {
          type: "entity",
          total: count ?? 0,
          results: (data ?? []).map((e: { id: string; name: string; entity_type: string; region: string | null; flag_emoji: string | null }) => ({
            id: e.id,
            type: "entity" as const,
            title: `${e.flag_emoji ? e.flag_emoji + " " : ""}${e.name}`,
            snippet: `${e.entity_type}${e.region ? " - " + e.region : ""}`,
            href: `/admin/mundane/entities/${e.id}`,
          })),
        };
      })()
    );
  }

  if (searchTypes.includes("leader")) {
    promises.push(
      (async () => {
        const offset = typeFilter === "leader" ? (page - 1) * limit : 0;
        const lim = typeFilter === "leader" ? limit : 10;
        const { data, count } = await admin
          .from("mundane_leaders")
          .select("id, full_name, office_title, is_current", { count: "exact" })
          .ilike("full_name", pattern)
          .order("full_name", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + lim - 1);
        return {
          type: "leader",
          total: count ?? 0,
          results: (data ?? []).map((l: { id: string; full_name: string; office_title: string | null; is_current: boolean }) => ({
            id: l.id,
            type: "leader" as const,
            title: l.full_name,
            snippet: `${l.office_title ?? "Leader"}${l.is_current ? " (Current)" : ""}`,
            href: `/admin/mundane/leaders/${l.id}`,
          })),
        };
      })()
    );
  }

  if (searchTypes.includes("event")) {
    promises.push(
      (async () => {
        const offset = typeFilter === "event" ? (page - 1) * limit : 0;
        const lim = typeFilter === "event" ? limit : 10;
        const { data, count } = await admin
          .from("mundane_events")
          .select("id, title, description, event_type, event_date", { count: "exact" })
          .or(`title.ilike.${pattern},description.ilike.${pattern}`)
          .order("event_date", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + lim - 1);
        return {
          type: "event",
          total: count ?? 0,
          results: (data ?? []).map((ev: { id: string; title: string; description: string | null; event_type: string; event_date: string }) => ({
            id: ev.id,
            type: "event" as const,
            title: ev.title,
            snippet: `${ev.event_type} - ${ev.event_date}${ev.description ? ": " + ev.description.slice(0, 80) : ""}`,
            href: `/admin/mundane/events/${ev.id}`,
          })),
        };
      })()
    );
  }

  if (searchTypes.includes("forecast")) {
    promises.push(
      (async () => {
        const offset = typeFilter === "forecast" ? (page - 1) * limit : 0;
        const lim = typeFilter === "forecast" ? limit : 10;
        const { data, count } = await admin
          .from("mundane_forecasts")
          .select("id, title, narrative_summary, outcome_status, confidence_level, forecast_period_start", { count: "exact" })
          .or(`title.ilike.${pattern},narrative_summary.ilike.${pattern}`)
          .order("forecast_period_start", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + lim - 1);
        return {
          type: "forecast",
          total: count ?? 0,
          results: (data ?? []).map((f: { id: string; title: string; narrative_summary: string | null; outcome_status: string; confidence_level: string | null; forecast_period_start: string }) => ({
            id: f.id,
            type: "forecast" as const,
            title: f.title,
            snippet: `${f.outcome_status} - ${f.forecast_period_start}${f.narrative_summary ? ": " + f.narrative_summary.slice(0, 80) : ""}`,
            href: `/admin/mundane-forecasts/${f.id}`,
          })),
        };
      })()
    );
  }

  const settled = await Promise.all(promises);

  const counts: Record<string, number> = { all: 0, entity: 0, leader: 0, event: 0, forecast: 0 };
  let allResults: SearchResult[] = [];

  for (const res of settled) {
    counts[res.type] = res.total;
    counts.all += res.total;
    allResults = allResults.concat(res.results);
  }

  // If "all" type, just return merged (already limited per-type). If specific, results are already paginated.
  return NextResponse.json({
    results: allResults,
    counts,
    page,
    limit,
  });
}
