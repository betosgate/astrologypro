import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakeField } from "@/lib/intake-fields";

export const dynamic = "force-dynamic";

// GET /api/dashboard/intake-templates — list all templates for authenticated diviner
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    const { data: templates, error } = await admin
      .from("intake_templates")
      .select("id, name, description, is_default, fields, created_at, updated_at")
      .eq("diviner_id", diviner.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[intake-templates GET]", error);
      return NextResponse.json(
        { error: "Failed to load templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: templates ?? [] });
  } catch (err) {
    console.error("[intake-templates GET] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/dashboard/intake-templates — create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner) {
      return NextResponse.json({ error: "Diviner not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      fields?: IntakeField[];
      is_default?: boolean;
    };

    const { name, description, fields, is_default } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 422 }
      );
    }

    if (!Array.isArray(fields)) {
      return NextResponse.json(
        { error: "fields must be an array" },
        { status: 422 }
      );
    }

    // Assign UUIDs to any fields that are missing them
    const fieldsWithIds: IntakeField[] = fields.map((f, idx) => ({
      ...f,
      id: f.id || crypto.randomUUID(),
      sort_order: f.sort_order ?? idx,
    }));

    // If setting as default, unset any existing default for this diviner
    if (is_default) {
      await admin
        .from("intake_templates")
        .update({ is_default: false })
        .eq("diviner_id", diviner.id)
        .eq("is_default", true);
    }

    const { data: template, error } = await admin
      .from("intake_templates")
      .insert({
        diviner_id: diviner.id,
        name: name.trim(),
        description: description?.trim() ?? null,
        fields: fieldsWithIds,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error("[intake-templates POST]", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (err) {
    console.error("[intake-templates POST] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
