import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakeField } from "@/lib/intake-fields";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/dashboard/intake-templates/[id] — single template
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const { data: template, error } = await admin
      .from("intake_templates")
      .select("*")
      .eq("id", id)
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (error) {
      console.error("[intake-templates/[id] GET]", error);
      return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch (err) {
    console.error("[intake-templates/[id] GET] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/dashboard/intake-templates/[id] — update template
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Verify ownership
    const { data: existing } = await admin
      .from("intake_templates")
      .select("id")
      .eq("id", id)
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      fields?: IntakeField[];
      is_default?: boolean;
    };

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "name must be a non-empty string" }, { status: 422 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() ?? null;
    }

    if (body.fields !== undefined) {
      if (!Array.isArray(body.fields)) {
        return NextResponse.json({ error: "fields must be an array" }, { status: 422 });
      }
      updates.fields = body.fields.map((f, idx) => ({
        ...f,
        id: f.id || crypto.randomUUID(),
        sort_order: f.sort_order ?? idx,
      }));
    }

    if (body.is_default !== undefined) {
      updates.is_default = body.is_default;
      // If setting as default, unset all others for this diviner
      if (body.is_default) {
        await admin
          .from("intake_templates")
          .update({ is_default: false })
          .eq("diviner_id", diviner.id)
          .eq("is_default", true)
          .neq("id", id);
      }
    }

    const { data: template, error } = await admin
      .from("intake_templates")
      .update(updates)
      .eq("id", id)
      .eq("diviner_id", diviner.id)
      .select()
      .single();

    if (error) {
      console.error("[intake-templates/[id] PATCH]", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json({ data: template });
  } catch (err) {
    console.error("[intake-templates/[id] PATCH] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/dashboard/intake-templates/[id] — delete template
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Verify ownership
    const { data: existing } = await admin
      .from("intake_templates")
      .select("id")
      .eq("id", id)
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Clear the reference on any services pointing to this template before deleting
    const { error: clearError } = await admin
      .from("services")
      .update({ intake_template_id: null })
      .eq("intake_template_id", id);

    if (clearError) {
      console.error("[intake-templates/[id] DELETE] clear services ref:", clearError);
      return NextResponse.json({ error: "Failed to clear service references" }, { status: 500 });
    }

    const { error: deleteError } = await admin
      .from("intake_templates")
      .delete()
      .eq("id", id)
      .eq("diviner_id", diviner.id);

    if (deleteError) {
      console.error("[intake-templates/[id] DELETE]", deleteError);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[intake-templates/[id] DELETE] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
