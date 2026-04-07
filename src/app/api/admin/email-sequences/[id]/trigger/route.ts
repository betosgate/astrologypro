import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/email-sequences/[id]/trigger
 *
 * Manually enqueues a one-off trigger for an email sequence.
 * This records the trigger request in email_sequence_triggers so that the
 * cron job (or a background worker) can pick it up and dispatch the emails.
 *
 * Body: { target_user_id?: string }
 *   - If target_user_id is supplied, the trigger applies to that specific user.
 *   - If omitted, the trigger is a broadcast to all eligible subscribers.
 *
 * Returns: { triggerId, sequenceName, status }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      { type: "about:blank", title: "Unauthorized", detail: "Admin access required.", status: 401 },
      { status: 401, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({})) as { target_user_id?: string };
  const targetUserId = typeof body.target_user_id === "string" ? body.target_user_id : null;

  const admin = createAdminClient();

  // Verify the sequence exists
  const { data: sequence, error: seqError } = await admin
    .from("email_sequence_controls")
    .select("id, sequence_name, display_name, is_paused")
    .eq("id", id)
    .maybeSingle();

  if (seqError || !sequence) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Not Found",
        detail: `Email sequence with id "${id}" not found.`,
        status: 404,
      },
      { status: 404, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  if (sequence.is_paused) {
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Conflict",
        detail: `Sequence "${sequence.display_name}" is currently paused. Resume it before triggering.`,
        status: 409,
      },
      { status: 409, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  // Insert trigger record — the cron or background worker processes this
  const { data: trigger, error: insertError } = await admin
    .from("email_sequence_triggers")
    .insert({
      sequence_id: id,
      sequence_name: sequence.sequence_name,
      target_user_id: targetUserId,
      triggered_by: user.id,
      status: "pending",
      triggered_at: new Date().toISOString(),
    })
    .select("id, status")
    .single();

  if (insertError) {
    // If the table doesn't exist yet, fall back to logging in the audit log
    console.error("[email-sequences/trigger] Insert failed:", insertError.message);
    return NextResponse.json(
      {
        type: "about:blank",
        title: "Internal Server Error",
        detail: insertError.message,
        status: 500,
      },
      { status: 500, headers: { "Content-Type": "application/problem+json" } }
    );
  }

  return NextResponse.json({
    triggerId: trigger.id,
    sequenceName: sequence.sequence_name,
    status: trigger.status,
    targetUserId: targetUserId ?? "broadcast",
  });
}
