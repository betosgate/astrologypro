import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/platform-settings
 * Returns the global platform settings (singleton row).
 */
export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("id, ms_pm_discount_enabled, updated_at")
    .limit(1)
    .single();

  if (error) {
    console.error("[platform-settings GET]", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: "Failed to load settings." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/admin/platform-settings
 * Updates the global platform settings.
 *
 * Body: { ms_pm_discount_enabled: boolean }
 */
export async function PUT(request: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", status: 401, detail: "Admin access required." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { type: "about:blank", title: "Bad Request", status: 400, detail: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { ms_pm_discount_enabled } = body;

  if (typeof ms_pm_discount_enabled !== "boolean") {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Unprocessable Entity",
        status: 422,
        detail: "ms_pm_discount_enabled must be a boolean.",
      },
      { status: 422 }
    );
  }

  const admin = createAdminClient();

  // Get the singleton row ID
  const { data: existing } = await admin
    .from("platform_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: "Platform settings row not found." },
      { status: 500 }
    );
  }

  const { data, error } = await admin
    .from("platform_settings")
    .update({
      ms_pm_discount_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("id, ms_pm_discount_enabled, updated_at")
    .single();

  if (error) {
    console.error("[platform-settings PUT]", error);
    return NextResponse.json(
      { type: "about:blank", title: "Internal Error", status: 500, detail: "Failed to update settings." },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
