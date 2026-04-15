import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateShareId } from "@/lib/format";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
 * Polls S3 for completed Chime recordings and writes recording_url back to
 * Supabase. This replaces the need for an AWS EventBridge rule — just run
 * this cron every 15 minutes via Vercel cron or external scheduler.
 *
 * Picks up any Chime booking where:
 *   - chime_meeting_id is set (session happened on Chime)
 *   - recording_url is still null (not yet synced)
 *   - session ended at least 5 minutes ago (pipeline needs time to finalize)
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  if (!RECORDING_BUCKET) {
    return NextResponse.json({ skipped: true, reason: "CHIME_RECORDING_BUCKET not set" });
  }

  const admin = createAdminClient();
  const s3 = getS3Client();

  // Find bookings that need recording URL synced.
  // Two cases:
  //   1. confirmed_at is set (both parties joined) — standard flow
  //   2. status = 'completed' — session ended even if participant webhook missed
  // In both cases require at least 5 min to have passed so Chime can finalize.
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, chime_meeting_id, confirmed_at, updated_at")
    .not("chime_meeting_id", "is", null)
    .is("recording_url", null)
    .or(
      `and(confirmed_at.not.is.null,confirmed_at.lt.${cutoff}),` +
      `and(status.eq.completed,updated_at.lt.${cutoff})`
    )
    .limit(20);

  if (error) {
    console.error("[sync-recordings] DB query failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings?.length) {
    return NextResponse.json({ synced: 0, message: "No pending recordings" });
  }

  const results: { bookingId: string; status: string }[] = [];

  for (const booking of bookings) {
    const bookingId = booking.id as string;

    try {
      // List objects Chime wrote under recordings/{bookingId}/
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: RECORDING_BUCKET,
          Prefix: `recordings/${bookingId}/`,
        })
      );

      const objects = list.Contents ?? [];
      if (!objects.length) {
        results.push({ bookingId, status: "no_files_yet" });
        continue;
      }

      // Priority order for finding the best recording file:
      // 1. final/{meetingId}.mp4  — concatenated single file (best, named by meeting ID)
      // 2. composited-video/*.mp4 — composited segment from capture pipeline
      // 3. Any MP4
      // 4. Any WebM
      // 5. Any non-empty file as last resort
      const recordingKey =
        objects.find((o) => o.Key?.includes("/final/") && o.Key.endsWith(".mp4"))?.Key ??
        objects.find((o) => o.Key?.includes("composited-video") && o.Key.endsWith(".mp4"))?.Key ??
        objects.find((o) => o.Key?.endsWith(".mp4") && (o.Size ?? 0) > 100_000)?.Key ??
        objects.find((o) => o.Key?.endsWith(".webm"))?.Key ??
        objects.find((o) => (o.Size ?? 0) > 0)?.Key;

      if (!recordingKey) {
        results.push({ bookingId, status: "no_playable_file" });
        continue;
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

      // Also update video_sessions if it exists
      await admin
        .from("video_sessions")
        .update({ recording_url: recordingUrl })
        .eq("chime_meeting_id", booking.chime_meeting_id);

      results.push({ bookingId, status: "synced" });
    } catch (err) {
      console.error(`[sync-recordings] Failed for booking ${bookingId}:`, err);
      results.push({ bookingId, status: "error" });
    }
  }

  const synced = results.filter((r) => r.status === "synced").length;
  console.log(`[sync-recordings] Processed ${results.length} bookings, synced ${synced}`);

  return NextResponse.json({ synced, total: results.length, results });
}
