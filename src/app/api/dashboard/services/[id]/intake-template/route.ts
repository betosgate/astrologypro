import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/dashboard/services/[id]/intake-template — get current template_id for a service
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: serviceId } = await params;
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

    const { data: service, error } = await admin
      .from("services")
      .select("id, name, intake_template_id")
      .eq("id", serviceId)
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (error) {
      console.error("[services/[id]/intake-template GET]", error);
      return NextResponse.json({ error: "Failed to load service" }, { status: 500 });
    }

    if (!service) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { intake_template_id: service.intake_template_id } });
  } catch (err) {
    console.error("[services/[id]/intake-template GET] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/dashboard/services/[id]/intake-template — set or clear the intake template for a service
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: serviceId } = await params;
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

    // Verify service ownership
    const { data: service } = await admin
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("diviner_id", diviner.id)
      .maybeSingle();

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = (await request.json()) as { template_id: string | null };
    const { template_id } = body;

    // Validate: if template_id is provided, verify it belongs to this diviner
    if (template_id !== null && template_id !== undefined) {
      if (typeof template_id !== "string") {
        return NextResponse.json(
          { error: "template_id must be a string or null" },
          { status: 422 }
        );
      }

      const { data: template } = await admin
        .from("intake_templates")
        .select("id")
        .eq("id", template_id)
        .eq("diviner_id", diviner.id)
        .maybeSingle();

      if (!template) {
        return NextResponse.json(
          { error: "Template not found or does not belong to this diviner" },
          { status: 404 }
        );
      }
    }

    const { error: updateError } = await admin
      .from("services")
      .update({ intake_template_id: template_id ?? null })
      .eq("id", serviceId)
      .eq("diviner_id", diviner.id);

    if (updateError) {
      console.error("[services/[id]/intake-template PUT]", updateError);
      return NextResponse.json(
        { error: "Failed to update service intake template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, intake_template_id: template_id ?? null });
  } catch (err) {
    console.error("[services/[id]/intake-template PUT] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
