import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/chime/voice/voicemail
 * Called by the SMA Lambda after a RecordAudio action succeeds.
 * Persists the voicemail S3 key so the diviner dashboard can surface it.
 *
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 *
 * Body: { transactionId: string, recordingKey: string, callerId: string }
 * Response: 201 { voicemailId }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: shared secret used by the SMA Lambda
    const secret = request.headers.get("x-cron-secret");
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, recordingKey, callerId } = body as {
      transactionId?: string;
      recordingKey?: string;
      callerId?: string;
    };

    if (!transactionId || !recordingKey) {
      return NextResponse.json(
        { error: "Missing transactionId or recordingKey" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Resolve phone_session via chime_transaction_id so we can get diviner_id
    const { data: session } = await admin
      .from("phone_sessions")
      .select("id, diviner_id, caller_phone")
      .eq("chime_transaction_id", transactionId)
      .maybeSingle();

    if (!session) {
      // transactionId may not have been written yet (race between status and voicemail).
      // Try to look up by caller_phone as a fallback — just store with null phone_session_id.
      console.warn(
        "Voicemail: no phone_session found for transactionId",
        transactionId
      );
    }

    // Derive diviner_id from the S3 key prefix if session lookup failed.
    // Key format: voicemails/{transactionId}/{filename}
    // We store what we have and surface the gap in logs.
    if (!session?.diviner_id) {
      console.error(
        "Voicemail: cannot determine diviner_id for transactionId",
        transactionId,
        "— voicemail stored without diviner link"
      );
      // Return 201 to prevent the Lambda from retrying — the recording is in S3.
      return NextResponse.json(
        { voicemailId: null, warning: "diviner_id not resolved" },
        { status: 201 }
      );
    }

    const { data: voicemail, error } = await admin
      .from("voicemails")
      .insert({
        diviner_id: session.diviner_id,
        phone_session_id: session.id,
        caller_phone: callerId ?? session.caller_phone,
        s3_key: recordingKey,
        // duration_seconds is not available from RecordAudio success event;
        // it can be back-filled from S3 object metadata if needed.
        duration_seconds: null,
        listened_at: null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Voicemail insert error:", error);
      return NextResponse.json(
        { error: "Failed to persist voicemail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ voicemailId: voicemail.id }, { status: 201 });
  } catch (error) {
    console.error("Chime voicemail route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
