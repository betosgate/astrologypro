import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STEP_TYPES = new Set(["invocation", "gate", "instruction", "affirmation", "closing"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.content === "string") {
    const content = body.content.trim();
    if (!content) {
      return NextResponse.json({ error: "content cannot be empty" }, { status: 422 });
    }
    patch.content = content;
  }
  if (typeof body.step_type === "string") {
    if (!STEP_TYPES.has(body.step_type)) {
      return NextResponse.json({ error: "Invalid step_type" }, { status: 422 });
    }
    patch.step_type = body.step_type;
  }
  if (typeof body.is_published === "boolean") {
    patch.is_published = body.is_published;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields supplied" }, { status: 422 });
  }
  patch.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("decan_rituals")
    .update(patch)
    .eq("id", id)
    .select("id, step_order, step_type, content, is_published, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update ritual step" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ritual: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("decan_rituals").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
