import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403, detail: "Admin access required" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFrom = thirtyDaysAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch most recent stress score per entity within last 30 days
  const { data: scores, error: scoresError } = await admin
    .from("entity_stress_scores")
    .select("entity_id, stress_score, score_date")
    .gte("score_date", dateFrom)
    .lte("score_date", today)
    .order("score_date", { ascending: false })
    .order("entity_id", { ascending: true });

  if (scoresError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: scoresError.message },
      { status: 500 }
    );
  }

  // Dedupe: keep the most recent score per entity
  const latestScoreMap = new Map<string, { stress_score: number; score_date: string }>();
  for (const s of scores ?? []) {
    if (!latestScoreMap.has(s.entity_id)) {
      latestScoreMap.set(s.entity_id, { stress_score: s.stress_score, score_date: s.score_date });
    }
  }

  // 2. Fetch entities with coordinates
  const { data: entities, error: entitiesError } = await admin
    .from("mundane_entities_v2")
    .select("id, name, flag_emoji, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (entitiesError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: entitiesError.message },
      { status: 500 }
    );
  }

  const entityIds = (entities ?? []).map((e) => e.id as string);

  // 3. For entities without a stress score, compute a simple score from recent astro events
  const entitiesWithoutScore = entityIds.filter((id) => !latestScoreMap.has(id));

  if (entitiesWithoutScore.length > 0) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAhead = new Date();
    fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);

    const eventFrom = fourteenDaysAgo.toISOString().split("T")[0];
    const eventTo = fourteenDaysAhead.toISOString().split("T")[0];

    const { data: events } = await admin
      .from("mundane_events")
      .select("primary_entity_id")
      .in("primary_entity_id", entitiesWithoutScore)
      .gte("event_date", eventFrom)
      .lte("event_date", eventTo);

    // Count events per entity, cap at 10
    const eventCountMap = new Map<string, number>();
    for (const ev of events ?? []) {
      if (ev.primary_entity_id) {
        eventCountMap.set(ev.primary_entity_id, (eventCountMap.get(ev.primary_entity_id) ?? 0) + 1);
      }
    }

    for (const [entityId, count] of eventCountMap) {
      latestScoreMap.set(entityId, {
        stress_score: Math.min(10, count),
        score_date: today,
      });
    }
  }

  // 4. Build response — only include entities that have a score
  const signals = (entities ?? [])
    .map((e) => {
      const scoreEntry = latestScoreMap.get(e.id as string);
      if (!scoreEntry) return null;
      return {
        entity_id: e.id as string,
        name: e.name as string,
        flag_emoji: (e.flag_emoji as string | null) ?? null,
        lat: e.latitude as number,
        lng: e.longitude as number,
        score: scoreEntry.stress_score,
        score_date: scoreEntry.score_date,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return NextResponse.json({ signals });
}
