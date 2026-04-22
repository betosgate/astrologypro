import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext<"/api/admin/service-template-intakes/[id]">,
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { submission_status?: string };
  try {
    body = (await req.json()) as { submission_status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!["new", "reviewed", "archived"].includes(body.submission_status ?? "")) {
    return NextResponse.json({ error: "Invalid submission status" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("service_template_intake_submissions")
    .update({ submission_status: body.submission_status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submission: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext<"/api/admin/service-template-intakes/[id]">,
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("service_template_intake_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
