import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mundane/chart-studio?chart_id=...
 * Returns full chart data (metadata + planet positions if available) for the chart studio.
 *
 * Also supports: ?entity_id=... to list all charts for an entity.
 */
export async function GET(req: NextRequest) {
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

  const sp = req.nextUrl.searchParams;
  const chartId = sp.get("chart_id");
  const entityId = sp.get("entity_id");

  const admin = createAdminClient();

  // If chart_id is provided, return that specific chart with entity data
  if (chartId) {
    const { data: chart, error: chartError } = await admin
      .from("mundane_entity_charts")
      .select("*")
      .eq("id", chartId)
      .single();

    if (chartError || !chart) {
      return NextResponse.json(
        {
          type: "/errors/not-found",
          title: "Not Found",
          status: 404,
          detail: "Chart not found.",
        },
        { status: 404 }
      );
    }

    // Fetch the parent entity
    const { data: entity } = await admin
      .from("mundane_entities")
      .select("id, name, entity_type, region, flag_emoji, natal_chart_data")
      .eq("id", chart.entity_id)
      .single();

    return NextResponse.json({ chart, entity: entity ?? null });
  }

  // If entity_id is provided, list charts for that entity
  if (entityId) {
    const { data: charts, error: chartsError } = await admin
      .from("mundane_entity_charts")
      .select("id, chart_title, chart_type, event_date, event_time, is_primary")
      .eq("entity_id", entityId)
      .order("event_date", { ascending: false })
      .order("id", { ascending: false });

    if (chartsError) {
      return NextResponse.json(
        {
          type: "/errors/internal",
          title: "Internal Server Error",
          status: 500,
          detail: chartsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ charts: charts ?? [] });
  }

  return NextResponse.json(
    {
      type: "/errors/bad-request",
      title: "Bad Request",
      status: 400,
      detail: "Provide chart_id or entity_id query parameter.",
    },
    { status: 400 }
  );
}
