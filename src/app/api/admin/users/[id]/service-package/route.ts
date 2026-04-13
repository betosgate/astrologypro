import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as {
    role?: string;
    service_package_code?: string;
  };

  if (body.role !== "diviner" && body.role !== "trainee") {
    return NextResponse.json(
      { error: "role must be diviner or trainee" },
      { status: 422 },
    );
  }

  if (!body.service_package_code) {
    return NextResponse.json(
      { error: "service_package_code is required" },
      { status: 422 },
    );
  }

  const admin = createAdminClient();
  const table = body.role === "diviner" ? "diviners" : "trainees";

  const { data, error } = await admin
    .from(table)
    .update({
      service_package_code: body.service_package_code,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", id)
    .select("id, service_package_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assignment: data });
}
