import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/ritual-builder/[id]
 * Returns a single personal ritual (must belong to the authenticated student).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const { student } = result;
  const typedStudent = student as unknown as { graduated_at?: string | null };
  if (!typedStudent.graduated_at) {
    return NextResponse.json({ error: "Post-graduation access required" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personal_rituals")
    .select(
      "id, name, ritual_type, tags, components, notes, is_shared_with_admin, shared_at, created_at, updated_at"
    )
    .eq("id", id)
    .eq("student_id", student.id) // object-level authorization
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Ritual not found" }, { status: 404 });
  }

  return NextResponse.json({ ritual: data });
}

/**
 * PUT /api/mystery-school/ritual-builder/[id]
 * Full replacement update for a personal ritual.
 * Body: { name, ritual_type, tags, components, notes, is_shared_with_admin }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const { student } = result;
  const typedStudent = student as unknown as { graduated_at?: string | null };
  if (!typedStudent.graduated_at) {
    return NextResponse.json({ error: "Post-graduation access required" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    name?: string;
    ritual_type?: string;
    tags?: string[];
    components?: unknown[];
    notes?: string | null;
    is_shared_with_admin?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, ritual_type, tags, components, notes, is_shared_with_admin } = body;

  // Server-side validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 422 });
  }
  if (name.trim().length > 200) {
    return NextResponse.json({ error: "name must be 200 characters or fewer" }, { status: 422 });
  }
  if (!Array.isArray(components)) {
    return NextResponse.json({ error: "components must be an array" }, { status: 422 });
  }

  const validRitualTypes = ["personal_transit", "seasonal", "decan_custom", "free_form"];
  const resolvedType =
    ritual_type && validRitualTypes.includes(ritual_type) ? ritual_type : "free_form";

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch existing to determine shared_at logic
  const { data: existing } = await supabase
    .from("personal_rituals")
    .select("is_shared_with_admin, shared_at")
    .eq("id", id)
    .eq("student_id", student.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Ritual not found" }, { status: 404 });
  }

  // Only set shared_at on first share — don't overwrite existing timestamp
  const wasShared = existing.is_shared_with_admin;
  const nowSharing = !!is_shared_with_admin;
  const sharedAt = nowSharing
    ? wasShared
      ? existing.shared_at
      : now
    : null;

  const { data, error } = await supabase
    .from("personal_rituals")
    .update({
      name: name.trim(),
      ritual_type: resolvedType,
      tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
      components,
      notes: notes ?? null,
      is_shared_with_admin: nowSharing,
      shared_at: sharedAt,
      updated_at: now,
    })
    .eq("id", id)
    .eq("student_id", student.id) // object-level authorization
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ritual: data });
}

/**
 * DELETE /api/mystery-school/ritual-builder/[id]
 * Deletes a personal ritual owned by the authenticated student.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const { student } = result;
  const typedStudent = student as unknown as { graduated_at?: string | null };
  if (!typedStudent.graduated_at) {
    return NextResponse.json({ error: "Post-graduation access required" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("personal_rituals")
    .delete()
    .eq("id", id)
    .eq("student_id", student.id); // object-level authorization

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
