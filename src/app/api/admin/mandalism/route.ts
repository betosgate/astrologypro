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
    .from("mandalism_content")
    .select("*")
    .order("priority", { ascending: true });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    content_type,
    title,
    description,
    url,
    pdf_url,
    content_body,
    content_thumbnail_url,
    duration_label,
    start_at,
    end_at,
    access_control,
    priority,
    is_published,
  } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!content_type) return NextResponse.json({ error: "Content type is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mandalism_content")
    .insert({
      content_type,
      title,
      description,
      url,
      pdf_url,
      content_body,
      content_thumbnail_url: content_thumbnail_url ?? null,
      duration_label: duration_label ?? null,
      start_at,
      end_at,
      access_control: access_control ?? "members",
      priority: priority ?? 0,
      is_published: is_published ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
