import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Extend the serverless function timeout to 300 s (5 min).
 *
 * Without this the Vercel default (~60 s on Pro, ~10 s on Hobby) causes
 * uploads of ~200 MB+ to be killed mid-transfer with a 504 Gateway Timeout
 * before the Supabase Storage PUT completes.
 */
export const maxDuration = 300;

/**
 * POST /api/admin/training/upload
 *
 * Server-mediated admin file upload for training lessons. The client
 * sends the file as multipart/form-data; this route uploads it to
 * Supabase Storage using the admin (service-role) client which bypasses
 * RLS — fixing the "new row violates row-level security policy" error
 * that occurs when the browser client tries to write directly to storage.
 *
 * Body: multipart/form-data with a `file` field and optional `kind`
 * field (`video` | `pdf` | `audio`).
 * Response (200): { url: string }  — the public URL of the uploaded file
 * Errors: 401, 400, 413, 500
 */

const VIDEO_BUCKET = "training-videos";
const PDF_BUCKET = "all-frontend-assets";
const AUDIO_BUCKET = "all-frontend-assets";
const VIDEO_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const PDF_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const AUDIO_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — fits the 'all-frontend-assets' bucket cap

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
]);

const PDF_TYPES = new Set(["application/pdf"]);

const AUDIO_TYPES = new Set([
  "audio/mpeg",       // .mp3
  "audio/mp3",        // some browsers / Safari
  "audio/mp4",        // .m4a (mp4 audio container)
  "audio/x-m4a",      // .m4a alt
  "audio/aac",        // .aac
  "audio/wav",        // .wav
  "audio/x-wav",      // .wav alt
  "audio/webm",       // .webm
  "audio/ogg",        // .ogg
  "audio/flac",       // .flac
]);

function getUploadConfig(kind: string | null) {
  if (kind === "pdf") {
    return {
      bucket: PDF_BUCKET,
      maxFileSize: PDF_MAX_FILE_SIZE,
      allowedTypes: PDF_TYPES,
      acceptedLabel: "PDF",
      storagePrefix: "training/pdfs",
      oversizedMessage:
        "This PDF is larger than the current 50 MB document upload limit. Please upload a smaller file.",
      bucketLimitMessage:
        "This PDF was rejected by the storage bucket size limit. Increase the all-frontend-assets bucket limit if larger training documents need to be supported.",
    };
  }

  if (kind === "audio") {
    return {
      bucket: AUDIO_BUCKET,
      maxFileSize: AUDIO_MAX_FILE_SIZE,
      allowedTypes: AUDIO_TYPES,
      acceptedLabel: "MP3, M4A, AAC, WAV, OGG, WebM, FLAC",
      storagePrefix: "training/audio",
      oversizedMessage:
        "This audio file is larger than the current 50 MB upload limit. Please upload a smaller or compressed file.",
      bucketLimitMessage:
        "This audio file was rejected by the storage bucket size limit. Increase the all-frontend-assets bucket limit if larger training audio files need to be supported.",
    };
  }

  return {
    bucket: VIDEO_BUCKET,
    maxFileSize: VIDEO_MAX_FILE_SIZE,
    allowedTypes: VIDEO_TYPES,
    acceptedLabel: "MP4, WebM, OGG, MOV, AVI",
    storagePrefix: "lessons",
    oversizedMessage: `File size exceeds the ${VIDEO_MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
    bucketLimitMessage:
      "The file was rejected by the storage bucket's file_size_limit. Run migration 20260410000001 from Admin → DB Migrations to increase the bucket limit to 500 MB.",
  };
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart/form-data body." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "A 'file' field with a valid file is required." },
      { status: 400 },
    );
  }

  const kind = typeof formData.get("kind") === "string" ? String(formData.get("kind")) : null;
  const config = getUploadConfig(kind);

  if (!config.allowedTypes.has(file.type)) {
    return NextResponse.json(
      {
        error: `File type '${file.type}' is not allowed. Accepted: ${config.acceptedLabel}.`,
      },
      { status: 400 },
    );
  }

  if (file.size > config.maxFileSize) {
    return NextResponse.json(
      {
        error: config.oversizedMessage,
      },
      { status: 413 },
    );
  }

  const ext =
    file.name.split(".").pop() ??
    (kind === "pdf" ? "pdf" : kind === "audio" ? "mp3" : "mp4");
  const storagePath = `${config.storagePrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();

  // Convert File → ArrayBuffer → Buffer for the admin upload.
  // The service-role client bypasses storage RLS.
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(config.bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[admin/training/upload] storage error:", uploadError.message);

    // Detect Supabase bucket-level size rejection and return a descriptive
    // 413 instead of a generic 500 so the UI can guide the admin.
    const isBucketSizeError =
      uploadError.message?.includes("exceeded the maximum allowed size") ||
      uploadError.message?.includes("Payload too large");

    if (isBucketSizeError) {
      return NextResponse.json(
        {
          error: config.bucketLimitMessage,
        },
        { status: 413 },
      );
    }

    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: publicData } = admin.storage
    .from(config.bucket)
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: publicData.publicUrl });
}
