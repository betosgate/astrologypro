import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SaveBody = {
  saved_to_type: string;
  saved_to_id?: string;
  apply_to_field?: string; // 'narrative_summary' | 'notes' etc.
};

// Known apply_to_field targets — maps saved_to_type -> table + field
const APPLY_MAP: Record<string, { table: string; field: string; id_column: string }> = {
  forecast_narrative: { table: "mundane_forecasts", field: "narrative_summary", id_column: "id" },
  entity_notes: { table: "mundane_entities", field: "notes", id_column: "id" },
};

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

  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "Invalid JSON body" },
      { status: 422 }
    );
  }

  const { saved_to_type, saved_to_id, apply_to_field } = body;

  if (!saved_to_type || typeof saved_to_type !== "string") {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "saved_to_type is required" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Load generation — enforce ownership
  const { data: gen, error: fetchError } = await admin
    .from("mundane_ai_generations")
    .select("id, user_id, response, is_saved")
    .eq("id", id)
    .single();

  if (fetchError || !gen) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Generation not found" },
      { status: 404 }
    );
  }

  if (gen.user_id !== user.id) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/403", title: "Forbidden", status: 403 },
      { status: 403 }
    );
  }

  // Mark as saved
  const { data: updated, error: updateError } = await admin
    .from("mundane_ai_generations")
    .update({
      is_saved: true,
      saved_to_type,
      saved_to_id: saved_to_id ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: updateError?.message },
      { status: 500 }
    );
  }

  // Apply to target field if requested
  if (apply_to_field && saved_to_id) {
    const target = APPLY_MAP[saved_to_type];
    if (target) {
      if (target.table === "mundane_forecasts") {
        await admin
          .from("mundane_forecasts")
          .update({ narrative_summary: gen.response })
          .eq("id", saved_to_id);
      } else if (target.table === "mundane_entities") {
        await admin
          .from("mundane_entities")
          .update({ notes: gen.response })
          .eq("id", saved_to_id);
      }
    }
  }

  return NextResponse.json(updated);
}
