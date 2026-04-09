import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function getDiviner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return data;
}

export async function GET() {
  const diviner = await getDiviner();
  if (!diviner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_templates")
    .select("*")
    .or(`owner_id.eq.${diviner.id},diviner_id.eq.${diviner.id}`)
    .order("start_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  const diviner = await getDiviner();
  if (!diviner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const {
    title,
    start_date,
    end_date,
    weekdays,
    start_time,
    end_time,
    timezone,
    duration_minutes,
    description,
    is_active,
    service_id,
  } = body;
  if (!start_date || !end_date || !weekdays?.length || !start_time || !end_time || !timezone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }
  const admin = createAdminClient();

  if (service_id) {
    const { data: service } = await admin
      .from("services")
      .select("id")
      .or(`owner_id.eq.${diviner.id},diviner_id.eq.${diviner.id}`)
      .eq("id", service_id)
      .maybeSingle();

    if (!service) {
      return NextResponse.json({ error: "Selected service not found." }, { status: 422 });
    }
  }

  const insertPayload: Record<string, unknown> = {
    owner_id: diviner.id,
    diviner_id: diviner.id,
    title: title || "Available",
    start_date,
    end_date,
    weekdays,
    start_time,
    end_time,
    timezone,
    duration_minutes: duration_minutes || 60,
    description: description || null,
    is_active: is_active ?? true,
  };

  if (service_id) {
    insertPayload.service_id = service_id;
  }

  const insertQuery = admin
    .from("availability_templates")
    .insert(insertPayload)
    .select();

  let { data, error } = await insertQuery.single();

  if (error && service_id && error.message.toLowerCase().includes("service_id")) {
    delete insertPayload.service_id;
    ({ data, error } = await admin
      .from("availability_templates")
      .insert(insertPayload)
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
