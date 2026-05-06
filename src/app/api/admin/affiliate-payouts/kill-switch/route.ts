import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/affiliate-payouts/kill-switch
 *   → { affiliate_payouts_enabled: boolean }
 *
 * POST /api/admin/affiliate-payouts/kill-switch
 *   Body: { enabled: boolean, reason?: string }
 *   → { affiliate_payouts_enabled: boolean }
 *
 * Reads or flips platform_settings.affiliate_payouts_enabled. Logs to
 * admin_action_log with action_kind 'affiliate_payouts_kill_switch_toggled'.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/07-admin-ui.md
 */
export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_settings")
    .select("affiliate_payouts_enabled")
    .limit(1)
    .single();
  const enabled = !!((data as Record<string, unknown> | null)
    ?.affiliate_payouts_enabled as boolean | null);
  return NextResponse.json({ affiliate_payouts_enabled: enabled });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const enabled = !!(body as { enabled?: boolean }).enabled;
  const reason =
    typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason.trim().slice(0, 500)
      : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "reason is required (5–500 characters) when toggling the kill-switch" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();

  // platform_settings is expected to have one row; update all rows defensively.
  const { error: updErr } = await admin
    .from("platform_settings")
    .update({ affiliate_payouts_enabled: enabled })
    .gte("created_at", "1900-01-01");
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: adminUser.id,
      action_kind: "affiliate_payouts_kill_switch_toggled",
      target_resource_type: "platform_settings",
      target_resource_id: null,
      reason,
      payload: { affiliate_payouts_enabled: enabled },
    });
  } catch (err) {
    console.error("[admin/kill-switch] audit log failed", err);
  }

  return NextResponse.json({ affiliate_payouts_enabled: enabled });
}
