import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_EVIDENCE_TYPES = ["chart", "transit", "eclipse", "ingress", "note", "other"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("forecast_evidence")
    .select("id, evidence_type, note, chart_calc_id, astro_event_id, entity_id, added_by, created_at")
    .eq("forecast_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ evidence: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/401", title: "Unauthorized", status: 401 },
      { status: 401 }
    );
  }

  const { id } = await params;

  const body = await req.json() as {
    evidence_type?: string;
    note?: string;
    chart_calc_id?: string | null;
    astro_event_id?: string | null;
    entity_id?: string | null;
  };

  const evidenceType = body.evidence_type ?? "note";
  if (!(VALID_EVIDENCE_TYPES as readonly string[]).includes(evidenceType)) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: `evidence_type must be one of: ${VALID_EVIDENCE_TYPES.join(", ")}`,
      },
      { status: 422 }
    );
  }

  // Verify forecast exists before inserting
  const admin = createAdminClient();
  const { data: forecast, error: forecastErr } = await admin
    .from("mundane_forecasts")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (forecastErr || !forecast) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Forecast not found" },
      { status: 404 }
    );
  }

  const { data, error } = await admin
    .from("forecast_evidence")
    .insert({
      forecast_id: id,
      evidence_type: evidenceType,
      note: body.note?.trim() ?? null,
      chart_calc_id: body.chart_calc_id ?? null,
      astro_event_id: body.astro_event_id ?? null,
      entity_id: body.entity_id ?? null,
      added_by: user.id,
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
