import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Globe, Loader2 } from "lucide-react";
import { WorldMapWrapper } from "@/components/mundane/world-map-wrapper";

export const dynamic = "force-dynamic";

export default async function WorldMapPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateFrom = ninetyDaysAgo.toISOString().split("T")[0];

  // Parallel fetches
  const [entitiesRes, eventsRes, forecastsRes] = await Promise.all([
    // 1. Entities with coordinates
    admin
      .from("mundane_entities_v2")
      .select("id, name, entity_type, region, flag_emoji, latitude, longitude, is_active")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .order("id", { ascending: true }),

    // 2. Recent events (90 days)
    admin
      .from("mundane_events")
      .select("id, title, event_type, event_date, location, primary_entity_id, forecast_confidence")
      .gte("event_date", dateFrom)
      .order("event_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(200),

    // 3. Active forecasts
    admin
      .from("mundane_forecasts")
      .select("id, title, entity_id, confidence_level, outcome_status")
      .lte("forecast_period_start", today)
      .gte("forecast_period_end", today)
      .order("forecast_period_start", { ascending: false })
      .order("id", { ascending: false })
      .limit(200),
  ]);

  const rawEntities = entitiesRes.data ?? [];
  const rawEvents = eventsRes.data ?? [];
  const rawForecasts = forecastsRes.data ?? [];

  // Count forecasts per entity
  const forecastCountMap: Record<string, number> = {};
  for (const f of rawForecasts) {
    if (f.entity_id) {
      forecastCountMap[f.entity_id] = (forecastCountMap[f.entity_id] ?? 0) + 1;
    }
  }

  // Build entity geo-lookup
  const entityGeoMap: Record<string, { latitude: number; longitude: number }> = {};
  const entities = rawEntities.map((e) => {
    entityGeoMap[e.id] = { latitude: e.latitude, longitude: e.longitude };
    return {
      id: e.id as string,
      name: e.name as string,
      entity_type: e.entity_type as string,
      region: e.region as string | null,
      flag_emoji: e.flag_emoji as string | null,
      latitude: e.latitude as number,
      longitude: e.longitude as number,
      forecast_count: forecastCountMap[e.id] ?? 0,
    };
  });

  // Resolve event locations from entity
  const events = rawEvents
    .map((ev) => {
      const geo = ev.primary_entity_id ? entityGeoMap[ev.primary_entity_id] : null;
      if (!geo) return null;
      return {
        id: ev.id as string,
        title: ev.title as string,
        event_type: ev.event_type as string,
        event_date: ev.event_date as string,
        location: ev.location as string | null,
        severity: (ev.forecast_confidence as string) ?? "low",
        category: ev.event_type as string,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    })
    .filter((ev): ev is NonNullable<typeof ev> => ev !== null);

  const forecasts = rawForecasts.map((f) => ({
    id: f.id as string,
    title: f.title as string,
    entity_id: f.entity_id as string,
    confidence_level: f.confidence_level as string,
    outcome_status: f.outcome_status as string,
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Globe className="size-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">World Map Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Geographic overview of mundane entities, events, and active forecasts
          </p>
        </div>
      </div>

      {/* Map client — wrapped for SSR-safe Leaflet loading */}
      <Suspense fallback={<div className="flex h-[600px] items-center justify-center"><Loader2 className="size-8 animate-spin text-amber-500" /><span className="ml-3 text-sm text-muted-foreground">Loading map...</span></div>}>
        <WorldMapWrapper
          entities={entities}
          events={events}
          forecasts={forecasts}
        />
      </Suspense>
    </div>
  );
}
