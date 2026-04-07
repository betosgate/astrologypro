import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/lessons/[id]/assets
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("lesson_assets")
    .select("id, lesson_id, title, asset_type, url, file_size_bytes, is_downloadable, priority")
    .eq("lesson_id", id)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data ?? [] });
}

// POST /api/admin/training/lessons/[id]/assets
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: {
    title?: string;
    asset_type?: string;
    url?: string;
    file_size_bytes?: number | null;
    is_downloadable?: boolean;
    priority?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, asset_type, url, file_size_bytes, is_downloadable, priority } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 422 });
  }

  const ALLOWED_ASSET_TYPES = ["pdf", "doc", "image", "link", "other"];
  if (!asset_type || !ALLOWED_ASSET_TYPES.includes(asset_type)) {
    return NextResponse.json(
      { error: `asset_type must be one of: ${ALLOWED_ASSET_TYPES.join(", ")}.` },
      { status: 422 }
    );
  }

  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "URL is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_assets")
    .insert({
      lesson_id: id,
      title: title.trim(),
      asset_type,
      url: url.trim(),
      file_size_bytes: file_size_bytes ?? null,
      is_downloadable: is_downloadable ?? false,
      priority: priority ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ asset: data }, { status: 201 });
}

// DELETE /api/admin/training/lessons/[id]/assets?asset_id=
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const assetId = req.nextUrl.searchParams.get("asset_id");

  if (!assetId) {
    return NextResponse.json({ error: "asset_id query param is required." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Enforce object-level: asset must belong to this lesson
  const { data: existing, error: fetchError } = await admin
    .from("lesson_assets")
    .select("id")
    .eq("id", assetId)
    .eq("lesson_id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const { error } = await admin.from("lesson_assets").delete().eq("id", assetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
