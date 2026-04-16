import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
 * GET /api/bookings/[id]/recording-segments
 *
 * Lists all composited-video segment MP4s in S3 for this booking and returns
 * presigned URLs sorted chronologically. Used by the multi-segment video
 * player when a single concatenated recording is not available.
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

    // Verify caller is the diviner
    const { data: diviner } = await admin
      .from("diviners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("id, diviner_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking || booking.diviner_id !== diviner.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!RECORDING_BUCKET) {
      return NextResponse.json({ error: "CHIME_RECORDING_BUCKET not configured" }, { status: 500 });
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

    // Prefer /final/ file if it exists (already concatenated)
    const finalFile = objects.find(
      (o) => o.Key?.includes("/final/") && o.Key.endsWith(".mp4") && (o.Size ?? 0) > 10_000
    );

    if (finalFile?.Key) {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: finalFile.Key }),
        { expiresIn: 4 * 60 * 60 } // 4 hours
      );
      return NextResponse.json({
        mode: "single",
        segments: [{ key: finalFile.Key, size: finalFile.Size, url }],
      });
    }

    // Collect composited-video segments sorted by filename (chronological)
    const segments = objects
      .filter((o) => o.Key?.includes("composited-video") && o.Key.endsWith(".mp4") && (o.Size ?? 0) > 0)
      .sort((a, b) => (a.Key ?? "").localeCompare(b.Key ?? ""));

    if (!segments.length) {
      return NextResponse.json({ mode: "none", segments: [] });
    }

    // Generate presigned URLs for each segment
    const segmentUrls = await Promise.all(
      segments.map(async (seg) => ({
        key: seg.Key!,
        size: seg.Size ?? 0,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: seg.Key! }),
          { expiresIn: 4 * 60 * 60 }
        ),
      }))
    );

    return NextResponse.json({
      mode: "segments",
      segments: segmentUrls,
    });
  } catch (err) {
    console.error("[recording-segments]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
