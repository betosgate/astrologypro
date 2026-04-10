import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/training/upload
 *
 * Server-mediated admin video upload for training lessons. The client
 * sends the file as multipart/form-data; this route uploads it to
 * Supabase Storage using the admin (service-role) client which bypasses
 * RLS — fixing the "new row violates row-level security policy" error
 * that occurs when the browser client tries to write directly to the
 * `training-videos` bucket.
 *
 * Body: multipart/form-data with a `file` field
 * Response (200): { url: string }  — the public URL of the uploaded file
 * Errors: 401, 400, 413, 500
 */

const BUCKET = "training-videos";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
]);

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

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `File type '${file.type}' is not allowed. Accepted: MP4, WebM, OGG, MOV, AVI.`,
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
      },
      { status: 413 },
    );
  }

  const ext = file.name.split(".").pop() ?? "mp4";
  const storagePath = `lessons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();

  // Convert File to ArrayBuffer for the admin upload. The service-role
  // client bypasses storage RLS — this is the intended secure admin path.
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
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
          error:
            `The file (${(file.size / (1024 * 1024)).toFixed(1)} MB) was rejected by the storage bucket's file_size_limit. ` +
            `Run migration 20260410000001 from Admin → DB Migrations to increase the bucket limit to 500 MB.`,
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
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: publicData.publicUrl });
}
