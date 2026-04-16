import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/notify
 * Called by the SMA Lambda to notify a diviner about an incoming call.
 * For Chime, the diviner joins via the ChimePhoneWidget in the dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { divinerId, phoneSessionId, callerPhone, callId, transactionId } =
      await request.json();

    if (!divinerId) {
      return NextResponse.json(
        { error: "Missing divinerId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Store the incoming call notification so the dashboard widget can poll for it
    await admin.from("phone_call_notifications").insert({
      diviner_id: divinerId,
      phone_session_id: phoneSessionId,
      caller_phone: callerPhone,
      call_id: callId,
      status: "ringing",
      provider: "chime",
      created_at: new Date().toISOString(),
    });

    // Store transactionId on the phone session so the accept route can
    // use UpdateSipMediaApplicationCall to bridge the caller into the meeting
    if (phoneSessionId && transactionId) {
      await admin
        .from("phone_sessions")
        .update({ chime_transaction_id: transactionId })
        .eq("id", phoneSessionId);
    }

    // In a production system, you'd push this via WebSocket/SSE or
    // use Supabase Realtime to notify the diviner's dashboard in real-time.
    // For now, the widget polls /api/chime/voice/pending-calls.

    return NextResponse.json({ notified: true });
  } catch (error) {
    console.error("Chime voice notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
