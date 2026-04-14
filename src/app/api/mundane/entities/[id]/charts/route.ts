import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_CHART_TYPES = [
  "independence", "constitution", "ingress", "lunation",
  "eclipse", "transit", "event", "other",
] as const;

/**
 * POST /api/mundane/entities/:id/charts
 * Add a chart record to an entity. Authenticated users only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id: entityId } = await params;
  const admin = createAdminClient();

  // Verify entity exists
  const { data: entity } = await admin
    .from("mundane_entities")
    .select("id")
    .eq("id", entityId)
    .eq("is_active", true)
    .single();

  if (!entity) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Entity not found" },
      { status: 404 }
    );
  }

  const body = await req.json() as {
    chart_title?: string;
    chart_type?: string;
    event_date?: string;
    event_time?: string | null;
    timezone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    chart_url?: string | null;
    is_primary?: boolean;
  };

  if (!body.chart_title?.trim()) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "chart_title is required" },
      { status: 422 }
    );
  }
  if (!body.event_date) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "event_date is required" },
      { status: 422 }
    );
  }
  if (!body.chart_type || !(VALID_CHART_TYPES as readonly string[]).includes(body.chart_type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: `chart_type must be one of: ${VALID_CHART_TYPES.join(", ")}` },
      { status: 422 }
    );
  }

  // If this is being set as primary, clear existing primary flag first
  if (body.is_primary) {
    await admin
      .from("mundane_entity_charts")
      .update({ is_primary: false })
      .eq("entity_id", entityId)
      .eq("is_primary", true);
  }

  const { data, error } = await admin
    .from("mundane_entity_charts")
    .insert({
      entity_id: entityId,
      chart_title: body.chart_title.trim(),
      chart_type: body.chart_type,
      event_date: body.event_date,
      event_time: body.event_time ?? null,
      timezone: body.timezone ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      notes: body.notes ?? null,
      chart_url: body.chart_url ?? null,
      is_primary: body.is_primary ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}
