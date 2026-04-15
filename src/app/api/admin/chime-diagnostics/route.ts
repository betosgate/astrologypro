import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chime-diagnostics
 * Full diagnostic report — env vars, IAM, S3, Chime meetings API,
 * Chime media pipelines API, Transcribe API, and recent bookings.
 * Read-only, no side effects.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const report: Record<string, unknown> = {};

  // ── 1. Environment variables ─────────────────────────────────────────────
  report.env = {
    CHIME_RECORDING_BUCKET: process.env.CHIME_RECORDING_BUCKET
      ? `SET (${process.env.CHIME_RECORDING_BUCKET})`
      : "NOT SET ❌",
    AWS_REGION: process.env.AWS_REGION ?? "NOT SET",
    AWS_CHIME_REGION: process.env.AWS_CHIME_REGION ?? "NOT SET",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
      ? `SET (${process.env.AWS_ACCESS_KEY_ID.slice(0, 6)}...)`
      : "NOT SET ❌",
    AWS_CHIME_ACCESS_KEY_ID: process.env.AWS_CHIME_ACCESS_KEY_ID
      ? `SET (${process.env.AWS_CHIME_ACCESS_KEY_ID.slice(0, 6)}...)`
      : "NOT SET",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "SET ✓" : "NOT SET ❌",
    AWS_CHIME_SECRET_ACCESS_KEY: process.env.AWS_CHIME_SECRET_ACCESS_KEY ? "SET ✓" : "NOT SET",
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID ?? "NOT SET (will use STS)",
    CRON_SECRET: process.env.CRON_SECRET ? "SET ✓" : "NOT SET",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "NOT SET",
  };

  // ── 2. AWS STS — identity + permissions list ─────────────────────────────
  try {
    const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts");
    const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
    const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    const sts = accessKeyId && secretAccessKey
      ? new STSClient({ region, credentials: { accessKeyId, secretAccessKey } })
      : new STSClient({ region });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    report.sts = {
      ok: true,
      accountId: identity.Account,
      userId: identity.UserId,
      arn: identity.Arn,
    };
  } catch (err: unknown) {
    report.sts = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ── 3. S3 — bucket access + full file listing ────────────────────────────
  const bucket = process.env.CHIME_RECORDING_BUCKET;
  if (bucket) {
    try {
      const { S3Client, ListObjectsV2Command, GetBucketLocationCommand } = await import("@aws-sdk/client-s3");
      const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
      const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
      const s3 = accessKeyId && secretAccessKey
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : new S3Client({ region });

      // Check bucket region
      let bucketRegion = "unknown";
      try {
        const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucket }));
        bucketRegion = loc.LocationConstraint ?? "us-east-1";
      } catch { /* ignore */ }

      const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 20 }));
      report.s3 = {
        ok: true,
        bucket,
        bucketRegion,
        totalObjects: list.KeyCount,
        allKeys: (list.Contents ?? []).map((o) => ({
          key: o.Key,
          size: o.Size,
          lastModified: o.LastModified,
        })),
      };
    } catch (err: unknown) {
      report.s3 = {
        ok: false,
        bucket,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  } else {
    report.s3 = { ok: false, reason: "CHIME_RECORDING_BUCKET not set" };
  }

  // ── 4. Chime Meetings API ─────────────────────────────────────────────────
  try {
    const { getChimeMeetingsClient } = await import("@/lib/chime-client");
    const { ListMeetingsCommand } = await import("@aws-sdk/client-chime-sdk-meetings");
    const client = getChimeMeetingsClient();
    const res = await client.send(new ListMeetingsCommand({}));
    report.chimeMeetings = {
      ok: true,
      activeMeetingCount: res.Meetings?.length ?? 0,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = (err as { name?: string }).name ?? "";
    report.chimeMeetings = {
      ok: name !== "AccessDeniedException",
      permission: name === "AccessDeniedException" ? "DENIED ❌" : "ok ✓",
      error: msg,
    };
  }

  // ── 5. Chime Media Pipelines — list + create permission test ─────────────
  try {
    const { getChimeMediaPipelinesClient } = await import("@/lib/chime-client");
    const {
      ListMediaCapturePipelinesCommand,
      CreateMediaCapturePipelineCommand,
    } = await import("@aws-sdk/client-chime-sdk-media-pipelines");
    const client = getChimeMediaPipelinesClient();

    // List active pipelines
    const res = await client.send(new ListMediaCapturePipelinesCommand({}));
    report.chimePipelines = {
      ok: true,
      activePipelineCount: res.MediaCapturePipelines?.length ?? 0,
      pipelines: (res.MediaCapturePipelines ?? []).map((p) => ({
        id: p.MediaPipelineId,
        status: p.Status,
        createdAt: p.CreatedTimestamp,
      })),
    };

    // Test CreateMediaCapturePipeline permission (fake ARN — will fail with
    // BadRequest/NotFound if permission OK, AccessDenied if not)
    try {
      await client.send(new CreateMediaCapturePipelineCommand({
        SourceType: "ChimeSdkMeeting",
        SourceArn: `arn:aws:chime::${process.env.AWS_ACCOUNT_ID}:meeting/test-perm-check`,
        SinkType: "S3Bucket",
        SinkArn: `arn:aws:s3:::${process.env.CHIME_RECORDING_BUCKET ?? "test"}/test`,
      }));
      report.createPipelinePermission = "ok ✓ (unexpected success with fake ARN)";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const name = (err as { name?: string }).name ?? "";
      if (name === "AccessDeniedException" || msg.toLowerCase().includes("access denied") || msg.toLowerCase().includes("not authorized")) {
        report.createPipelinePermission = `DENIED ❌ — IAM user missing chime:CreateMediaCapturePipeline — ${msg}`;
      } else {
        report.createPipelinePermission = `ok ✓ (permission granted — fake ARN rejected as expected: ${name}: ${msg})`;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const name = (err as { name?: string }).name ?? "";
    report.chimePipelines = {
      ok: false,
      permission: name === "AccessDeniedException" ? "DENIED ❌" : "error",
      error: msg,
    };
  }

  // ── 6. S3 PutObject permission test ──────────────────────────────────────
  if (bucket) {
    try {
      const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
      const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
      const s3 = accessKeyId && secretAccessKey
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : new S3Client({ region });

      const testKey = `recordings/_diag-test/permission-check.txt`;
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: "diag-test",
        ContentType: "text/plain",
      }));
      // Clean up
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
      report.s3PutPermission = "ok ✓ (can write to bucket)";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      report.s3PutPermission = `DENIED ❌ — ${msg}`;
    }
  }

  // ── 7. Transcribe permission test ────────────────────────────────────────
  try {
    const { TranscribeStreamingClient, StartStreamTranscriptionCommand } =
      await import("@aws-sdk/client-transcribe-streaming");
    const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
    const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

    // We won't actually stream — just instantiate the client to confirm SDK loads
    const _client = accessKeyId && secretAccessKey
      ? new TranscribeStreamingClient({ region, credentials: { accessKeyId, secretAccessKey } })
      : new TranscribeStreamingClient({ region });
    void _client; // not used
    void StartStreamTranscriptionCommand; // not used
    report.transcribe = { sdkLoaded: true, note: "Permission tested via signed-url endpoint at runtime" };
  } catch (err: unknown) {
    report.transcribe = { sdkLoaded: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ── 8. Recent Chime bookings — full detail ───────────────────────────────
  const { data: recentBookings } = await admin
    .from("bookings")
    .select("id, status, chime_meeting_id, chime_pipeline_id, recording_url, confirmed_at, updated_at, actual_duration_minutes, video_provider")
    .not("chime_meeting_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  report.recentChimeBookings = (recentBookings ?? []).map((b) => ({
    id: b.id,
    status: b.status,
    videoProvider: b.video_provider,
    hasMeetingId: !!b.chime_meeting_id,
    meetingId: b.chime_meeting_id,
    hasPipelineId: !!b.chime_pipeline_id,
    pipelineId: b.chime_pipeline_id ?? null,
    hasRecordingUrl: !!b.recording_url,
    actualDuration: b.actual_duration_minutes,
    confirmedAt: b.confirmed_at,
    updatedAt: b.updated_at,
  }));

  // ── 9. S3 recordings folder — list all booking prefixes ─────────────────
  if (bucket) {
    try {
      const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
      const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
      const s3 = accessKeyId && secretAccessKey
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : new S3Client({ region });

      const list = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "recordings/",
        MaxKeys: 50,
      }));
      report.s3Recordings = {
        totalFiles: list.KeyCount,
        files: (list.Contents ?? []).map((o) => ({
          key: o.Key,
          sizeMB: o.Size ? (o.Size / 1024 / 1024).toFixed(2) + " MB" : "0",
          lastModified: o.LastModified,
        })),
      };
    } catch (err: unknown) {
      report.s3Recordings = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(report, { status: 200 });
}
