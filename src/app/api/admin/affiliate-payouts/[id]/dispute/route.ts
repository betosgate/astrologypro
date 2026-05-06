import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/affiliate-payouts/[id]/dispute
 * Body: { note: string } — required, 5-500 chars
 *
 * Marks an affiliate_payouts row as disputed (status='disputed') and
 * appends the note. Logs to admin_action_log with action_kind
 * 'affiliate_payout_disputed'.
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
  const note =
    typeof (body as { note?: unknown }).note === "string"
      ? (body as { note: string }).note.trim()
      : "";
  if (note.length < 5 || note.length > 500) {
    return NextResponse.json(
      { error: "note is required (5–500 characters)" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const { data: payout } = await admin
    .from("affiliate_payouts")
    .select("id, affiliate_account_id, status, notes")
    .eq("id", id)
    .maybeSingle();
  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  const p = payout as Record<string, unknown>;
  const existingNotes = (p.notes as string | null) ?? "";
  const stamp = new Date().toISOString();
  const appended = `${existingNotes ? existingNotes + "\n" : ""}[${stamp} disputed by ${adminUser.id}] ${note}`;

  const { error: updErr } = await admin
    .from("affiliate_payouts")
    .update({ status: "disputed", notes: appended })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  try {
    await admin.from("admin_action_log").insert({
      admin_user_id: adminUser.id,
      action_kind: "affiliate_payout_disputed",
      target_resource_type: "affiliate_payout",
      target_resource_id: id,
      reason: note,
      payload: { affiliate_account_id: p.affiliate_account_id },
    });
  } catch (err) {
    console.error("[admin/affiliate-payouts/dispute] audit log failed", err);
  }

  return NextResponse.json({ ok: true });
}
