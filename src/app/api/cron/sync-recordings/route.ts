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
 * Polls S3 for completed Chime recordings across all three session tables
 * (`bookings`, `admin_bookings`, `phone_sessions`) and writes `recording_url`
 * back to Supabase. Run this cron every 10–15 minutes.
 *
 * For each row we:
 *   - list S3 objects under `recordings/{sessionId}/`
 *   - prefer the final/ concatenated mp4; fall back to the largest segment
 *   - generate a 7-day presigned URL
 *   - persist `recording_url` (+ `recording_share_id`) back to the row
 *
 * The S3 layout is the same for all three tables (they all pass their own
 * uuid as the S3 key prefix when creating the capture pipeline), so a
 * single loop handles them.
 */

type SessionKind = "booking" | "admin_booking" | "phone_session";

interface SessionCandidate {
  kind: SessionKind;
  id: string;
  chimeMeetingId: string | null;
  updatedAt: string | null;
}

async function loadCandidates(
  admin: ReturnType<typeof createAdminClient>,
  cutoff: string,
): Promise<SessionCandidate[]> {
  const out: SessionCandidate[] = [];

  // ── Legacy diviner `bookings` ────────────────────────────────────────────
  const { data: bookings, error: bookingsErr } = await admin
    .from("bookings")
    .select("id, chime_meeting_id, confirmed_at, updated_at")
    .not("chime_meeting_id", "is", null)
    .is("recording_url", null)
    .or(
      `and(confirmed_at.not.is.null,confirmed_at.lt.${cutoff}),` +
      `and(status.eq.completed,updated_at.lt.${cutoff})`,
    )
    .limit(20);
  if (bookingsErr) {
    console.error("[sync-recordings] bookings query failed:", bookingsErr.message);
  }
  for (const b of bookings ?? []) {
    out.push({
      kind: "booking",
      id: b.id as string,
      chimeMeetingId: (b.chime_meeting_id as string | null) ?? null,
      updatedAt: (b.updated_at as string | null) ?? (b.confirmed_at as string | null),
    });
  }

  // ── Admin↔trainee `admin_bookings` ───────────────────────────────────────
  // admin_bookings uses `ended_at` to signal a finished session (added in
  // migration 20260423000001). If the column is missing on older DBs the
  // query returns an error — we swallow it so the cron still processes the
  // other tables.
  try {
    const { data: adminBookings, error: adminErr } = await admin
      .from("admin_bookings")
      .select("id, chime_meeting_id, ended_at, updated_at")
      .not("chime_meeting_id", "is", null)
      .is("recording_url", null)
      .lt("ended_at", cutoff)
      .limit(20);
    if (adminErr) {
      console.error("[sync-recordings] admin_bookings query failed:", adminErr.message);
    } else {
      for (const b of adminBookings ?? []) {
        out.push({
          kind: "admin_booking",
          id: b.id as string,
          chimeMeetingId: (b.chime_meeting_id as string | null) ?? null,
          updatedAt: (b.ended_at as string | null) ?? (b.updated_at as string | null),
        });
      }
    }
  } catch (err) {
    console.error("[sync-recordings] admin_bookings scan threw:", err);
  }

  // ── Phone / voice `phone_sessions` ───────────────────────────────────────
  try {
    const { data: phones, error: phonesErr } = await admin
      .from("phone_sessions")
      .select("id, chime_meeting_id, ended_at, updated_at")
      .not("chime_meeting_id", "is", null)
      .is("recording_url", null)
      .lt("ended_at", cutoff)
      .limit(20);
    if (phonesErr) {
      console.error("[sync-recordings] phone_sessions query failed:", phonesErr.message);
    } else {
      for (const p of phones ?? []) {
        out.push({
          kind: "phone_session",
          id: p.id as string,
          chimeMeetingId: (p.chime_meeting_id as string | null) ?? null,
          updatedAt: (p.ended_at as string | null) ?? (p.updated_at as string | null),
        });
      }
    }
  } catch (err) {
    console.error("[sync-recordings] phone_sessions scan threw:", err);
  }

  return out;
}

function tableForKind(kind: SessionKind): string {
  switch (kind) {
    case "booking":
      return "bookings";
    case "admin_booking":
      return "admin_bookings";
    case "phone_session":
      return "phone_sessions";
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  if (!RECORDING_BUCKET) {
    return NextResponse.json({ skipped: true, reason: "CHIME_RECORDING_BUCKET not set" });
  }

  const admin = createAdminClient();
  const s3 = getS3Client();

  // Require at least 5 min between session end and cron sync so Chime has
  // time to finalize the concatenation pipeline.
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const candidates = await loadCandidates(admin, cutoff);

  if (!candidates.length) {
    return NextResponse.json({ synced: 0, message: "No pending recordings" });
  }

  const results: { kind: SessionKind; id: string; status: string }[] = [];

  for (const candidate of candidates) {
    const { kind, id, chimeMeetingId, updatedAt } = candidate;

    try {
      const list = await s3.send(
        new ListObjectsV2Command({
          Bucket: RECORDING_BUCKET,
          Prefix: `recordings/${id}/`,
        }),
      );

      const objects = list.Contents ?? [];
      if (!objects.length) {
        results.push({ kind, id, status: "no_files_yet" });
        continue;
      }

      // Prefer the concatenated single file, fall back to the largest segment.
      const finalFile = objects.find(
        (o) => o.Key?.includes("/final/") && o.Key.endsWith(".mp4"),
      );
      const compositedFiles = objects
        .filter(
          (o) => o.Key?.includes("composited-video") && o.Key.endsWith(".mp4"),
        )
        .sort((a, b) => (b.Size ?? 0) - (a.Size ?? 0));
      const allMp4sBySize = objects
        .filter((o) => o.Key?.endsWith(".mp4") && (o.Size ?? 0) > 500_000)
        .sort((a, b) => (b.Size ?? 0) - (a.Size ?? 0));

      // Give concatenation 10 minutes to finish before falling back to the
      // largest segment — otherwise we'd publish a partial recording.
      const ageMinutes = updatedAt
        ? (Date.now() - new Date(updatedAt).getTime()) / 60_000
        : Infinity;
      if (!finalFile && compositedFiles.length > 0 && ageMinutes < 10) {
        results.push({ kind, id, status: "waiting_for_concatenation" });
        continue;
      }

      const recordingKey =
        finalFile?.Key ??
        compositedFiles[0]?.Key ??
        allMp4sBySize[0]?.Key ??
        objects.find((o) => o.Key?.endsWith(".webm"))?.Key ??
        objects.find((o) => (o.Size ?? 0) > 0)?.Key;

      if (!recordingKey) {
        results.push({ kind, id, status: "no_playable_file" });
        continue;
      }

      const recordingUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: recordingKey }),
        { expiresIn: 7 * 24 * 60 * 60 },
      );

      const shareId = generateShareId();

      const table = tableForKind(kind);
      await admin
        .from(table)
        .update({ recording_url: recordingUrl, recording_share_id: shareId })
        .eq("id", id);

      // Also update the legacy video_sessions mirror table for diviner
      // bookings. Admin_bookings and phone_sessions don't use it.
      if (kind === "booking" && chimeMeetingId) {
        await admin
          .from("video_sessions")
          .update({ recording_url: recordingUrl })
          .eq("chime_meeting_id", chimeMeetingId);
      }

      results.push({ kind, id, status: "synced" });
    } catch (err) {
      console.error(`[sync-recordings] Failed for ${kind} ${id}:`, err);
      results.push({ kind, id, status: "error" });
    }
  }

  const synced = results.filter((r) => r.status === "synced").length;
  console.log(
    `[sync-recordings] Processed ${results.length}, synced ${synced} (${results
      .map((r) => `${r.kind}:${r.status}`)
      .join(", ")})`,
  );

  return NextResponse.json({ synced, total: results.length, results });
}
