import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


// GET /api/admin/testimonials — list all
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");

  const admin = createAdminClient();
  let query = admin
    .from("testimonials")
    .select("*, diviners(display_name)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonials: data });
}

// POST /api/admin/testimonials — create
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    diviner_id?: string;
    client_name?: string | null;
    rating?: number | null;
    text?: string;
    service_type?: string | null;
    title?: string | null;
    images?: object[];
    audio?: object[];
    video?: object[];
    is_featured?: boolean;
    status?: string;
    requested_to_email?: string | null;
    requested_to_phone_no?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    diviner_id,
    client_name,
    rating,
    text,
    service_type,
    title,
    images,
    audio,
    video,
    is_featured,
    status,
    requested_to_email,
    requested_to_phone_no,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }
  if (!diviner_id) {
    return NextResponse.json({ error: "Diviner is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const added_by_name = user.email ?? null;

  const { data, error } = await admin
    .from("testimonials")
    .insert({
      diviner_id,
      client_name: client_name ?? null,
      rating: rating ?? null,
      text: text.trim(),
      service_type: service_type ?? null,
      title: title.trim(),
      images: images ?? [],
      audio: audio ?? [],
      video: video ?? [],
      is_featured: is_featured ?? false,
      status: status ?? "pending",
      requested_to_email: requested_to_email?.toLowerCase() ?? null,
      requested_to_phone_no: requested_to_phone_no ?? null,
      added_by_name,
      added_by_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonial: data }, { status: 201 });
}
