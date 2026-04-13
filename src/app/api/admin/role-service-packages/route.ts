import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_service_packages")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("package_code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    package_code?: string;
    display_name?: string;
    description?: string | null;
    is_active?: boolean;
    sort_order?: number;
    default_for_roles?: string[];
  };

  if (!body.package_code) {
    return NextResponse.json({ error: "package_code is required" }, { status: 422 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.display_name === "string" && body.display_name.trim()) {
    updates.display_name = body.display_name.trim();
  }
  if (body.description !== undefined) {
    updates.description =
      typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }
  if (typeof body.sort_order === "number") {
    updates.sort_order = body.sort_order;
  }
  if (Array.isArray(body.default_for_roles)) {
    updates.default_for_roles = body.default_for_roles.filter(
      (role) => role === "diviner" || role === "trainee",
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_service_packages")
    .update(updates)
    .eq("package_code", body.package_code)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data });
}
