import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Globe, CalendarDays, Star } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEclipticLongitude, PLANETS, type Planet } from "@/lib/ephemeris";
import { TimelineFilters } from "./TimelineFilters";

export const dynamic = "force-dynamic";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AstroEvent = {
  id: string;
  title: string;
  event_type: string;
  planet_primary: string | null;
  planet_secondary: string | null;
  sign: string | null;
  event_datetime_utc: string;
  notes: string | null;
  is_verified: boolean;
};

type Entity = {
  id: string;
  name: string;
  flag_emoji: string | null;
};

type NatalPlanet = {
  planet: string;
  longitude: number;
};

type PlanetHit = {
  natal_planet: string;
  event_planet: string;
  orb: number;
};

type MonthGroup = {
  label: string;
  events: AstroEvent[];
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const VALID_EVENT_TYPES = [
  "ingress", "eclipse", "station", "conjunction", "opposition", "lunation", "return",
  "retrograde", "direct", "great_conjunction", "solar_arc", "custom",
] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORB_DEGREES = 3;

// Badge colors per spec
const EVENT_TYPE_COLORS: Record<string, string> = {
  eclipse: "bg-red-100 text-red-700 border-red-200",
  ingress: "bg-violet-100 text-violet-700 border-violet-200",
  station: "bg-amber-100 text-amber-700 border-amber-200",
  retrograde: "bg-amber-100 text-amber-700 border-amber-200",
  direct: "bg-amber-100 text-amber-700 border-amber-200",
  conjunction: "bg-blue-100 text-blue-700 border-blue-200",
  opposition: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-teal-100 text-teal-700 border-teal-200",
  return: "bg-emerald-100 text-emerald-700 border-emerald-200",
  great_conjunction: "bg-blue-100 text-blue-700 border-blue-200",
  solar_arc: "bg-gray-100 text-gray-700 border-gray-200",
  custom: "bg-gray-100 text-gray-700 border-gray-200",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatMonthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDay(iso: string): { weekday: string; day: string } {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: String(d.getUTCDate()),
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function groupByMonth(events: AstroEvent[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const ev of events) {
    const key = monthKey(ev.event_datetime_utc);
    if (!map.has(key)) {
      map.set(key, {
        label: formatMonthLabel(ev.event_datetime_utc),
        events: [],
      });
    }
    map.get(key)!.events.push(ev);
  }
  return [...map.values()];
}

/** Angular distance in 0–180° range */
function orbBetween(a: number, b: number): number {
  const diff = Math.abs(((a - b + 360) % 360));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Extract natal planet longitudes from entity natal_chart_data JSONB.
 * Handles common shapes produced by astrology calculation tools.
 */
function extractNatalPositions(
  natalChartData: Record<string, unknown> | null
): NatalPlanet[] {
  if (!natalChartData || typeof natalChartData !== "object") return [];
  const result: NatalPlanet[] = [];

  // Shape A: { planets: { sun: { longitude: 123 } } }
  const planets = natalChartData.planets;
  if (planets && typeof planets === "object" && !Array.isArray(planets)) {
    for (const [name, val] of Object.entries(planets as Record<string, unknown>)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const v = val as Record<string, unknown>;
        const lon =
          typeof v.longitude === "number" ? v.longitude :
          typeof v.lon === "number" ? v.lon :
          typeof v.degree === "number" ? v.degree : null;
        if (lon !== null) result.push({ planet: name.toLowerCase(), longitude: lon });
      }
    }
    if (result.length > 0) return result;
  }

  // Shape B: { planets: [{ name: "sun", longitude: 123 }] }
  if (Array.isArray(planets)) {
    for (const item of planets as unknown[]) {
      if (item && typeof item === "object") {
        const v = item as Record<string, unknown>;
        const name = typeof v.name === "string" ? v.name.toLowerCase()
          : typeof v.planet === "string" ? v.planet.toLowerCase() : null;
        const lon =
          typeof v.longitude === "number" ? v.longitude :
          typeof v.lon === "number" ? v.lon :
          typeof v.degree === "number" ? v.degree : null;
        if (name && lon !== null) result.push({ planet: name, longitude: lon });
      }
    }
    if (result.length > 0) return result;
  }

  // Shape C: top-level planet keys { sun: { longitude: 123 } }
  for (const [name, val] of Object.entries(natalChartData)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      const lon =
        typeof v.longitude === "number" ? v.longitude :
        typeof v.lon === "number" ? v.lon :
        typeof v.degree === "number" ? v.degree : null;
      if (lon !== null && PLANETS.includes(name.toLowerCase() as Planet)) {
        result.push({ planet: name.toLowerCase(), longitude: lon });
      }
    }
  }

  return result;
}

/**
 * Compute natal hit indicators for a set of events.
 * Uses ephemeris.ts to get transiting planet positions on each event date.
 */
function computeHits(
  events: AstroEvent[],
  natalPositions: NatalPlanet[]
): Map<string, PlanetHit[]> {
  const hitsMap = new Map<string, PlanetHit[]>();
  if (natalPositions.length === 0) return hitsMap;

  for (const ev of events) {
    const eventDate = new Date(ev.event_datetime_utc);
    const hits: PlanetHit[] = [];

    const involvedPlanets: Planet[] = [];
    if (ev.planet_primary) {
      const p = ev.planet_primary.toLowerCase();
      if (PLANETS.includes(p as Planet)) involvedPlanets.push(p as Planet);
    }
    if (ev.planet_secondary) {
      const p = ev.planet_secondary.toLowerCase();
      if (PLANETS.includes(p as Planet)) involvedPlanets.push(p as Planet);
    }

    // If no specific planets recorded, check all
    const planetsToCheck: Planet[] =
      involvedPlanets.length > 0 ? involvedPlanets : [...PLANETS];

    for (const evPlanet of planetsToCheck) {
      let evLon: number;
      try {
        evLon = getEclipticLongitude(evPlanet, eventDate);
      } catch {
        continue;
      }

      for (const natal of natalPositions) {
        const orb = orbBetween(evLon, natal.longitude);
        if (orb <= ORB_DEGREES) {
          hits.push({
            natal_planet: natal.planet,
            event_planet: evPlanet,
            orb: Math.round(orb * 100) / 100,
          });
        }
      }
    }

    if (hits.length > 0) {
      hitsMap.set(ev.id, hits);
    }
  }

  return hitsMap;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // Parse type filters from URL
  const typesParam = typeof sp.types === "string" ? sp.types : "";
  const activeTypes: string[] = typesParam
    ? typesParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => (VALID_EVENT_TYPES as readonly string[]).includes(t))
    : [];

  // Parse optional entity_id
  const rawEntityId = typeof sp.entity_id === "string" ? sp.entity_id : null;
  const entityId =
    rawEntityId && UUID_RE.test(rawEntityId) ? rawEntityId : null;

  const admin = createAdminClient();

  // Date range: NOW() → NOW() + 12 months
  const now = new Date();
  const twelveMonthsOut = new Date(now);
  twelveMonthsOut.setUTCFullYear(twelveMonthsOut.getUTCFullYear() + 1);
  const fromIso = now.toISOString();
  const toIso = twelveMonthsOut.toISOString();

  // Build events query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let eventsQuery: any = admin
    .from("mundane_astro_events")
    .select(
      "id, title, event_type, planet_primary, planet_secondary, sign, event_datetime_utc, notes, is_verified"
    )
    .gte("event_datetime_utc", fromIso)
    .lte("event_datetime_utc", toIso);

  if (activeTypes.length > 0) {
    eventsQuery = eventsQuery.in("event_type", activeTypes);
  }

  eventsQuery = eventsQuery
    .order("event_datetime_utc", { ascending: true })
    .order("id", { ascending: true });

  // Fetch events + entities in parallel
  const [{ data: eventsData, error: eventsError }, { data: entitiesData }] =
    await Promise.all([
      eventsQuery,
      admin
        .from("mundane_entities")
        .select("id, name, flag_emoji")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .order("id", { ascending: true }),
    ]);

  const events: AstroEvent[] = eventsData ?? [];
  const entities: Entity[] = entitiesData ?? [];

  // Compute natal hits if entity selected
  let hitsMap = new Map<string, PlanetHit[]>();
  let natalPositionsAvailable = false;

  if (entityId && events.length > 0) {
    // Try mundane_entities first, then mundane_entities_v2
    const [entRes, entV2Res] = await Promise.all([
      admin
        .from("mundane_entities")
        .select("id, natal_chart_data")
        .eq("id", entityId)
        .maybeSingle(),
      admin
        .from("mundane_entities_v2")
        .select("id, natal_chart_data")
        .eq("id", entityId)
        .maybeSingle(),
    ]);

    const entityRow = entRes.data?.natal_chart_data
      ? entRes.data
      : entV2Res.data ?? null;

    if (entityRow) {
      const natalPositions = extractNatalPositions(
        entityRow.natal_chart_data as Record<string, unknown> | null
      );
      natalPositionsAvailable = natalPositions.length > 0;
      hitsMap = computeHits(events, natalPositions);
    }
  }

  // Group events by month
  const monthGroups = groupByMonth(events);

  // Selected entity for display
  const selectedEntity = entityId
    ? entities.find((e) => e.id === entityId) ?? null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6 text-violet-500" />
            Predictive Timeline
          </h1>
          <p className="text-muted-foreground text-sm">
            Upcoming astrological events — next 12 months
            {selectedEntity
              ? ` · Natal hits for ${selectedEntity.flag_emoji ? selectedEntity.flag_emoji + " " : ""}${selectedEntity.name}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane/event-calendar">
              <CalendarDays className="mr-1.5 size-4" />
              Calendar View
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/mundane">
              <Globe className="mr-1.5 size-4" />
              Mundane Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-3">
        <TimelineFilters
          activeTypes={activeTypes}
          entityId={entityId}
          entities={entities}
        />
      </div>

      {/* No natal data warning */}
      {entityId && !natalPositionsAvailable && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-3 px-4 text-sm text-amber-700">
            No natal chart positions stored for this entity. Natal hit indicators are unavailable.
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {eventsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 text-sm text-red-700">
            Failed to load events: {eventsError.message}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!eventsError && events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Clock className="size-10 text-muted-foreground/40" />
            <p className="font-medium">No upcoming events found</p>
            <p className="text-sm text-muted-foreground">
              {activeTypes.length > 0
                ? "Try clearing some type filters."
                : "No astrological events are seeded for the next 12 months."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline grouped by month */}
      {monthGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          {/* Month heading */}
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide py-1 sticky top-0 bg-background/95 backdrop-blur-sm">
            {group.label}
          </h2>

          {/* Event rows */}
          <div className="space-y-2">
            {group.events.map((ev) => {
              const hits = hitsMap.get(ev.id) ?? [];
              const hasHits = hits.length > 0;
              const { weekday, day } = formatDay(ev.event_datetime_utc);

              return (
                <div
                  key={ev.id}
                  className={`flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm ${
                    hasHits ? "border-violet-300 bg-violet-50/40" : ""
                  }`}
                >
                  {/* Date block */}
                  <div className="shrink-0 w-12 text-center rounded-md border bg-muted/50 py-1.5 px-1">
                    <p className="text-[10px] font-medium text-muted-foreground leading-none uppercase">
                      {weekday}
                    </p>
                    <p className="text-xl font-bold leading-tight mt-0.5">{day}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-sm">{ev.title}</p>
                      {hasHits && (
                        <span
                          title={`Natal hits: ${hits.map((h) => `${h.event_planet} ↔ natal ${h.natal_planet} (${h.orb}°)`).join(", ")}`}
                          className="inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-300 text-violet-700 text-[10px] font-semibold px-1.5 py-0.5"
                        >
                          <Star className="size-2.5" />
                          natal hit
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(ev.event_datetime_utc)} UTC
                      </span>
                      {(ev.planet_primary || ev.planet_secondary) && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {[ev.planet_primary, ev.planet_secondary]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      )}
                      {ev.sign && (
                        <span className="text-xs text-muted-foreground capitalize">
                          in {ev.sign}
                        </span>
                      )}
                    </div>

                    {/* Natal hit detail chips */}
                    {hasHits && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {hits.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] rounded border border-violet-200 bg-white text-violet-700 px-1.5 py-0.5"
                          >
                            {h.event_planet} ∥ natal {h.natal_planet} ({h.orb}°)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Event type badge — right-aligned */}
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize shrink-0 self-start ${
                      EVENT_TYPE_COLORS[ev.event_type] ??
                      "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {ev.event_type.replace(/_/g, " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Summary footer */}
      {events.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-4">
          {events.length} event{events.length !== 1 ? "s" : ""} across{" "}
          {monthGroups.length} month{monthGroups.length !== 1 ? "s" : ""}
          {activeTypes.length > 0
            ? ` · filtered by: ${activeTypes.join(", ")}`
            : ""}
        </p>
      )}
    </div>
  );
}
