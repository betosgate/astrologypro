import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/chime/voice/session-status?phoneSessionId=xxx
 * Called by ChimePhoneWidget to poll the phone session status.
 * Used to detect when the caller hangs up (status → "completed").
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phoneSessionId = request.nextUrl.searchParams.get("phoneSessionId");
    if (!phoneSessionId) {
      return NextResponse.json(
        { error: "Missing phoneSessionId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify the diviner owns this session
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, status, duration_seconds, ended_at")
      .eq("id", phoneSessionId)
      .eq("diviner_id", diviner.id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: session.status,
      durationSeconds: session.duration_seconds,
      endedAt: session.ended_at,
    });
  } catch (error) {
    console.error("[chime/voice/session-status] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
