import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";



export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const createdFrom = sp.get("created_from");
  const createdTo = sp.get("created_to");
  const updatedFrom = sp.get("updated_from");
  const updatedTo = sp.get("updated_to");

  const admin = createAdminClient();
  let query = admin
    .from("social_advocacy")
    .select("*")
    .order("created_at", { ascending: false });

  if (createdFrom) query = query.gte("created_at", createdFrom);
  if (createdTo) query = query.lte("created_at", createdTo + "T23:59:59");
  if (updatedFrom) query = query.gte("updated_at", updatedFrom);
  if (updatedTo) query = query.lte("updated_at", updatedTo + "T23:59:59");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, frequency, link, image_url, audio_url, is_active } = body;

  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("social_advocacy")
    .insert({ title, frequency: frequency ?? "Weekly", link: link ?? null, image_url: image_url ?? null, audio_url: audio_url ?? null, is_active: is_active ?? true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
