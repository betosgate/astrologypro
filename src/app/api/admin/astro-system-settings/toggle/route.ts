import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // const user = await getAdminUser();
  // if (!user) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const body = await req.json();
  const secretValue =
    typeof body?.secret_value === "string" ? body.secret_value.trim() : "";

  if (!secretValue) {
    return NextResponse.json(
      { error: "secret_value is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("astro_system_settings")
    .select("id, type, key_name, key_value, secret_value, status, updated_at")
    .eq("secret_value", secretValue)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json(
      { error: "No astro system setting found for the provided secret_value" },
      { status: 404 }
    );
  }

  const nextStatus = existing.status === "active" ? "inactive" : "active";

  const { data: updated, error: updateError } = await admin
    .from("astro_system_settings")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("id, type, key_name, key_value, secret_value, status, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Status changed to ${nextStatus}`,
    data: updated,
  });
}
