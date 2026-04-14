import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// RFC 4122 UUID v4 regex
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "id must be a valid UUID" },
      { status: 422 }
    );
  }

  const admin = createAdminClient();
  const { data: event, error } = await admin
    .from("mundane_astro_events")
    .select("*, mundane_entities(id, name, flag_emoji, entity_type)")
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Astro event not found" },
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
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation Error", status: 422, detail: "id must be a valid UUID" },
      { status: 422 }
    );
  }

  const body = await req.json() as {
    linked_entity_id?: string | null;
    notes?: string | null;
    is_verified?: boolean;
  };

  // Validate linked_entity_id if provided (not null)
  if (body.linked_entity_id !== undefined && body.linked_entity_id !== null) {
    if (!UUID_RE.test(body.linked_entity_id)) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Validation Error",
          status: 422,
          detail: "linked_entity_id must be a valid UUID or null",
        },
        { status: 422 }
      );
    }
  }

  const admin = createAdminClient();

  // Verify event exists
  const { data: existing, error: findError } = await admin
    .from("mundane_astro_events")
    .select("id")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/404", title: "Not Found", status: 404, detail: "Astro event not found" },
      { status: 404 }
    );
  }

  // If linked_entity_id is provided (non-null), verify entity exists
  if (body.linked_entity_id) {
    const { data: entity, error: entityError } = await admin
      .from("mundane_entities")
      .select("id")
      .eq("id", body.linked_entity_id)
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        {
          type: "https://httpstatuses.com/422",
          title: "Validation Error",
          status: 422,
          detail: "linked_entity_id does not reference a valid entity",
        },
        { status: 422 }
      );
    }
  }

  // Build update payload — only include fields present in body
  const updatePayload: Record<string, unknown> = {};
  if ("linked_entity_id" in body) updatePayload.linked_entity_id = body.linked_entity_id ?? null;
  if ("notes" in body) updatePayload.notes = body.notes ?? null;
  if ("is_verified" in body) updatePayload.is_verified = body.is_verified;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      {
        type: "https://httpstatuses.com/422",
        title: "Validation Error",
        status: 422,
        detail: "No updatable fields provided. Send at least one of: linked_entity_id, notes, is_verified",
      },
      { status: 422 }
    );
  }

  const { data, error } = await admin
    .from("mundane_astro_events")
    .update(updatePayload)
    .eq("id", id)
    .select("*, mundane_entities(id, name, flag_emoji, entity_type)")
    .single();

  if (error) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Internal Server Error", status: 500, detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
