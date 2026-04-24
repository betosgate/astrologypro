import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { generateShareId } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWriteStream, createReadStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const RECORDING_BUCKET = process.env.CHIME_RECORDING_BUCKET ?? "";
const execFileAsync = promisify(execFile);

export type RecordingTable = "bookings" | "admin_bookings" | "phone_sessions";

export function isSegmentRecordingUrl(url: string | null | undefined) {
  return typeof url === "string" && url.includes("/composited-video/");
}

function getS3Client() {
  const region = process.env.AWS_CHIME_REGION ?? process.env.AWS_REGION ?? "us-east-1";
  const accessKeyId = process.env.AWS_CHIME_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_CHIME_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  return accessKeyId && secretAccessKey
    ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
    : new S3Client({ region });
}

function getSegmentObjects(objects: _Object[]) {
  return objects
    .filter(
      (object) =>
        object.Key?.includes("composited-video") &&
        object.Key.endsWith(".mp4") &&
        (object.Size ?? 0) > 50_000,
    )
    .sort((a, b) => (a.Key ?? "").localeCompare(b.Key ?? ""));
}

async function downloadS3ObjectToFile(s3: S3Client, key: string, targetPath: string) {
  const object = await s3.send(
    new GetObjectCommand({
      Bucket: RECORDING_BUCKET,
      Key: key,
    }),
  );

  const body = object.Body;
  if (!body) {
    throw new Error(`S3 object has no body for key ${key}`);
  }

  if (body instanceof Readable) {
    await pipeline(body, createWriteStream(targetPath));
    return;
  }

  if (typeof (body as Blob).stream === "function") {
    await pipeline(
      Readable.fromWeb((body as Blob).stream() as unknown as NodeReadableStream),
      createWriteStream(targetPath),
    );
    return;
  }

  throw new Error(`Unsupported S3 body type for key ${key}`);
}

async function buildManualConcatenatedRecording(sessionId: string, objects: _Object[]) {
  const segments = getSegmentObjects(objects);
  if (segments.length === 0) return null;

  const s3 = getS3Client();
  const workDir = await mkdtemp(join(tmpdir(), `astropro-recording-${sessionId}-`));

  try {
    const localFiles: string[] = [];

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const localPath = join(workDir, `segment-${String(index).padStart(4, "0")}.mp4`);
      await downloadS3ObjectToFile(s3, segment.Key!, localPath);
      localFiles.push(localPath);
    }

    const listPath = join(workDir, "concat-list.txt");
    await writeFile(
      listPath,
      `${localFiles.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n")}\n`,
      "utf8",
    );

    const outputPath = join(workDir, "manual-final.mp4");

    await execFileAsync("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c",
      "copy",
      outputPath,
    ]);

    const finalKey = `recordings/${sessionId}/final/manual-concat.mp4`;
    await s3.send(
      new PutObjectCommand({
        Bucket: RECORDING_BUCKET,
        Key: finalKey,
        Body: createReadStream(outputPath),
        ContentType: "video/mp4",
      }),
    );

    return finalKey;
  } catch (error) {
    console.error("[chime-recording-sync] manual concatenation failed:", error);
    return null;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function chooseBestFinalFile(objects: _Object[]) {
  return objects
    .filter(
      (object) =>
        object.Key?.includes("/final/") &&
        object.Key.endsWith(".mp4") &&
        (object.Size ?? 0) > 10_000,
    )
    .sort((a, b) => {
      const aTime = a.LastModified?.getTime() ?? 0;
      const bTime = b.LastModified?.getTime() ?? 0;
      if (bTime !== aTime) return bTime - aTime;
      return (b.Size ?? 0) - (a.Size ?? 0);
    })[0] ?? null;
}

export async function inspectChimeRecordingArtifacts(sessionId: string) {
  if (!RECORDING_BUCKET) {
    return {
      bucketConfigured: false,
      finalKey: null,
      segmentCount: 0,
      objects: [] as _Object[],
    };
  }

  const s3 = getS3Client();
  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: RECORDING_BUCKET,
      Prefix: `recordings/${sessionId}/`,
    }),
  );

  const objects = list.Contents ?? [];
  const finalFile = chooseBestFinalFile(objects);
  const segmentCount = getSegmentObjects(objects).length;

  return {
    bucketConfigured: true,
    finalKey: finalFile?.Key ?? null,
    segmentCount,
    objects,
  };
}

export async function ensureFinalRecordingForSession(options: {
  table: RecordingTable;
  sessionId: string;
  chimeMeetingId?: string | null;
  currentRecordingUrl?: string | null;
  currentShareId?: string | null;
  clearStaleSegment?: boolean;
  allowManualConcat?: boolean;
}) {
  const {
    table,
    sessionId,
    chimeMeetingId = null,
    currentRecordingUrl = null,
    currentShareId = null,
    clearStaleSegment = false,
    allowManualConcat = false,
  } = options;

  const admin = createAdminClient();
  const inspection = await inspectChimeRecordingArtifacts(sessionId);

  if (!inspection.bucketConfigured) {
    return {
      status: "missing_bucket" as const,
      recordingUrl: currentRecordingUrl,
      recordingShareId: currentShareId,
      finalKey: null,
      segmentCount: 0,
    };
  }

  let finalKey = inspection.finalKey;
  if (!finalKey && allowManualConcat && inspection.segmentCount > 0) {
    finalKey = await buildManualConcatenatedRecording(sessionId, inspection.objects);
  }

  if (finalKey) {
    const signedUrl = await getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: RECORDING_BUCKET,
        Key: finalKey,
      }),
      { expiresIn: 7 * 24 * 60 * 60 },
    );

    const shareId = currentShareId ?? generateShareId();

    await admin
      .from(table)
      .update({
        recording_url: signedUrl,
        recording_share_id: shareId,
      })
      .eq("id", sessionId);

    if (table === "bookings" && chimeMeetingId) {
      await admin
        .from("video_sessions")
        .update({ recording_url: signedUrl })
        .eq("chime_meeting_id", chimeMeetingId);
    }

    return {
      status: "final" as const,
      recordingUrl: signedUrl,
      recordingShareId: shareId,
      finalKey,
      segmentCount: inspection.segmentCount,
    };
  }

  if (clearStaleSegment && isSegmentRecordingUrl(currentRecordingUrl)) {
    await admin
      .from(table)
      .update({ recording_url: null })
      .eq("id", sessionId);

    if (table === "bookings" && chimeMeetingId) {
      await admin
        .from("video_sessions")
        .update({ recording_url: null })
        .eq("chime_meeting_id", chimeMeetingId);
    }
  }

  return {
    status: inspection.segmentCount > 0 ? ("processing" as const) : ("no_files" as const),
    recordingUrl:
      clearStaleSegment && isSegmentRecordingUrl(currentRecordingUrl)
        ? null
        : currentRecordingUrl,
    recordingShareId: currentShareId,
    finalKey: null,
    segmentCount: inspection.segmentCount,
  };
}
