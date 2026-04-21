import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  void req;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("availability_templates")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  } = body;

  if (
    !start_date ||
    !end_date ||
    !Array.isArray(weekdays) ||
    weekdays.length === 0 ||
    !start_time ||
    !end_time ||
    !timezone
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }

  const admin = createAdminClient();
  const insertPayload = {
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
    created_by: user.id,
  };

  let { data, error } = await admin
    .from("availability_templates")
    .insert(insertPayload)
    .select()
    .single();

  if (error && error.message.toLowerCase().includes("created_by")) {
    delete (insertPayload as Record<string, unknown>).created_by;
    ({ data, error } = await admin
      .from("availability_templates")
      .insert(insertPayload)
      .select()
      .single());
  }

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("diviner_id") &&
      (msg.includes("null value") || msg.includes("not-null"))
    ) {
      return NextResponse.json(
        {
          error:
            "Admin-owned availability requires a pending database migration. Go to /admin/db/migrations and apply '20260417000021_availability_templates_created_by' and '20260417000023_availability_templates_admin_owned' in order, then try again.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ template: data }, { status: 201 });
}
