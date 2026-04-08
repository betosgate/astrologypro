import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/notes?entity_type=...&entity_id=...
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const entity_type = sp.get("entity_type");
  const entity_id = sp.get("entity_id");

  if (!entity_type || !entity_id) {
    return NextResponse.json(
      { error: "entity_type and entity_id are required." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_notes")
    .select("id, entity_type, entity_id, content, created_by, created_at")
    .eq("entity_type", entity_type)
    .eq("entity_id", entity_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}

// POST /api/admin/training/notes
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    entity_type?: string;
    entity_id?: string;
    content?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { entity_type, entity_id, content } = body;

  if (!entity_type || typeof entity_type !== "string" || !entity_type.trim()) {
    return NextResponse.json({ error: "entity_type is required." }, { status: 400 });
  }
  if (!entity_id || typeof entity_id !== "string" || !entity_id.trim()) {
    return NextResponse.json({ error: "entity_id is required." }, { status: 400 });
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("training_notes")
    .insert({
      entity_type: entity_type.trim(),
      entity_id: entity_id.trim(),
      content: content.trim(),
      created_by: user.email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
