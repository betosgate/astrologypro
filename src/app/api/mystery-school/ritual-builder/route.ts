import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireMysterySchoolAccess } from "@/lib/mystery-school/access";

export const dynamic = "force-dynamic";

/**
 * GET /api/mystery-school/ritual-builder
 * Returns the authenticated post-grad student's personal_rituals list.
 * Returns 403 if not graduated.
 */
export async function GET() {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const { student } = result;
  const typedStudent = student as unknown as { graduated_at?: string | null };

  if (!typedStudent.graduated_at) {
    return NextResponse.json(
      { error: "Post-graduation access required" },
      { status: 403 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personal_rituals")
    .select(
      "id, name, ritual_type, tags, components, notes, is_shared_with_admin, shared_at, created_at, updated_at"
    )
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rituals: data ?? [] });
}

/**
 * POST /api/mystery-school/ritual-builder
 * Creates a new personal ritual for the authenticated post-grad student.
 * Body: { name, ritual_type, tags, components, notes, is_shared_with_admin }
 */
export async function POST(request: NextRequest) {
  const result = await requireMysterySchoolAccess();
  if (!result) {
    return NextResponse.json({ error: "Mystery School access required" }, { status: 403 });
  }

  const { student } = result;
  const typedStudent = student as unknown as { graduated_at?: string | null };

  if (!typedStudent.graduated_at) {
    return NextResponse.json(
      { error: "Post-graduation access required" },
      { status: 403 }
    );
  }

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

  const { data, error } = await supabase
    .from("personal_rituals")
    .insert({
      student_id: student.id,
      name: name.trim(),
      ritual_type: resolvedType,
      tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string") : [],
      components,
      notes: notes ?? null,
      is_shared_with_admin: !!is_shared_with_admin,
      shared_at: is_shared_with_admin ? now : null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ritual: data }, { status: 201 });
}
