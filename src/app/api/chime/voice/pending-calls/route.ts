import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/chime/voice/pending-calls
 * Polled by ChimePhoneWidget every 3 seconds.
 * Returns the oldest ringing call notification for the current diviner, or null.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get the diviner record for this user
    const { data: diviner } = await admin
      .from("diviners")
      .select("id, phone_dialin_enabled")
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ call: null });
    }

    if (!diviner.phone_dialin_enabled) {
      // Phone dial-in not enabled — signal the widget to hide itself
      return NextResponse.json({ call: null }, { status: 503 });
    }

    // Fetch the oldest ringing notification (auto-expires after 90 seconds)
    const { data: notification } = await admin
      .from("phone_call_notifications")
      .select("id, phone_session_id, caller_phone, call_id, status")
      .eq("diviner_id", diviner.id)
      .eq("status", "ringing")
      .eq("provider", "chime")
      .gte(
        "created_at",
        new Date(Date.now() - 90_000).toISOString()
      )
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ call: notification ?? null });
  } catch (error) {
    console.error("[chime/voice/pending-calls] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
