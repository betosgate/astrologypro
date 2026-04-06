import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";



export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const createdFrom = sp.get("created_from") ?? "";
  const createdTo = sp.get("created_to") ?? "";

  const admin = createAdminClient();
  let query = admin
    .from("sunday_service_sessions")
    .select("*")
    .order("recorded_at", { ascending: false });

  if (createdFrom) query = query.gte("recorded_at", createdFrom);
  if (createdTo) query = query.lte("recorded_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, video_url, thumbnail_url, recorded_at, is_live, live_starts_at } = body;

  if (!title || !video_url) {
    return NextResponse.json({ error: "title and video_url are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sunday_service_sessions")
    .insert({
      title,
      description: description ?? null,
      video_url,
      thumbnail_url: thumbnail_url ?? null,
      recorded_at: recorded_at ?? new Date().toISOString(),
      is_live: is_live ?? false,
      live_starts_at: live_starts_at ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
