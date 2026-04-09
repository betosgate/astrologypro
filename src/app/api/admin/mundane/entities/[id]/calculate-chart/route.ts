import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type MundaneEntityRow = {
  id: string;
  name: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_lat: number | null;
  birth_lon: number | null;
};

// POST /api/admin/mundane/entities/[id]/calculate-chart
// Calls the Astro AI API to calculate and cache the natal chart for a mundane entity.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      {
        type: "/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Admin access required.",
      },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch entity
  const { data: entity, error: fetchError } = await admin
    .from("mundane_entities_v2")
    .select("id, name, birth_date, birth_time, birth_lat, birth_lon")
    .eq("id", id)
    .single<MundaneEntityRow>();

  if (fetchError || !entity) {
    return NextResponse.json(
      {
        type: "/errors/not-found",
        title: "Not Found",
        status: 404,
        detail: "Mundane entity not found.",
      },
      { status: 404 }
    );
  }

  // Validate required birth data
  if (
    !entity.birth_date ||
    !entity.birth_time ||
    entity.birth_lat == null ||
    entity.birth_lon == null
  ) {
    return NextResponse.json(
      {
        type: "/errors/incomplete-birth-data",
        title: "Incomplete Birth Data",
        status: 422,
        detail:
          "Entity must have birth_date, birth_time, birth_lat, and birth_lon to calculate a chart.",
      },
      { status: 422 }
    );
  }

  // Check Astro AI API URL from the centralised config API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const configRes = await fetch(`${baseUrl}/api/astro/fetch-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keys: ["ASTRO_AI_API_URL"] }),
  });
  const config = await configRes.json().catch(() => ({}));
  const astroApiUrl = config?.ASTRO_AI_API_URL;

  if (!astroApiUrl) {
    return NextResponse.json(
      {
        type: "/errors/chart-api-unavailable",
        title: "Chart API Unavailable",
        status: 503,
        detail: "Astro AI API not configured or unreachable.",
      },
      { status: 503 }
    );
  }

  // Call Astro AI natal-chart endpoint
  let chartData: Record<string, unknown>;
  try {
    const response = await fetch(`${astroApiUrl}/natal-chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: entity.birth_date,
        time: entity.birth_time,
        lat: entity.birth_lat,
        lng: entity.birth_lon,
        name: entity.name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[calculate-chart] Astro AI returned ${response.status}: ${errorText}`
      );
      return NextResponse.json(
        {
          type: "/errors/chart-api-unavailable",
          title: "Chart API Unavailable",
          status: 503,
          detail: "Astro AI API not configured or unreachable.",
        },
        { status: 503 }
      );
    }

    chartData = (await response.json()) as Record<string, unknown>;
  } catch (err) {
    console.error("[calculate-chart] Failed to reach Astro AI API:", err);
    return NextResponse.json(
      {
        type: "/errors/chart-api-unavailable",
        title: "Chart API Unavailable",
        status: 503,
        detail: "Astro AI API not configured or unreachable.",
      },
      { status: 503 }
    );
  }

  // Store chart data in entity row
  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("mundane_entities_v2")
    .update({
      natal_chart_data: chartData,
      chart_calculated_at: now,
      updated_at: now,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      {
        type: "/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ calculated: true, entity_id: id }, { status: 200 });
}
