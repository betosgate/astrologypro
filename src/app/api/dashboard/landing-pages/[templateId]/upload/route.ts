/**
 * POST /api/dashboard/landing-pages/[templateId]/upload
 * Upload an image for use in landing page sections.
 * Stored in Supabase Storage: all-frontend-assets/landing-pages/{diviner_id}/{template_id}/{filename}
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "all-frontend-assets";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { templateId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: 401, title: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!diviner) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  // Verify template access
  const { data: ds } = await admin
    .from("diviner_services")
    .select("is_enabled")
    .eq("diviner_id", diviner.id)
    .eq("template_id", templateId)
    .maybeSingle();
  if (!ds?.is_enabled) {
    return NextResponse.json({ status: 403, title: "Service not enabled" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ status: 422, title: "Expected multipart/form-data" }, { status: 422 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ status: 422, title: "file field required" }, { status: 422 });
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `File type ${file.type} not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      { status: 422 },
    );
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/422", title: "Validation error", status: 422, detail: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.` },
      { status: 422 },
    );
  }

  // Generate safe filename
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `landing-pages/${diviner.id}/${templateId}/${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { type: "https://httpstatuses.com/500", title: "Upload failed", status: 500, detail: uploadError.message },
      { status: 500 },
    );
  }

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    url: publicUrl.publicUrl,
    filename: safeName,
    size: file.size,
    content_type: file.type,
  }, { status: 201 });
}
