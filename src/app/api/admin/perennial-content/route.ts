import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const content_type = searchParams.get("content_type") ?? "";
  const status = searchParams.get("status") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("perennial_content")
    .select("id, title, content_type, description, image_url, video_url, pdf_url, youtube_url, live_stream_url, display_start_at, display_end_at, available_for_all, status, priority, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (content_type) query = query.eq("content_type", content_type);
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, content_type, description, image_url, video_url, pdf_url, youtube_url,
    live_stream_url, display_start_at, display_end_at, available_for_all, priority, status,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("perennial_content")
    .insert({
      title,
      content_type: content_type || "text",
      description: description || null,
      image_url: image_url || null,
      video_url: video_url || null,
      pdf_url: pdf_url || null,
      youtube_url: youtube_url || null,
      live_stream_url: live_stream_url || null,
      display_start_at: display_start_at || null,
      display_end_at: display_end_at || null,
      available_for_all: !!available_for_all,
      priority: priority ?? 0,
      status: status || "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
