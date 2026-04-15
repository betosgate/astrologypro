import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/chime-diagnostics
 * Returns a full diagnostic report of Chime + recording config.
 * Safe to call — read-only, no side effects.
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
  };

  // ── 2. AWS STS — can we resolve account ID? ──────────────────────────────
  try {
    const { STSClient, GetCallerIdentityCommand } = await import("@aws-sdk/client-sts");
    const region =
      process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
    const accessKeyId =
      process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

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

  // ── 3. S3 — can we list the recording bucket? ────────────────────────────
  const bucket = process.env.CHIME_RECORDING_BUCKET;
  if (bucket) {
    try {
      const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
      const region =
        process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
      const accessKeyId =
        process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey =
        process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

      const s3 = accessKeyId && secretAccessKey
        ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
        : new S3Client({ region });

      const list = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 })
      );
      report.s3 = {
        ok: true,
        bucket,
        objectCount: list.KeyCount,
        sampleKeys: (list.Contents ?? []).map((o) => o.Key),
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

  // ── 4. Chime Media Pipelines — can we call the API? ──────────────────────
  try {
    const { getChimeMediaPipelinesClient } = await import("@/lib/chime-client");
    const { ListMediaCapturePipelinesCommand } = await import(
      "@aws-sdk/client-chime-sdk-media-pipelines"
    );
    const client = getChimeMediaPipelinesClient();
    const res = await client.send(new ListMediaCapturePipelinesCommand({}));
    report.chimePipelines = {
      ok: true,
      activePipelineCount: res.MediaCapturePipelines?.length ?? 0,
    };
  } catch (err: unknown) {
    report.chimePipelines = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── 5. Recent bookings with Chime meeting IDs ────────────────────────────
  const { data: recentBookings } = await admin
    .from("bookings")
    .select("id, status, chime_meeting_id, chime_pipeline_id, recording_url, updated_at")
    .not("chime_meeting_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5);

  report.recentChimeBookings = (recentBookings ?? []).map((b) => ({
    id: b.id,
    status: b.status,
    hasMeetingId: !!b.chime_meeting_id,
    hasPipelineId: !!b.chime_pipeline_id,
    hasRecordingUrl: !!b.recording_url,
    updatedAt: b.updated_at,
  }));

  return NextResponse.json(report, { status: 200 });
}
