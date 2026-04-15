import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateSynastry } from "@/lib/astro/synastry";
import type { NatalChartData } from "@/lib/astro/natal-chart";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  let body: { entity_a_id?: string; entity_b_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/400", title: "Bad Request", status: 400, detail: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { entity_a_id, entity_b_id } = body;

  if (!entity_a_id || !entity_b_id) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: "entity_a_id and entity_b_id are required",
      },
      { status: 422 }
    );
  }

  if (entity_a_id === entity_b_id) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: "entity_a_id and entity_b_id must be different",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Fetch both entities including their cached natal_chart_data in parallel
  const [resA, resB] = await Promise.all([
    admin
      .from("mundane_entities")
      .select("id, name, natal_chart_data")
      .eq("id", entity_a_id)
      .single(),
    admin
      .from("mundane_entities")
      .select("id, name, natal_chart_data")
      .eq("id", entity_b_id)
      .single(),
  ]);

  if (resA.error || !resA.data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity A not found" },
      { status: 404 }
    );
  }
  if (resB.error || !resB.data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity B not found" },
      { status: 404 }
    );
  }

  const entityA = resA.data as { id: string; name: string; natal_chart_data: unknown };
  const entityB = resB.data as { id: string; name: string; natal_chart_data: unknown };

  if (!entityA.natal_chart_data) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "No Chart Data",
        status: 422,
        detail: `Entity A (${entityA.name}) has no natal chart data. Calculate the chart first.`,
      },
      { status: 422 }
    );
  }
  if (!entityB.natal_chart_data) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "No Chart Data",
        status: 422,
        detail: `Entity B (${entityB.name}) has no natal chart data. Calculate the chart first.`,
      },
      { status: 422 }
    );
  }

  const natalA = entityA.natal_chart_data as NatalChartData;
  const natalB = entityB.natal_chart_data as NatalChartData;

  const synastry = calculateSynastry(natalA, natalB, entityA.name, entityB.name);

  // Compute composite midpoints (midpoint method, handling 0°/360° boundary)
  const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];

  const compositePlanets = (natalA.planets ?? []).map((pA) => {
    const pB = (natalB.planets ?? []).find((p) => p.name === pA.name);
    if (!pB) return null;

    // Shorter-arc midpoint
    let lonA = pA.longitude;
    let lonB = pB.longitude;
    if (Math.abs(lonA - lonB) > 180) {
      if (lonA < lonB) lonA += 360;
      else lonB += 360;
    }
    const midLon = ((lonA + lonB) / 2) % 360;
    const signIndex = Math.floor(midLon / 30);

    return {
      name: pA.name,
      longitude: Math.round(midLon * 100) / 100,
      sign: ZODIAC_SIGNS[signIndex] ?? "Unknown",
      degree: Math.round((midLon % 30) * 100) / 100,
    };
  }).filter(Boolean);

  return NextResponse.json({
    entity_a: { id: entityA.id, name: entityA.name },
    entity_b: { id: entityB.id, name: entityB.name },
    synastry,
    composite: { planets: compositePlanets },
  });
}
