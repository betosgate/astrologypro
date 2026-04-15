import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEclipticLongitude, PLANETS, type Planet } from "@/lib/ephemeris";

export const dynamic = "force-dynamic";

// RFC 4122 UUID v4 regex
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ISO-8601 datetime regex (basic)
const ISO_RE = /^\d{4}-\d{2}-\d{2}(T[\d:+\-.Z]+)?$/;

const ORB_DEGREES = 3;

type NatalPlanet = {
  planet: string;
  longitude: number; // 0–360°
};

type PlanetHit = {
  natal_planet: string;
  event_planet: string;
  orb: number;
  aspect_type: "conjunction"; // currently only conjunction (within ORB_DEGREES)
};

type HitResult = {
  event_id: string;
  planet_hits: PlanetHit[];
};

/** Angular distance in 0–180 range */
function orbBetween(a: number, b: number): number {
  const diff = Math.abs(((a - b + 360) % 360));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Extract natal planet longitudes from the entity's natal_chart_data JSONB.
 * The JSONB shape can vary (set by external calc tools), so we try common shapes:
 *   { planets: { sun: { longitude: 123.4 }, ... } }
 *   { sun: { longitude: 123.4 }, ... }
 *   { planets: [{ name: "sun", longitude: 123.4 }, ...] }
 */
function extractNatalPositions(
  natalChartData: Record<string, unknown> | null
): NatalPlanet[] {
  if (!natalChartData || typeof natalChartData !== "object") return [];

  const result: NatalPlanet[] = [];

  // Shape A: { planets: { sun: { longitude: 123 }, moon: { longitude: 45 } } }
  const planets = natalChartData.planets;
  if (planets && typeof planets === "object" && !Array.isArray(planets)) {
    for (const [name, val] of Object.entries(planets as Record<string, unknown>)) {
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const v = val as Record<string, unknown>;
        const lon = typeof v.longitude === "number" ? v.longitude
          : typeof v.lon === "number" ? v.lon
          : typeof v.degree === "number" ? v.degree
          : null;
        if (lon !== null) result.push({ planet: name.toLowerCase(), longitude: lon });
      }
    }
    if (result.length > 0) return result;
  }

  // Shape B: { planets: [{ name: "sun", longitude: 123 }, ...] }
  if (Array.isArray(planets)) {
    for (const item of planets as unknown[]) {
      if (item && typeof item === "object") {
        const v = item as Record<string, unknown>;
        const name = typeof v.name === "string" ? v.name.toLowerCase()
          : typeof v.planet === "string" ? v.planet.toLowerCase()
          : null;
        const lon = typeof v.longitude === "number" ? v.longitude
          : typeof v.lon === "number" ? v.lon
          : typeof v.degree === "number" ? v.degree
          : null;
        if (name && lon !== null) result.push({ planet: name, longitude: lon });
      }
    }
    if (result.length > 0) return result;
  }

  // Shape C: top-level keys are planet names { sun: { longitude: 123 } }
  for (const [name, val] of Object.entries(natalChartData)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      const lon = typeof v.longitude === "number" ? v.longitude
        : typeof v.lon === "number" ? v.lon
        : typeof v.degree === "number" ? v.degree
        : null;
      if (lon !== null && PLANETS.includes(name.toLowerCase() as Planet)) {
        result.push({ planet: name.toLowerCase(), longitude: lon });
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  // Auth
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  // Parse body
  let body: { entity_id?: unknown; from?: unknown; to?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "Request body must be valid JSON" },
      { status: 422 }
    );
  }

  // Validate entity_id
  if (!body.entity_id || typeof body.entity_id !== "string" || !UUID_RE.test(body.entity_id)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "entity_id must be a valid UUID" },
      { status: 422 }
    );
  }

  // Validate from / to
  if (!body.from || typeof body.from !== "string" || !ISO_RE.test(body.from)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "from must be a valid ISO-8601 date string" },
      { status: 422 }
    );
  }
  if (!body.to || typeof body.to !== "string" || !ISO_RE.test(body.to)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "to must be a valid ISO-8601 date string" },
      { status: 422 }
    );
  }

  const entityId = body.entity_id;
  const from = body.from;
  const to = body.to;

  const admin = createAdminClient();

  // Fetch entity natal chart data — try mundane_entities first, then mundane_entities_v2
  const [entitiesRes, entitiesV2Res] = await Promise.all([
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

  const entityData =
    (entitiesRes.data?.natal_chart_data
      ? entitiesRes.data
      : entitiesV2Res.data) ?? null;

  if (!entityData) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity not found" },
      { status: 404 }
    );
  }

  const natalPositions = extractNatalPositions(
    entityData.natal_chart_data as Record<string, unknown> | null
  );

  // If no natal positions stored, return empty hits
  if (natalPositions.length === 0) {
    return NextResponse.json({ hits: [], natal_positions_available: false });
  }

  // Fetch astro events in date range
  const { data: events, error: eventsError } = await admin
    .from("mundane_astro_events")
    .select("id, event_type, planet_primary, planet_secondary, sign, event_datetime_utc")
    .gte("event_datetime_utc", from)
    .lte("event_datetime_utc", to)
    .order("event_datetime_utc", { ascending: true })
    .order("id", { ascending: true });

  if (eventsError) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/500",
        title: "Internal Server Error",
        status: 500,
        detail: eventsError.message,
      },
      { status: 500 }
    );
  }

  // For each event, compute transiting planet longitudes and check orb against natal points
  const hits: HitResult[] = [];

  for (const ev of events ?? []) {
    const eventDate = new Date(ev.event_datetime_utc);
    const planet_hits: PlanetHit[] = [];

    // Determine which planets are involved in this event
    const involvedPlanets: string[] = [];
    if (ev.planet_primary) involvedPlanets.push(ev.planet_primary.toLowerCase());
    if (ev.planet_secondary) involvedPlanets.push(ev.planet_secondary.toLowerCase());

    // If no planets stored, use all to check sky positions
    const planetsToCheck: Planet[] =
      involvedPlanets.length > 0
        ? (involvedPlanets.filter((p) => PLANETS.includes(p as Planet)) as Planet[])
        : [...PLANETS];

    // Get event planet longitudes
    for (const evPlanet of planetsToCheck) {
      let evLon: number;
      try {
        evLon = getEclipticLongitude(evPlanet, eventDate);
      } catch {
        continue;
      }

      // Check against all natal positions
      for (const natal of natalPositions) {
        const orb = orbBetween(evLon, natal.longitude);
        if (orb <= ORB_DEGREES) {
          planet_hits.push({
            natal_planet: natal.planet,
            event_planet: evPlanet,
            orb: Math.round(orb * 100) / 100,
            aspect_type: "conjunction",
          });
        }
      }
    }

    if (planet_hits.length > 0) {
      hits.push({ event_id: ev.id, planet_hits });
    }
  }

  return NextResponse.json({ hits, natal_positions_available: true });
}
