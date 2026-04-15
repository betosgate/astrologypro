import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/decline
 * Called by ChimePhoneWidget when the diviner clicks "Decline".
 *
 * Flow:
 *   1. Verify the diviner is authenticated
 *   2. Mark the call notification as "declined"
 *   3. Update the phone session status to "declined"
 *
 * The SMA Lambda will detect the declined status on its next poll
 * and play a "diviner is unavailable" message to the caller before
 * routing to voicemail or hanging up.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify caller is a diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json(
        { error: "Only diviners can decline calls" },
        { status: 403 }
      );
    }

    // ── Input ──────────────────────────────────────────────────────────────
    const body = await request.json();
    const { phoneSessionId, callId } = body as {
      phoneSessionId?: string;
      callId?: string;
    };

    if (!phoneSessionId) {
      return NextResponse.json(
        { error: "Missing phoneSessionId" },
        { status: 400 }
      );
    }

    // ── Verify the phone session belongs to this diviner ───────────────────
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, diviner_id")
      .eq("id", phoneSessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Phone session not found" },
        { status: 404 }
      );
    }

    if (session.diviner_id !== diviner.id) {
      return NextResponse.json(
        { error: "This call is not for you" },
        { status: 403 }
      );
    }

    // ── Mark notification as declined ──────────────────────────────────────
    await admin
      .from("phone_call_notifications")
      .update({ status: "declined" })
      .eq("phone_session_id", phoneSessionId)
      .eq("diviner_id", diviner.id)
      .eq("status", "ringing");

    // ── Update phone session status ────────────────────────────────────────
    await admin
      .from("phone_sessions")
      .update({
        status: "declined",
        ended_at: new Date().toISOString(),
      })
      .eq("id", phoneSessionId);

    return NextResponse.json({ declined: true });
  } catch (error) {
    console.error("[chime/voice/decline] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to decline call",
      },
      { status: 500 }
    );
  }
}
