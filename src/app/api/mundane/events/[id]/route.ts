import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: event, error } = await admin
    .from("mundane_events")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    primary_entity_id: string;
    is_forecast: boolean;
    forecast_confidence: string;
    outcome_verified: boolean;
    outcome_notes: string;
    tags: string[];
    is_public: boolean;
  }>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mundane_events")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("created_by", user.id)
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
