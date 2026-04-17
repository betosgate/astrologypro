import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/admin/tarot/upload
 *
 * Server-mediated admin image upload for tarot cards and spreads.
 * Uses the admin (service-role) client to bypass storage RLS.
 *
 * Body: multipart/form-data with a `file` field and optional `kind`
 * field (`card` | `spread`).
 * Response (200): { url: string } — the public URL of the uploaded file
 */

const BUCKET = "all-frontend-assets";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
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
      { error: `File type '${file.type}' is not allowed. Accepted: JPEG, PNG, WebP, GIF.` },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 },
    );
  }

  const kind = typeof formData.get("kind") === "string" ? String(formData.get("kind")) : "card";
  const prefix = kind === "spread"
    ? "divine-infinity-being/tarot-spread-image"
    : "divine-infinity-profile-images";

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("[admin/tarot/upload] storage error:", uploadError.message);
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const { data: publicData } = admin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({ url: publicData.publicUrl });
}
