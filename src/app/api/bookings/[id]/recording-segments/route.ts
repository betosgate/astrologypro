import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { resolveBookingViewer } from "@/lib/booking-access";
import { ensureFinalRecordingForSession } from "@/lib/chime-recording-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/bookings/[id]/recording-segments
 *
 * Returns the final concatenated recording for this booking when available.
 * If the final file is missing but raw segments exist, this route attempts
 * a server-side recovery concat first. We no longer expose raw 5-second
 * segment playback as the primary client path.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const adminUser = await getAdminUser();

    // Access is allowed for admin | diviner (owner) | client (email match).
    // Trainees viewing their own admin-calendar booking via /trainee come
    // in as "client". See lib/booking-access.ts for the full rules.
    const access = await resolveBookingViewer(
      admin,
      bookingId,
      user,
      !!adminUser,
    );
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const table = access.source === "admin_bookings" ? "admin_bookings" : "bookings";
    const resolved = await ensureFinalRecordingForSession({
      table,
      sessionId: bookingId,
      clearStaleSegment: true,
      allowManualConcat: true,
    });

    if (resolved.status === "final") {
      return NextResponse.json({
        mode: "final",
        recording_url: resolved.recordingUrl,
        recording_share_id: resolved.recordingShareId,
        finalKey: resolved.finalKey,
        segments: [],
      });
    }

    return NextResponse.json({
      mode: "none",
      recording_url: null,
      recording_share_id: resolved.recordingShareId ?? null,
      segments: [],
      status: resolved.status,
      message: "Final recording is still processing",
    });
  } catch (err) {
    console.error("[recording-segments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
