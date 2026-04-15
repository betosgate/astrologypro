import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET /api/admin/certificate-config ─────────────────────────────────────────
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("certificate_config")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: 404, title: "Config not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// ── PUT /api/admin/certificate-config ─────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ status: 403, title: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: 400, title: "Invalid JSON" }, { status: 400 });
  }

  const {
    id,
    school_name,
    school_tagline,
    designation_title,
    program_title,
    head_master_name,
    study_hours,
    live_classroom_hours,
    live_readings,
    certification_count,
    astrology_programs,
    tarot_programs,
  } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ status: 422, title: "id is required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("certificate_config")
    .update({
      school_name: typeof school_name === "string" ? school_name.trim() : undefined,
      school_tagline: typeof school_tagline === "string" ? school_tagline.trim() : undefined,
      designation_title: typeof designation_title === "string" ? designation_title.trim() : undefined,
      program_title: typeof program_title === "string" ? program_title.trim() : undefined,
      head_master_name: typeof head_master_name === "string" ? head_master_name.trim() : undefined,
      study_hours: typeof study_hours === "string" ? study_hours.trim() : undefined,
      live_classroom_hours: typeof live_classroom_hours === "string" ? live_classroom_hours.trim() : undefined,
      live_readings: typeof live_readings === "string" ? live_readings.trim() : undefined,
      certification_count: typeof certification_count === "string" ? certification_count.trim() : undefined,
      astrology_programs: Array.isArray(astrology_programs)
        ? astrology_programs.filter((p) => typeof p === "string" && p.trim())
        : undefined,
      tarot_programs: Array.isArray(tarot_programs)
        ? tarot_programs.filter((p) => typeof p === "string" && p.trim())
        : undefined,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { status: 500, title: "Database error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
