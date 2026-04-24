import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";
import {
  ensureFinalRecordingForSession,
  inspectChimeRecordingArtifacts,
} from "@/lib/chime-recording-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECORDING_BUCKET = process.env.CHIME_RECORDING_BUCKET ?? "";

/**
 * POST /api/admin/sync-recording
 * Body: { bookingId: string }
 *
 * Manually triggers S3 → recording_url sync for a specific booking.
 * Useful for recovering recordings where the cron missed the booking.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const adminUser = await getAdminUser();

  // Verify caller is a diviner or admin
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner && !adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!RECORDING_BUCKET) {
    return NextResponse.json({ error: "CHIME_RECORDING_BUCKET not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { bookingId } = body;

  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  // Verify the booking exists and caller has access
  let bookingSource: "bookings" | "admin_bookings" = "bookings";
  let { data: booking } = await admin
    .from("bookings")
    .select("id, diviner_id, chime_meeting_id, recording_url")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    const { data: adminBooking } = await admin
      .from("admin_bookings")
      .select("id, chime_meeting_id, recording_url")
      .eq("id", bookingId)
      .maybeSingle();
    
    if (adminBooking) {
      booking = adminBooking as any;
      bookingSource = "admin_bookings";
    }
  }

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Diviners can only sync their own standard bookings. 
  // Admins can sync anything.
  if (!adminUser && (bookingSource !== "bookings" || booking.diviner_id !== diviner?.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const inspection = await inspectChimeRecordingArtifacts(bookingId);
  const objects = inspection.objects;

  if (!objects.length) {
    return NextResponse.json({
      found: false,
      message: `No files found at recordings/${bookingId}/ in S3`,
      bucket: RECORDING_BUCKET,
    });
  }

  const fileList = objects.map((o) => ({ key: o.Key, size: o.Size }));
  const resolved = await ensureFinalRecordingForSession({
    table: bookingSource,
    sessionId: bookingId,
    chimeMeetingId: booking.chime_meeting_id,
    currentRecordingUrl: booking.recording_url ?? null,
    clearStaleSegment: true,
    allowManualConcat: true,
  });

  if (resolved.status !== "final") {
    return NextResponse.json({
      found: false,
      files: fileList,
      finalKey: inspection.finalKey,
      segmentCount: inspection.segmentCount,
      message:
        resolved.status === "processing"
          ? "Raw segments exist, but the final concatenated recording is not ready yet"
          : "No final concatenated recording found",
    });
  }

  return NextResponse.json({
    synced: true,
    recordingKey: resolved.finalKey,
    segmentCount: inspection.segmentCount,
    files: fileList,
    message: "recording_url updated with final concatenated recording",
  });
}
