import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/training/lessons/[id]/videos
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
    .from("lesson_videos")
    .select("id, lesson_id, title, video_url, duration_mins, priority")
    .eq("lesson_id", id)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: data ?? [] });
}

// POST /api/admin/training/lessons/[id]/videos
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
    video_url?: string;
    duration_mins?: number | null;
    priority?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, video_url, duration_mins, priority } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 422 });
  }

  if (!video_url || typeof video_url !== "string" || !video_url.trim()) {
    return NextResponse.json({ error: "video_url is required." }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_videos")
    .insert({
      lesson_id: id,
      title: title.trim(),
      video_url: video_url.trim(),
      duration_mins: duration_mins ?? null,
      priority: priority ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ video: data }, { status: 201 });
}

// DELETE /api/admin/training/lessons/[id]/videos?video_id=
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const videoId = req.nextUrl.searchParams.get("video_id");

  if (!videoId) {
    return NextResponse.json({ error: "video_id query param is required." }, { status: 422 });
  }

  const admin = createAdminClient();

  // Enforce object-level: video must belong to this lesson
  const { data: existing, error: fetchError } = await admin
    .from("lesson_videos")
    .select("id")
    .eq("id", videoId)
    .eq("lesson_id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const { error } = await admin.from("lesson_videos").delete().eq("id", videoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
