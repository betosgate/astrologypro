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
  { params }: { params: { id: string } }
) {
  try {
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

    // Fetch only the columns that may not exist in older DB states —
    // use a broad select and let PostgREST ignore unknown columns gracefully.
    const { data: booking, error } = await admin
      .from("bookings")
      .select(
        "id, owner_id, diviner_id, recording_url, recording_share_id, actual_duration_minutes, chime_meeting_id, video_provider, total_amount, overage_amount"
      )
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      // If columns don't exist yet (schema not migrated), return empty rather than 500
      console.warn("[session-details] query error:", error.message);
      return NextResponse.json({});
    }

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Enforce ownership
    const ownerId = (booking.owner_id ?? booking.diviner_id) as string;
    if (ownerId !== diviner.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      recording_url: booking.recording_url ?? null,
      recording_share_id: booking.recording_share_id ?? null,
      actual_duration_minutes: booking.actual_duration_minutes ?? null,
      chime_meeting_id: booking.chime_meeting_id ?? null,
      video_provider: booking.video_provider ?? null,
      total_amount: booking.total_amount ?? null,
      overage_amount: booking.overage_amount ?? null,
    });
  } catch (err) {
    console.error("[session-details]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
