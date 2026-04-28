import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Same generous timeout as the existing admin training upload — large
// ritual videos can be 100s of MB.
export const maxDuration = 300;

/**
 * POST /api/admin/ritual-assets/upload
 *
 * Server-mediated admin file upload for ritual media. Mirrors
 * /api/admin/training/upload's pattern: the client sends a file via
 * multipart/form-data; we upload through the service-role admin client
 * (which bypasses RLS) and return the public URL.
 *
 * Uses the existing shared `all-frontend-assets` bucket with a
 * `rituals/` prefix so we don't need to provision a new bucket. The
 * caller is then expected to POST to /api/admin/ritual-assets with
 * `source_type: "upload"` + the returned `storage_path` to register
 * the asset row.
 *
 * Body: multipart/form-data with a `file` field.
 * Response (200): { storage_path: string, public_url: string, mime_type, size_bytes }
 * Errors: 401, 400, 413, 415, 500
 */

const BUCKET = "all-frontend-assets";
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB — match training-videos cap
const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
]);

function safeFilename(name: string): string {
  // Strip path separators, keep ASCII alphanumerics + . _ -.
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 80 ? base.slice(-80) : base;
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No `file` field in upload" },
      { status: 400 }
    );
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `File too large. Max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`,
      },
      { status: 413 }
    );
  }

  // Allowlist mime types — we never auto-detect from extension alone.
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${file.type || "unknown"}. Allowed: ${Array.from(ALLOWED_TYPES).join(", ")}`,
      },
      { status: 415 }
    );
  }

  const admin = createAdminClient();
  const stamp = Date.now();
  const safeName = safeFilename(file.name || "ritual.mp4");
  const path = `rituals/${stamp}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = admin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({
    storage_path: publicUrlData.publicUrl,
    public_url: publicUrlData.publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
  });
}
