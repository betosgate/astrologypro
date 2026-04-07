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

  const { data: event, error } = await admin
    .from("mundane_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Event not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ event });
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
    event_type: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
    primary_entity_id: string | null;
    is_forecast: boolean;
    forecast_confidence: string | null;
    astrological_factors: Record<string, unknown> | null;
    outcome_verified: boolean | null;
    outcome_notes: string | null;
    source: string | null;
    tags: string[];
    is_public: boolean;
  }>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_events")
    .update({ ...body, updated_at: new Date().toISOString() })
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
