import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/affiliate-accounts/[id]/offset/write-off
 * Body: { reason: string } — required, 5-500 chars
 *
 * Zeros out an affiliate's balance_offset_cents (admin write-off action).
 * Logs to admin_action_log with action_kind 'affiliate_offset_written_off'
 * carrying the prior balance in the payload.
 *
 * Sprint: docs/tasks/2026-05-05/affiliate-payouts-phase-2/07-admin-ui.md
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 422 });
  }
  const reason =
    typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason.trim().slice(0, 500)
      : "";
  if (reason.length < 5) {
    return NextResponse.json(
      { error: "reason is required (5–500 characters)" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("affiliate_accounts")
    .select("id, balance_offset_cents")
    .eq("id", id)
    .maybeSingle();
  if (!account) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }
  const priorOffset = Number(
    ((account as Record<string, unknown>).balance_offset_cents as number | null) ?? 0,
  );
  if (priorOffset === 0) {
    return NextResponse.json({ ok: true, priorOffsetCents: 0, message: "Already zero" });
  }

  const now = new Date().toISOString();
  const { error: updErr } = await admin
    .from("affiliate_accounts")
    .update({
      balance_offset_cents: 0,
      balance_offset_last_changed_at: now,
    })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: adminUser.id,
      action_kind: "affiliate_offset_written_off",
      target_resource_type: "affiliate_account",
      target_resource_id: id,
      reason,
      payload: { prior_balance_offset_cents: priorOffset },
    });
  } catch (err) {
    console.error("[admin/offset-write-off] audit log failed", err);
  }

  return NextResponse.json({
    ok: true,
    priorOffsetCents: priorOffset,
    newOffsetCents: 0,
  });
}
