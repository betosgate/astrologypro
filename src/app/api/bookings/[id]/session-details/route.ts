import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/[id]/session-details
 * Returns recording + session metadata for a single booking.
 * Only accessible by the diviner who owns the booking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify the caller is the diviner for this booking
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 1 — fetch columns that are guaranteed to exist
    const { data: booking, error: baseError } = await admin
      .from("bookings")
      .select("id, diviner_id, chime_meeting_id, actual_duration_minutes")
      .eq("id", id)
      .maybeSingle();

    if (baseError) {
      console.warn("[session-details] base query error:", baseError.message);
      return NextResponse.json({});
    }

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Enforce ownership
    if ((booking.diviner_id as string) !== diviner.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 2 — fetch optional columns (recording, billing etc.)
    let extended: Record<string, unknown> = {};
    const { data: ext } = await admin
      .from("bookings")
      .select("recording_url, recording_share_id, video_provider, total_amount, overage_amount")
      .eq("id", id)
      .maybeSingle();
    if (ext) extended = ext as Record<string, unknown>;

    return NextResponse.json({
      chime_meeting_id: booking.chime_meeting_id ?? null,
      actual_duration_minutes: booking.actual_duration_minutes ?? null,
      recording_url: extended.recording_url ?? null,
      recording_share_id: extended.recording_share_id ?? null,
      video_provider: extended.video_provider ?? null,
      total_amount: extended.total_amount ?? null,
      overage_amount: extended.overage_amount ?? null,
    });
  } catch (err) {
    console.error("[session-details]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
