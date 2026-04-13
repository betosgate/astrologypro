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
    .select("id, ms_pm_discount_enabled, no_show_diviner_refund_percent, no_show_client_refund_percent, no_show_grace_minutes, max_diviner_affiliate_share_percent, updated_at")
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

  const {
    ms_pm_discount_enabled,
    no_show_diviner_refund_percent,
    no_show_client_refund_percent,
    no_show_grace_minutes,
    max_diviner_affiliate_share_percent,
  } = body;

  // Build update object with only provided fields
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof ms_pm_discount_enabled === "boolean") {
    updates.ms_pm_discount_enabled = ms_pm_discount_enabled;
  }
  if (typeof no_show_diviner_refund_percent === "number") {
    if (no_show_diviner_refund_percent < 0 || no_show_diviner_refund_percent > 100) {
      return NextResponse.json(
        { type: "about:blank", title: "Unprocessable Entity", status: 422, detail: "no_show_diviner_refund_percent must be 0-100." },
        { status: 422 }
      );
    }
    updates.no_show_diviner_refund_percent = no_show_diviner_refund_percent;
  }
  if (typeof no_show_client_refund_percent === "number") {
    if (no_show_client_refund_percent < 0 || no_show_client_refund_percent > 100) {
      return NextResponse.json(
        { type: "about:blank", title: "Unprocessable Entity", status: 422, detail: "no_show_client_refund_percent must be 0-100." },
        { status: 422 }
      );
    }
    updates.no_show_client_refund_percent = no_show_client_refund_percent;
  }
  if (typeof no_show_grace_minutes === "number") {
    if (no_show_grace_minutes < 1 || no_show_grace_minutes > 60) {
      return NextResponse.json(
        { type: "about:blank", title: "Unprocessable Entity", status: 422, detail: "no_show_grace_minutes must be 1-60." },
        { status: 422 }
      );
    }
    updates.no_show_grace_minutes = no_show_grace_minutes;
  }
  if (typeof max_diviner_affiliate_share_percent === "number") {
    if (max_diviner_affiliate_share_percent < 0 || max_diviner_affiliate_share_percent > 100) {
      return NextResponse.json(
        { type: "about:blank", title: "Unprocessable Entity", status: 422, detail: "max_diviner_affiliate_share_percent must be 0-100." },
        { status: 422 }
      );
    }
    updates.max_diviner_affiliate_share_percent = max_diviner_affiliate_share_percent;
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json(
      { type: "about:blank", title: "Unprocessable Entity", status: 422, detail: "No valid fields to update." },
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
    .update(updates)
    .eq("id", existing.id)
    .select("id, ms_pm_discount_enabled, no_show_diviner_refund_percent, no_show_client_refund_percent, no_show_grace_minutes, max_diviner_affiliate_share_percent, updated_at")
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
