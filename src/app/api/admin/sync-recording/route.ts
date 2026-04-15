import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateShareId } from "@/lib/format";

export const dynamic = "force-dynamic";

const RECORDING_BUCKET = process.env.CHIME_RECORDING_BUCKET ?? "";

function getS3Client() {
  const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
  return accessKeyId && secretAccessKey
    ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
    : new S3Client({ region });
}

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

  // Verify caller is a diviner (admin-level check)
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) {
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

  // Verify the diviner owns this booking
  const { data: booking } = await admin
    .from("bookings")
    .select("id, diviner_id, chime_meeting_id, recording_url")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.diviner_id !== diviner.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const s3 = getS3Client();

  // List all objects under recordings/{bookingId}/
  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: RECORDING_BUCKET,
      Prefix: `recordings/${bookingId}/`,
    })
  );

  const objects = list.Contents ?? [];

  if (!objects.length) {
    return NextResponse.json({
      found: false,
      message: `No files found at recordings/${bookingId}/ in S3`,
      bucket: RECORDING_BUCKET,
    });
  }

  // Return list of found files for diagnostics, pick best recording
  const fileList = objects.map((o) => ({ key: o.Key, size: o.Size }));

  const recordingKey =
    objects.find((o) => o.Key?.includes("/final/") && o.Key.endsWith(".mp4"))?.Key ??
    objects.find((o) => o.Key?.includes("composited-video") && o.Key.endsWith(".mp4"))?.Key ??
    objects.sort((a, b) => (b.Size ?? 0) - (a.Size ?? 0)).find((o) => o.Key?.endsWith(".mp4"))?.Key ??
    objects.find((o) => o.Key?.endsWith(".webm"))?.Key ??
    objects.sort((a, b) => (b.Size ?? 0) - (a.Size ?? 0)).find((o) => (o.Size ?? 0) > 0)?.Key;

  if (!recordingKey) {
    return NextResponse.json({ found: false, files: fileList, message: "No playable file found" });
  }

  // Generate a 7-day presigned URL
  const recordingUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: recordingKey }),
    { expiresIn: 7 * 24 * 60 * 60 }
  );

  const shareId = generateShareId();

  await admin
    .from("bookings")
    .update({ recording_url: recordingUrl, recording_share_id: shareId })
    .eq("id", bookingId);

  // Update video_sessions too
  if (booking.chime_meeting_id) {
    await admin
      .from("video_sessions")
      .update({ recording_url: recordingUrl })
      .eq("chime_meeting_id", booking.chime_meeting_id);
  }

  return NextResponse.json({
    synced: true,
    recordingKey,
    files: fileList,
    message: "recording_url updated",
  });
}
