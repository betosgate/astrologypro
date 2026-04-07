import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mundane/world-map
 * Returns entities (with lat/lng), recent events, and active forecasts
 * for the world-map intelligence view.
 */
export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // 1. Entities with non-null geographic coordinates
  const { data: rawEntities, error: entErr } = await admin
    .from("mundane_entities_v2")
    .select("id, name, entity_type, region, flag_emoji, latitude, longitude, is_active")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (entErr) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: entErr.message },
      { status: 500 }
    );
  }

  // 2. Recent events (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFrom = ninetyDaysAgo.toISOString().split("T")[0];

  const { data: rawEvents, error: evtErr } = await admin
    .from("mundane_events")
    .select("id, title, event_type, event_date, location, primary_entity_id, is_forecast, forecast_confidence, tags")
    .gte("event_date", dateFrom)
    .order("event_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);

  if (evtErr) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: evtErr.message },
      { status: 500 }
    );
  }

  // 3. Active forecasts (forecast window covers current date)
  const today = new Date().toISOString().split("T")[0];

  const { data: rawForecasts, error: fcErr } = await admin
    .from("mundane_forecasts")
    .select("id, title, entity_id, confidence_level, outcome_status, forecast_period_start, forecast_period_end, event_categories")
    .lte("forecast_period_start", today)
    .gte("forecast_period_end", today)
    .order("forecast_period_start", { ascending: false })
    .order("id", { ascending: false })
    .limit(200);

  if (fcErr) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: fcErr.message },
      { status: 500 }
    );
  }

  // 4. Count active forecasts per entity
  const forecastCountMap: Record<string, number> = {};
  for (const f of rawForecasts ?? []) {
    if (f.entity_id) {
      forecastCountMap[f.entity_id] = (forecastCountMap[f.entity_id] ?? 0) + 1;
    }
  }

  // Build entity lookup for event geo-resolution
  const entityGeoMap: Record<string, { latitude: number; longitude: number }> = {};
  const entities = (rawEntities ?? []).map((e) => {
    entityGeoMap[e.id] = { latitude: e.latitude, longitude: e.longitude };
    return {
      id: e.id,
      name: e.name,
      entity_type: e.entity_type,
      region: e.region,
      flag_emoji: e.flag_emoji,
      latitude: e.latitude as number,
      longitude: e.longitude as number,
      forecast_count: forecastCountMap[e.id] ?? 0,
    };
  });

  // Events: resolve lat/lng from linked entity when available
  const events = (rawEvents ?? [])
    .map((ev) => {
      const geo = ev.primary_entity_id ? entityGeoMap[ev.primary_entity_id] : null;
      if (!geo) return null; // skip events without geo-resolvable entity
      return {
        id: ev.id,
        title: ev.title,
        event_type: ev.event_type,
        event_date: ev.event_date,
        location: ev.location,
        severity: ev.forecast_confidence ?? "low", // use confidence as severity proxy
        category: ev.event_type,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    })
    .filter(Boolean);

  const forecasts = (rawForecasts ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    entity_id: f.entity_id,
    confidence_level: f.confidence_level,
    outcome_status: f.outcome_status,
  }));

  return NextResponse.json({ entities, events, forecasts });
}
