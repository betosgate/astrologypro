import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    .from("mundane_forecasts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Forecast not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
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
  const body = await req.json() as Partial<{
    title: string;
    entity_id: string | null;
    leader_id: string | null;
    forecast_period_start: string;
    forecast_period_end: string | null;
    astrology_basis: string;
    narrative_summary: string;
    event_categories: string[];
    confidence_level: string | null;
    outcome_status: string;
    outcome_notes: string | null;
    outcome_reviewed_at: string | null;
    is_public: boolean;
  }>;

  const VALID_OUTCOME_STATUS = ["open", "confirmed", "partially_confirmed", "invalidated", "expired"] as const;
  if (
    body.outcome_status &&
    !(VALID_OUTCOME_STATUS as readonly string[]).includes(body.outcome_status)
  ) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "outcome_status is invalid" },
      { status: 422 }
    );
  }

  // If outcome_status is being updated, auto-set outcome_reviewed_at
  const patch: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  if (body.outcome_status && body.outcome_status !== "open" && !body.outcome_reviewed_at) {
    patch.outcome_reviewed_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_forecasts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
