import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateShareId } from "@/lib/format";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECORDING_BUCKET = process.env.CHIME_RECORDING_BUCKET ?? "";

function getS3Client() {
  const region =
    process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const accessKeyId =
    process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AWS_CHIME_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  }
  return new S3Client({ region });
}

/**
 * Receives AWS EventBridge events for Chime SDK:
 * - Media pipeline completion (recording ready)
 * - Meeting ended
 *
 * EventBridge can be configured to POST to this endpoint via an API destination
 * or the events can be routed through an SNS topic / Lambda bridge.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // EventBridge event structure
    const detailType: string = body["detail-type"] ?? body.type ?? "";
    const detail = body.detail ?? body.payload ?? {};

    // Handle media capture pipeline completion
    if (
      detailType === "Chime Media Pipeline State Change" ||
      detailType === "recording.complete"
    ) {
      const meetingId: string | undefined =
        detail.meetingId ?? detail.meeting_id;
      const s3Key: string | undefined =
        detail.s3Key ?? detail.s3_key ?? detail.outputArtifacts?.s3Key;

      if (!meetingId) {
        console.error("Chime webhook: missing meetingId in payload");
        return NextResponse.json({ received: true });
      }

      const admin = createAdminClient();

      // Generate a presigned URL for the recording (valid for 7 days)
      let recordingUrl = "";
      if (s3Key && RECORDING_BUCKET) {
        try {
          const s3 = getS3Client();
          recordingUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket: RECORDING_BUCKET,
              Key: s3Key,
            }),
            { expiresIn: 7 * 24 * 60 * 60 } // 7 days
          );
        } catch (err) {
          console.error("Failed to generate presigned URL:", err);
          // Store the S3 path as fallback
          recordingUrl = `s3://${RECORDING_BUCKET}/${s3Key}`;
        }
      }

      const shouldPersistRecording =
        !!recordingUrl &&
        !!s3Key &&
        !s3Key.includes("/composited-video/");

      if (shouldPersistRecording) {
        const shareId = generateShareId();

        // Find booking by chime_meeting_id and update
        const { error } = await admin
          .from("bookings")
          .update({
            recording_url: recordingUrl,
            recording_share_id: shareId,
          })
          .eq("chime_meeting_id", meetingId);

        if (error) {
          console.error(
            "Failed to update booking with Chime recording:",
            error
          );
        }

        // Also update video_sessions
        await admin
          .from("video_sessions")
          .update({ recording_url: recordingUrl })
          .eq("chime_meeting_id", meetingId);
      }
    }

    // Handle meeting ended event
    if (detailType === "Chime Meeting State Change") {
      const meetingId: string | undefined = detail.meetingId;
      const eventType: string | undefined = detail.eventType;

      if (eventType === "MeetingEnded" && meetingId) {
        const admin = createAdminClient();
        await admin
          .from("video_sessions")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
          })
          .eq("chime_meeting_id", meetingId)
          .eq("status", "live");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Chime webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
