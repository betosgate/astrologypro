import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import { resolveBookingViewer } from "@/lib/booking-access";
import { ensureFinalRecordingForSession } from "@/lib/chime-recording-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/bookings/[id]/session-details
 * Returns recording + session metadata for a single booking.
 *
 * Access is granted to three roles via `resolveBookingViewer`:
 *   - admin
 *   - the diviner who owns the booking
 *   - the client whose authenticated email matches the booking's client
 *     row (used by the /trainee "See Details" drawer so trainees can see
 *     their own admin-calendar appointments).
 *
 * Writes remain diviner/admin-only (see reschedule/cancel/session-notes
 * routes) — this endpoint is strictly read-only.
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
    const adminUser = await getAdminUser();

    const access = await resolveBookingViewer(
      admin,
      id,
      user,
      !!adminUser,
    );

    if (!access) {
      // Could be not-found or not-authorized — return 403 either way to
      // avoid leaking booking existence.
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Read from whichever table the booking actually lives in.
    const sourceTable =
      access.source === "admin_bookings" ? "admin_bookings" : "bookings";

    if (sourceTable === "admin_bookings") {
      const { data: row, error: adminErr } = await admin
        .from("admin_bookings")
        .select(
          "id, chime_meeting_id, actual_duration_minutes, recording_url, recording_share_id, video_provider",
        )
        .eq("id", id)
        .maybeSingle();

      if (adminErr) {
        console.warn(
          "[session-details] admin_bookings query error:",
          adminErr.message,
        );
        return NextResponse.json({});
      }
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const resolvedRecording = row.chime_meeting_id
        ? await ensureFinalRecordingForSession({
            table: "admin_bookings",
            sessionId: id,
            chimeMeetingId: row.chime_meeting_id,
            currentRecordingUrl: row.recording_url ?? null,
            currentShareId: row.recording_share_id ?? null,
            clearStaleSegment: true,
            allowManualConcat: false,
          })
        : null;

      return NextResponse.json({
        chime_meeting_id: row.chime_meeting_id ?? null,
        actual_duration_minutes: row.actual_duration_minutes ?? null,
        recording_url: resolvedRecording?.recordingUrl ?? row.recording_url ?? null,
        recording_share_id:
          resolvedRecording?.recordingShareId ?? row.recording_share_id ?? null,
        video_provider: row.video_provider ?? null,
        // admin_bookings has no billing — these stay null.
        total_amount: null,
        overage_amount: null,
        viewer_role: access.role,
      });
    }

    // Legacy diviner `bookings` path.
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

    // Step 2 — fetch optional columns (recording, billing etc.)
    let extended: Record<string, unknown> = {};
    const { data: ext } = await admin
      .from("bookings")
      .select("recording_url, recording_share_id, video_provider, total_amount, overage_amount")
      .eq("id", id)
      .maybeSingle();
    if (ext) extended = ext as Record<string, unknown>;

    const resolvedRecording = booking.chime_meeting_id
      ? await ensureFinalRecordingForSession({
          table: "bookings",
          sessionId: id,
          chimeMeetingId: booking.chime_meeting_id,
          currentRecordingUrl:
            typeof extended.recording_url === "string"
              ? extended.recording_url
              : null,
          currentShareId:
            typeof extended.recording_share_id === "string"
              ? extended.recording_share_id
              : null,
          clearStaleSegment: true,
          allowManualConcat: false,
        })
      : null;

    return NextResponse.json({
      chime_meeting_id: booking.chime_meeting_id ?? null,
      actual_duration_minutes: booking.actual_duration_minutes ?? null,
      recording_url: resolvedRecording?.recordingUrl ?? extended.recording_url ?? null,
      recording_share_id:
        resolvedRecording?.recordingShareId ?? extended.recording_share_id ?? null,
      video_provider: extended.video_provider ?? null,
      total_amount: extended.total_amount ?? null,
      overage_amount: extended.overage_amount ?? null,
      // Viewer role hint — useful to the client to hide mutation UIs
      // belt-and-braces even if the caller forgot to pass viewerRole.
      viewer_role: access.role,
    });
  } catch (err) {
    console.error("[session-details]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
